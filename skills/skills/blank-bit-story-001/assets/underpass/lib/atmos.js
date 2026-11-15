// Atmosphere: rain lit by the lights it falls past, volumetric cones under lamps, glow
// cards around practicals, and a wet floor that reflects the scene in vertical streaks.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const MAX_LIGHTS = 8;

/** Lights the rain and the floor can see. Each: { pos: Vector3, color: Color, power } */
export function lightUniforms(list) {
  const pos = [], col = [];
  for (let i = 0; i < MAX_LIGHTS; i++) {
    const l = list[i];
    pos.push(l ? l.pos : new THREE.Vector3(0, -999, 0));
    col.push(l ? l.color.clone().multiplyScalar(l.power) : new THREE.Color(0));
  }
  return { lPos: { value: pos }, lCol: { value: col } };
}

const LIGHT_SUM = /* glsl */ `
  uniform vec3 lPos[${MAX_LIGHTS}]; uniform vec3 lCol[${MAX_LIGHTS}];
  vec3 lightAt( vec3 p ) {
    vec3 s = vec3( 0.0 );
    for ( int i = 0; i < ${MAX_LIGHTS}; i++ ) { vec3 d = lPos[i] - p; s += lCol[i] / ( 1.0 + dot( d, d ) ); }
    return s;
  }
`;

/**
 * Rain as instanced streaks in a box that follows the camera. Each streak's brightness is
 * the sum of nearby lights, so rain is invisible in the dark and silver under a lamp.
 */
export function createRain(lights, o = {}) {
  const count = o.count ?? 5000;
  const box = new THREE.Vector3(o.w ?? 46, o.h ?? 16, o.d ?? 22);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) seed[i] = Math.random();
  geo.setAttribute('seed', new THREE.InstancedBufferAttribute(seed, 4));
  geo.instanceCount = count;
  const uniforms = {
    time: { value: 0 }, origin: { value: new THREE.Vector3() }, box: { value: box },
    speed: { value: o.speed ?? 22 }, slant: { value: o.slant ?? 0.14 }, len: { value: o.len ?? 0.55 },
    width: { value: o.width ?? 0.022 }, ambient: { value: new THREE.Color(o.ambient ?? 0x1c2c32) },
    fogDensity: { value: o.fogDensity ?? 0.02 },
    ...lightUniforms(lights),
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 seed; uniform float time, speed, slant, len, width, fogDensity; uniform vec3 origin, box;
      varying vec3 vLight; varying vec2 vUv; varying float vFade;
      ${LIGHT_SUM}
      void main() {
        float fall = speed * ( 0.85 + seed.w * 0.3 );
        vec3 p = vec3( seed.x, seed.y, seed.z ) * box - box * 0.5;
        p.y = mod( p.y - time * fall, box.y ) ;
        p.x = mod( p.x + p.y * slant - origin.x + box.x * 0.5, box.x ) - box.x * 0.5 + origin.x;
        p.z += origin.z;
        vec3 dir = normalize( vec3( - slant, - 1.0, 0.0 ) );
        // streak spans the distance a drop falls in ~1/40 s, scaled by len
        vec3 wp = p - dir * position.y * len * ( 0.7 + seed.w * 0.6 );
        vLight = lightAt( wp );
        // widen in view space, perpendicular to the streak as the camera sees it. The world
        // space cross( dir, toCam ) version drew nothing on ANGLE/Metal, so it is avoided.
        vec4 mv = viewMatrix * vec4( wp, 1.0 );
        vec2 vd = ( viewMatrix * vec4( dir, 0.0 ) ).xy;
        vec2 nrm = vec2( - vd.y, vd.x ) / max( length( vd ), 1e-4 );
        mv.xy += nrm * position.x * width * ( 0.6 + seed.x * 0.8 );
        vFade = exp( - pow( length( mv.xyz ) * fogDensity, 2.0 ) ) * smoothstep( 0.0, 1.5, p.y );
        vUv = uv;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 ambient; varying vec3 vLight; varying vec2 vUv; varying float vFade;
      void main() {
        float a = ( 1.0 - abs( vUv.x * 2.0 - 1.0 ) ) * smoothstep( 0.0, 0.3, vUv.y ) * ( 1.0 - smoothstep( 0.6, 1.0, vUv.y ) );
        gl_FragColor = vec4( ( ambient + vLight * 0.22 ) * a * vFade, 1.0 );
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  return { mesh, uniforms };
}

/** Splashes: short-lived rings on the floor, timed per instance from a hash of time. */
export function createSplashes(lights, o = {}) {
  const count = o.count ?? 900;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3));
  geo.setIndex([0, 2, 1, 0, 3, 2]);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) seed[i] = Math.random();
  geo.setAttribute('seed', new THREE.InstancedBufferAttribute(seed, 3));
  geo.instanceCount = count;
  const uniforms = { time: { value: 0 }, origin: { value: new THREE.Vector3() }, area: { value: new THREE.Vector2(40, 18) }, ...lightUniforms(lights) };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 seed; uniform float time; uniform vec3 origin; uniform vec2 area;
      varying vec2 vP; varying float vAge; varying vec3 vLight;
      ${LIGHT_SUM}
      void main() {
        float life = 0.32;
        float t = time / life + seed.z * 17.0;
        float cyc = floor( t ); vAge = fract( t );
        // new position each cycle
        vec2 h = fract( sin( vec2( cyc * 12.9898 + seed.x * 78.233, cyc * 39.346 + seed.y * 11.135 ) ) * 43758.5453 );
        vec3 c = vec3( origin.x + ( h.x - 0.5 ) * area.x, 0.012, origin.z + ( h.y - 0.5 ) * area.y );
        float r = 0.04 + vAge * 0.16;
        vP = position.xz;
        vLight = lightAt( c + vec3( 0.0, 0.3, 0.0 ) );
        gl_Position = projectionMatrix * viewMatrix * vec4( c + position * r, 1.0 );
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vP; varying float vAge; varying vec3 vLight;
      void main() {
        float d = length( vP );
        float ring = smoothstep( 0.75, 0.9, d ) * ( 1.0 - smoothstep( 0.92, 1.0, d ) );
        gl_FragColor = vec4( vLight * 0.22 * ring * ( 1.0 - vAge ), 1.0 );
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

/**
 * A light cone hanging from `apex` down to the floor. Brightest at the apex and along the
 * axis, fading where the surface turns edge-on to the camera, with slow drifting dust.
 */
export function createCone(apex, color, o = {}) {
  const h = o.height ?? apex.y, rBottom = o.radius ?? h * Math.tan(o.angle ?? 0.5);
  const geo = new THREE.CylinderGeometry(o.rTop ?? 0.12, rBottom, h, 48, 24, true);
  geo.translate(0, -h / 2, 0);
  const uniforms = {
    color: { value: new THREE.Color(color) }, intensity: { value: o.intensity ?? 0.5 }, time: { value: 0 }, h: { value: h },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vN, vV, vL; varying float vY;
      void main() {
        vec4 wp = modelMatrix * vec4( position, 1.0 );
        vN = normalize( mat3( modelMatrix ) * normal ); vV = normalize( cameraPosition - wp.xyz );
        vL = position; vY = - position.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform float intensity, time, h; varying vec3 vN, vV, vL; varying float vY;
      float n3( vec3 p ) { return fract( sin( dot( floor( p ), vec3( 7.1, 157.3, 113.7 ) ) ) * 43758.5 ); }
      float vnoise( vec3 p ) {
        vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
        return mix( mix( mix( n3( i ), n3( i + vec3( 1, 0, 0 ) ), f.x ), mix( n3( i + vec3( 0, 1, 0 ) ), n3( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
                    mix( mix( n3( i + vec3( 0, 0, 1 ) ), n3( i + vec3( 1, 0, 1 ) ), f.x ), mix( n3( i + vec3( 0, 1, 1 ) ), n3( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
      }
      void main() {
        float t = vY / h;
        float edge = pow( abs( dot( vN, vV ) ), 1.6 );
        float fall = pow( 1.0 - t, 1.4 ) * ( 0.25 + 0.75 * smoothstep( 0.0, 0.08, t ) );
        float dust = 0.65 + 0.7 * vnoise( vL * 2.2 + vec3( 0.0, time * 0.25, time * 0.1 ) );
        gl_FragColor = vec4( color * intensity * edge * fall * dust, 1.0 );
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(apex);
  mesh.renderOrder = 5;
  return { mesh, uniforms };
}

/** Camera-facing glow card: soft haze around a practical light, wider than bloom. */
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,.45)');
  gr.addColorStop(0.45, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
export function createGlow(pos, color, size, intensity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(color).multiplyScalar(intensity), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: true });
  const s = new THREE.Sprite(m);
  s.position.copy(pos); s.scale.set(size, size, 1); s.renderOrder = 6;
  return s;
}

/**
 * Wet floor reflection laid over the lit floor. Puddles come from world-space noise; the
 * reflection is smeared vertically on screen, as wet asphalt does, and rippled by rain.
 */
export function createWetReflection(size, o = {}) {
  const shader = {
    name: 'WetReflection',
    uniforms: {
      color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      time: { value: 0 }, strength: { value: o.strength ?? 0.9 }, fogDensity: { value: o.fogDensity ?? 0.02 },
      puddleScale: { value: o.puddleScale ?? 0.28 }, wetBase: { value: o.wetBase ?? 0.28 },
    },
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main() {
        vUv = textureMatrix * vec4( position, 1.0 );
        vW = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4( vW, 1.0 );
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float time, strength, fogDensity, puddleScale, wetBase; uniform vec3 color;
      varying vec4 vUv; varying vec3 vW;
      float h2( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
      float vn( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
        return mix( mix( h2( i ), h2( i + vec2( 1, 0 ) ), f.x ), mix( h2( i + vec2( 0, 1 ) ), h2( i + vec2( 1, 1 ) ), f.x ), f.y ); }
      float fbm( vec2 p ) { float s = 0.0, a = 0.5; for ( int i = 0; i < 4; i++ ) { s += a * vn( p ); p *= 2.03; a *= 0.5; } return s; }
      void main() {
        vec2 p = vW.xz;
        float puddle = smoothstep( 0.5, 0.58, fbm( p * puddleScale * vec2( 1.0, 2.2 ) ) );
        // rain rings: a few expanding circles per cell, cheap and only in puddles
        vec2 cell = floor( p * 2.5 ); vec2 f = fract( p * 2.5 ) - 0.5;
        float ph = fract( time * 1.7 + h2( cell ) );
        float ring = sin( ( length( f - ( vec2( h2( cell + 3.1 ), h2( cell + 7.7 ) ) - 0.5 ) * 0.5 ) - ph * 0.5 ) * 60.0 ) * ( 1.0 - ph );
        vec2 uv = vUv.xy / vUv.w;
        uv.x += ring * 0.0025 * puddle;
        float rough = mix( 0.012, 0.0025, puddle );
        vec3 acc = vec3( 0.0 ); float ws = 0.0;
        for ( int k = -7; k <= 7; k++ ) {
          float w = exp( - float( k * k ) / 18.0 );
          acc += texture2D( tDiffuse, uv + vec2( ( h2( vec2( float( k ), floor( vW.x * 24.0 ) ) ) - 0.5 ) * rough * 0.15, float( k ) * rough ) ).rgb * w;
          ws += w;
        }
        acc /= ws;
        float wet = mix( wetBase, 1.0, puddle );
        float d = length( cameraPosition - vW );
        float fog = exp( - pow( d * fogDensity, 2.0 ) );
        gl_FragColor = vec4( acc * wet * strength * fog, 1.0 );
      }`,
  };
  const geo = new THREE.PlaneGeometry(size.x, size.y);
  const refl = new Reflector(geo, {
    shader, textureWidth: o.textureWidth ?? 960, textureHeight: o.textureHeight ?? 540, clipBias: 0.003, multisample: 0,
  });
  refl.material.transparent = true;
  refl.material.blending = THREE.AdditiveBlending;
  refl.material.depthWrite = false;
  refl.rotation.x = -Math.PI / 2;
  refl.position.y = 0.004;
  refl.renderOrder = 2;
  return refl;
}
