// Post chain: scene with depth -> depth of field -> bloom -> tone map -> film grade.
// Depth of field reads a real depth texture, so alpha-tested sprites blur by their own
// silhouette, and near occluders spill their blur over sharp pixels behind them.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const COC_GLSL = /* glsl */ `
  uniform float cNear, cFar, focus, aperture, maxFar, maxNear;
  float linearDepth( float d ) {
    float z = d * 2.0 - 1.0;
    return 2.0 * cNear * cFar / ( cFar + cNear - z * ( cFar - cNear ) );
  }
  // Signed circle of confusion in pixels: negative in front of focus, positive behind.
  float coc( float d ) {
    float z = linearDepth( d );
    float c = ( z - focus ) / z * aperture;
    return c < 0.0 ? max( c, - maxNear ) : min( c, maxFar );
  }
`;

class SceneDofPass extends Pass {
  constructor(scene, camera, o) {
    super();
    this.scene = scene; this.camera = camera;
    // No MSAA: a multisampled target with a depth texture resolves to black on ANGLE/Metal.
    this.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
    this.rt.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    this.nearRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    const uniforms = {
      tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, tNear: { value: this.nearRT.texture },
      res: { value: new THREE.Vector2() }, cNear: { value: camera.near }, cFar: { value: camera.far },
      focus: { value: o.focus }, aperture: { value: o.aperture }, maxFar: { value: o.maxFar }, maxNear: { value: o.maxNear },
    };
    this.uniforms = uniforms;
    // Pass 1, at 1/8 resolution: the largest near-field blur that can reach each block.
    this.nearQuad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D tDepth; uniform vec2 res; varying vec2 vUv;
        ${COC_GLSL}
        void main() {
          float m = 0.0;
          for ( int y = -4; y <= 4; y++ ) for ( int x = -4; x <= 4; x++ ) {
            vec2 o = vec2( x, y ) * maxNear / 4.0 / res;
            m = max( m, - coc( texture2D( tDepth, vUv + o ).x ) );
          }
          gl_FragColor = vec4( m, 0.0, 0.0, 1.0 );
        }`,
    }));
    // Pass 2: scatter-as-gather over a golden-angle disc.
    this.dofQuad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D tColor, tDepth, tNear; uniform vec2 res; varying vec2 vUv;
        ${COC_GLSL}
        const int N = 48;
        void main() {
          float dc = texture2D( tDepth, vUv ).x;
          float cc = coc( dc );
          float R = max( abs( cc ), texture2D( tNear, vUv ).x );
          vec4 base = texture2D( tColor, vUv );
          if ( R < 0.6 ) { gl_FragColor = base; return; }
          float zc = linearDepth( dc );
          vec3 acc = vec3( 0.0 ); float wsum = 0.0;
          for ( int i = 0; i < N; i++ ) {
            float fi = float( i ) + 0.5;
            float r = sqrt( fi / float( N ) ) * R;
            float a = fi * 2.39996323;
            vec2 uv = vUv + vec2( cos( a ), sin( a ) ) * r / res;
            float ds = texture2D( tDepth, uv ).x;
            float cs = coc( ds );
            float zs = linearDepth( ds );
            // A nearer sample spreads by its own blur; a farther one cannot spread over
            // something nearer than itself, so it is limited by this pixel's blur too.
            float reach = zs < zc ? abs( cs ) : min( abs( cs ), abs( cc ) );
            float w = clamp( reach - r + 1.0, 0.0, 1.0 ) / max( 1.0, reach * reach );
            acc += texture2D( tColor, uv ).rgb * w; wsum += w;
          }
          gl_FragColor = vec4( wsum > 0.0 ? acc / wsum : base.rgb, 1.0 );
        }`,
    }));
    this.needsSwap = true;
  }
  setSize(w, h) {
    this.rt.setSize(w, h); this.nearRT.setSize(Math.max(1, w >> 3), Math.max(1, h >> 3));
    this.uniforms.res.value.set(w, h);
  }
  render(renderer, writeBuffer) {
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(this.nearRT); this.nearQuad.render(renderer);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.dofQuad.render(renderer);
  }
}

// Film grade after tone mapping: crushed blacks, split tone, vignette, edge fringe, grain,
// optional letterbox. Values are in display space.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, time: { value: 0 }, res: { value: new THREE.Vector2() },
    shadowTint: { value: new THREE.Color(0x0b2a33) }, highlightTint: { value: new THREE.Color(0xffd9a8) },
    split: { value: 0.12 }, crush: { value: 0.03 }, vignette: { value: 0.42 }, fringe: { value: 1.6 },
    grain: { value: 0.05 }, bars: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float time, split, crush, vignette, fringe, grain, bars;
    uniform vec2 res; uniform vec3 shadowTint, highlightTint; varying vec2 vUv;
    float h12( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * .1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot( c * vec2( res.x / res.y, 1.0 ), c * vec2( res.x / res.y, 1.0 ) );
      vec2 f = c * r2 * fringe / res.y;
      vec3 col = vec3( texture2D( tDiffuse, vUv + f ).r, texture2D( tDiffuse, vUv ).g, texture2D( tDiffuse, vUv - f ).b );
      float l = dot( col, vec3( 0.2126, 0.7152, 0.0722 ) );
      col = mix( col, col * ( shadowTint * 4.0 ), split * ( 1.0 - smoothstep( 0.0, 0.35, l ) ) );
      col = mix( col, col * highlightTint, split * smoothstep( 0.45, 1.0, l ) );
      col = max( col - crush, 0.0 ) / ( 1.0 - crush );
      col *= 1.0 - vignette * smoothstep( 0.1, 0.9, r2 * 1.6 );
      float g = h12( vUv * res + fract( time * 7.13 ) * 517.0 ) - 0.5;
      col += g * grain * ( 1.0 - l * 0.6 );
      if ( bars > 0.0 ) {
        float vis = res.x / bars / res.y;           // visible fraction of height
        if ( abs( c.y ) > vis * 0.5 ) col = vec3( 0.0 );
      }
      gl_FragColor = vec4( col, 1.0 );
    }`,
};

export function createPost(renderer, scene, camera, o = {}) {
  const composer = new EffectComposer(renderer);
  const dof = new SceneDofPass(scene, camera, {
    focus: o.focus ?? 22, aperture: o.aperture ?? 14, maxFar: o.maxFar ?? 7, maxNear: o.maxNear ?? 22,
  });
  composer.addPass(dof);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), o.bloom ?? 0.85, o.bloomRadius ?? 0.6, o.bloomThreshold ?? 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  const setSize = (w, h) => {
    composer.setSize(w, h);
    const pr = renderer.getPixelRatio();
    grade.uniforms.res.value.set(w * pr, h * pr);
  };
  return { composer, dof, bloom, grade, setSize };
}
