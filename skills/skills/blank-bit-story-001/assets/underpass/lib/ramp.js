// Palette-ramp shading for hand-drawn sprites, the GPU side of sprites/colour.py.
//
// A frame is a .txt drawing read through render.py's materials.json into an index texture
// (R material, G authored ramp step, B flags, A coverage). A lamp moves each pixel along its own material ramp in whole steps and tints it in
// six levels; it never multiplies the colour smoothly. Under the reference rig (dim ambient plus
// the front-left key the art was drawn under) every pixel stays on its authored step, so the
// drawing comes back exactly. rampcheck.html checks this, and the other rigs, against render.py.
//
// Lamps live in drawing space: x right and y down in pixel indices, z toward the viewer, the same
// space as colour.py. Each lamp adds col * power * N.L / (1 + (d / reach)^2).
import * as THREE from 'three';

export const W = 48, H = 64, GROUND = 61;
// keep these equal to colour.py
const FLAG = { EMIT: 1, RIM: 2, FIXED: 4 };
export const REF = { amb: [0.30, 0.32, 0.36], lamps: [{ pos: [-30, 6, 30], col: [1, 0.95, 0.85], power: 1.0, reach: 60 }] };
const LUM = [0.2126, 0.7152, 0.0722];
const GAIN = 3.2, SAT = 0.7, LEVELS = 6;
const KEY = [-0.75, 0.45];
export const MAX_LAMPS = 8;

// Raw RGBA bytes of a PNG, with no colour management or premultiplication. Only rampcheck.html
// uses it (to read lit.png), in a browser without canvas fingerprint noise.
export async function loadBytes(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const bmp = await createImageBitmap(await res.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
    .catch((e) => { throw new Error(`${url}: cannot decode (${e.message})`); });
  const cv = new OffscreenCanvas(bmp.width, bmp.height);
  const cx = cv.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
  cx.drawImage(bmp, 0, 0);
  return { w: bmp.width, h: bmp.height, data: cx.getImageData(0, 0, bmp.width, bmp.height).data };
}

// Data row 0 is the image's top row; the shader reads with texelFetch, so no flip is needed.
function dataTex(data, w, h, type = THREE.UnsignedByteType) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, type);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * Derived normals and reference light for one index image, as colour.normals and the REF
 * irradiance. Returns a float texture: rgb = normal (x right, y up, z out), a = luminance under
 * the reference rig.
 */
export function auxFor(idx) {
  const opaque = (x, y) => x >= 0 && y >= 0 && x < W && y < H && idx[(y * W + x) * 4 + 3] > 0;
  const out = new Float32Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!opaque(x, y)) continue;
    let ox = 0, oy = 0, wsum = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if ((dx || dy) && !opaque(x + dx, y + dy)) {
        const w = 1 / (dx * dx + dy * dy);
        ox += dx * w; oy += -dy * w; wsum += w;
      }
    }
    let ex = 0, ey = 0;
    if (wsum) {
      const k = (Math.min(1, wsum) * 0.8) / (Math.hypot(ox, oy) + 1e-6);
      ex = ox * k; ey = oy * k;
    }
    const st = idx[(y * W + x) * 4 + 1];
    let nx = ex + KEY[0] * (st - 2) * 0.3, ny = ey + KEY[1] * (st - 2) * 0.3;
    const l = Math.hypot(nx, ny);
    if (l > 0.95) { nx *= 0.95 / l; ny *= 0.95 / l; }
    const nz = Math.sqrt(1 - nx * nx - ny * ny);
    const E = [...REF.amb];
    for (const L of REF.lamps) {
      const lx = L.pos[0] - x, ly = -(L.pos[1] - y), lz = L.pos[2];
      const d = Math.hypot(lx, ly, lz);
      const ndl = Math.min(1, Math.max(0, (nx * lx + ny * ly + nz * lz) / d));
      const f = (L.power * ndl) / (1 + (d / L.reach) ** 2);
      for (let c = 0; c < 3; c++) E[c] += L.col[c] * f;
    }
    out.set([nx, ny, nz, E[0] * LUM[0] + E[1] * LUM[1] + E[2] * LUM[2]], (y * W + x) * 4);
  }
  return out;
}

async function get(url, as) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res[as]();
}

/**
 * sprites/materials.json from render.py: each char's [material, step, flags] and the palette,
 * one row per material, five ramp steps. Read as data, never through a canvas: fingerprint
 * protection (Brave, private Safari) adds noise to canvas readback and scrambles the indices.
 */
export async function loadMaterials(url) {
  const { chars, palette } = await get(url, 'json');
  const h = palette.length, w = palette[0].length;
  const bytes = new Uint8Array(w * h * 4);
  palette.forEach((row, m) => row.forEach((c, s) => bytes.set([...c, 255], (m * w + s) * 4)));
  return { chars, tex: dataTex(bytes, w, h), bytes, w, h };
}

/**
 * One drawn frame from its .txt grid: the index texture (R material, G step, B flags, A coverage,
 * the same layout as render.py's index images) and its derived normals and reference light.
 */
export async function loadFrame(url, materials) {
  const rows = (await get(url, 'text')).replace(/\r/g, '').trimEnd().split('\n');
  if (rows.length !== H || rows.some((r) => r.length !== W)) throw new Error(`${url}: not ${H} rows of ${W} chars; run render.py`);
  const idx = new Uint8Array(W * H * 4);
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    const m = materials.chars[c];
    if (m) idx.set([...m, 255], (y * W + x) * 4);
  }));
  return { index: dataTex(idx, W, H), aux: dataTex(auxFor(idx), W, H, THREE.FloatType), idx };
}

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const fragmentShader = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D uIndex, uAux, uPal;
  uniform vec3 uAmb;
  uniform int uCount;
  uniform vec3 uLPos[ ${MAX_LAMPS} ], uLCol[ ${MAX_LAMPS} ];
  uniform float uLReach[ ${MAX_LAMPS} ];
  uniform float uMirror, uGain;
  varying vec2 vUv;
  const vec3 LUMW = vec3( 0.2126, 0.7152, 0.0722 );
  void main() {
    int ix = clamp( int( floor( vUv.x * ${W}.0 ) ), 0, ${W - 1} );
    int iy = clamp( int( floor( ( 1.0 - vUv.y ) * ${H}.0 ) ), 0, ${H - 1} );
    if ( uMirror > 0.5 ) ix = ${W - 1} - ix;
    vec4 id = texelFetch( uIndex, ivec2( ix, iy ), 0 );
    if ( id.a < 0.5 ) discard;
    int mat = int( id.r * 255.0 + 0.5 ), st = int( id.g * 255.0 + 0.5 ), fl = int( id.b * 255.0 + 0.5 );
    vec3 c;
    if ( ( fl & ${FLAG.EMIT | FLAG.FIXED} ) != 0 ) {
      c = texelFetch( uPal, ivec2( st, mat ), 0 ).rgb;
    } else {
      vec4 ax = texelFetch( uAux, ivec2( ix, iy ), 0 );
      vec3 lampE = vec3( 0.0 );
      for ( int i = 0; i < ${MAX_LAMPS}; i++ ) {
        if ( i >= uCount ) break;
        vec3 L = vec3( uLPos[ i ].x - float( ix ), - ( uLPos[ i ].y - float( iy ) ), uLPos[ i ].z );
        float d = length( L );
        float ndl = clamp( dot( ax.xyz, L / d ), 0.0, 1.0 );
        float q = d / uLReach[ i ];
        lampE += uLCol[ i ] * ndl / ( 1.0 + q * q );
      }
      float lum = dot( uAmb + lampE, LUMW );
      float shift = clamp( floor( ( lum - ax.w ) * ${GAIN.toFixed(4)} + 0.5 ), -2.0, 2.0 );
      float ll = dot( lampE, LUMW );
      vec3 hue = lampE / max( ll, 1e-4 );
      float w = ll / ( ll + dot( uAmb, LUMW ) + 1e-4 );
      vec3 tint = floor( ( 1.0 + ( hue - 1.0 ) * ${SAT.toFixed(4)} * w ) * ${LEVELS}.0 + 0.5 ) / ${LEVELS}.0;
      int s = clamp( st + int( shift ), 0, 4 );
      c = texelFetch( uPal, ivec2( s, mat ), 0 ).rgb;
      if ( s != st || ll > 0.05 ) c = clamp( c * tint, 0.0, 1.0 );
    }
    #ifdef RAW
      // test output: the palette's sRGB bytes, untouched
      gl_FragColor = vec4( c, 1.0 );
    #else
      gl_FragColor = vec4( sRGBTransferEOTF( vec4( c, 1.0 ) ).rgb * uGain, 1.0 );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    #endif
  }`;

/**
 * The ramp material. raw: write the palette bytes directly (for the diff test, rendered with no
 * tone mapping); otherwise output linear colour into the scene's post chain, scaled by gain.
 */
export function rampMaterial(frame, palette, o = {}) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uIndex: { value: null }, uAux: { value: null }, uPal: { value: null },
    uAmb: { value: new THREE.Vector3() }, uCount: { value: 0 },
    uLPos: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector3()) },
    uLCol: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector3()) },
    uLReach: { value: new Array(MAX_LAMPS).fill(1) },
    uMirror: { value: 0 }, uGain: { value: o.gain ?? 1 },
  }]);
  // merge clones values; textures are set after so they are shared, not copied
  uniforms.uIndex.value = frame.index; uniforms.uAux.value = frame.aux; uniforms.uPal.value = palette.tex;
  const m = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    defines: o.raw ? { RAW: '' } : {}, fog: !o.raw, toneMapped: !o.raw,
  });
  return m;
}

/** Set the lighting rig: { amb: [r,g,b], lamps: [{ pos, col, power, reach }] } in drawing space. */
export function setRig(material, rig) {
  const u = material.uniforms;
  u.uAmb.value.fromArray(rig.amb);
  const n = Math.min(MAX_LAMPS, rig.lamps.length);
  u.uCount.value = n;
  for (let i = 0; i < n; i++) {
    const L = rig.lamps[i];
    u.uLPos.value[i].fromArray(L.pos);
    u.uLCol.value[i].fromArray(L.col).multiplyScalar(L.power);
    u.uLReach.value[i] = L.reach;
  }
}

// How three.js light units map onto colour.py's. A point light of intensity I reads as
// I * POINT / d^2 at distance d metres, and flattens out inside REACH metres. Tuned by eye in
// the street; ramp.html does not depend on them.
export const UNITS = { POINT: 0.06, DIRECTIONAL: 0.5, AMBIENT: 2.2, REACH: 1.0 };

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color();
// colour.py's lamp colours are display (sRGB) ratios; three stores light colours linear
const srgb = (light) => _c.copy(light.color).convertLinearToSRGB().toArray();

/**
 * A rig for one sprite from the scene's lights: hemisphere and ambient lights become ambient;
 * point and spot lights become lamps, with three's range window and spot cone applied at the
 * sprite's centre; directional lights become lamps far away. Keeps the strongest MAX_LAMPS.
 * mesh is the sprite quad (feet at its origin, facing the camera), tpu its texels per unit.
 */
export function rigFromScene(scene, mesh, tpu, mirror) {
  const amb = [0, 0, 0], lamps = [];
  mesh.updateMatrixWorld();
  const centre = mesh.localToWorld(_w.set(0, (GROUND - 32) / tpu, 0)).clone();
  const toDrawing = (world) => {
    const p = mesh.worldToLocal(_v.copy(world));
    let x = p.x * tpu + W / 2 - 0.5;
    if (mirror) x = W - 1 - x;
    return [x, GROUND + 0.5 - p.y * tpu, p.z * tpu];
  };
  scene.traverse((o) => {
    if (!o.isLight || !o.visible || o.intensity <= 0) return;
    const col = srgb(o);
    if (o.isHemisphereLight || o.isAmbientLight) {
      const g = o.isHemisphereLight ? _c.copy(o.groundColor).convertLinearToSRGB().toArray() : col;
      for (let k = 0; k < 3; k++) amb[k] += ((col[k] + g[k]) / 2) * o.intensity * UNITS.AMBIENT;
      return;
    }
    if (o.isDirectionalLight) {
      o.updateMatrixWorld(); o.target.updateMatrixWorld();
      const dir = _v.setFromMatrixPosition(o.matrixWorld).sub(_w.setFromMatrixPosition(o.target.matrixWorld)).normalize();
      const far = centre.clone().addScaledVector(dir, 1e4 / tpu);
      lamps.push({ pos: toDrawing(far), col, power: o.intensity * UNITS.DIRECTIONAL, reach: 1e9 });
      return;
    }
    if (!o.isPointLight && !o.isSpotLight) return;
    const lp = _v.setFromMatrixPosition(o.matrixWorld).clone();
    const d = lp.distanceTo(centre);
    let k = 1;
    if (o.distance > 0) k *= Math.max(0, 1 - (d / o.distance) ** 4) ** 2;
    if (o.isSpotLight) {
      o.target.updateMatrixWorld();
      const axis = _w.setFromMatrixPosition(o.target.matrixWorld).sub(lp).normalize();
      const cosA = axis.dot(centre.clone().sub(lp).normalize());
      const outer = Math.cos(o.angle), inner = Math.cos(o.angle * (1 - o.penumbra));
      k *= THREE.MathUtils.smoothstep(cosA, outer, inner);
    }
    if (k <= 0) return;
    const reach = UNITS.REACH * tpu;
    // far field: power / (d/reach)^2 = I * POINT / d_m^2
    lamps.push({ pos: toDrawing(lp), col, power: o.intensity * k * UNITS.POINT / UNITS.REACH ** 2, reach, est: (o.intensity * k) / (1 + d * d) });
  });
  lamps.sort((a, b) => (b.est ?? 1e9) - (a.est ?? 1e9));
  return { amb, lamps: lamps.slice(0, MAX_LAMPS) };
}

/**
 * A hand-drawn frame standing in the world: one quad with its feet at the origin, lit by the
 * scene through the ramp shader. setFrame swaps the drawing; light() re-reads the scene's lamps.
 */
export class RampSprite {
  constructor(frame, palette, tpu, o = {}) {
    this.tpu = tpu; this.facing = 1;
    this.material = rampMaterial(frame, palette, o);
    const geo = new THREE.PlaneGeometry(W / tpu, H / tpu);
    // the bottom edge of ground row 61 sits on y = 0
    geo.translate(0, (GROUND + 1 - H / 2) / tpu, 0);
    this.mesh = new THREE.Mesh(geo, this.material);
  }
  setFrame(frame) { this.material.uniforms.uIndex.value = frame.index; this.material.uniforms.uAux.value = frame.aux; }
  light(scene) {
    this.material.uniforms.uMirror.value = this.facing < 0 ? 1 : 0;
    this.rig = rigFromScene(scene, this.mesh, this.tpu, this.facing < 0);
    setRig(this.material, this.rig);
  }
}

/**
 * Plays clips of drawn frames at a flat fps. A stopgap until SpriteActor plays states.json with
 * per-drawing holds. clips = { name: { frames: [loadFrame()], fps, loop } }.
 */
export class RampActor extends RampSprite {
  constructor(clips, palette, tpu, o) {
    super(Object.values(clips)[0].frames[0], palette, tpu, o);
    this.clips = clips; this.clip = null; this.t = 0; this.done = false;
  }
  play(name, restart = false) {
    if (this.clip === name && !restart) return;
    this.clip = name; this.t = 0; this.done = false;
  }
  update(dt) {
    const c = this.clips[this.clip];
    this.t += dt;
    const i = Math.floor(this.t * c.fps), n = c.frames.length;
    this.done = !c.loop && i >= n;
    this.setFrame(c.frames[c.loop ? i % n : Math.min(i, n - 1)]);
  }
}
