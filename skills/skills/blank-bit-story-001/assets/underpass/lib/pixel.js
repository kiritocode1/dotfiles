// PixelCanvas paints pixel art and records, per texel, the surface normal, height, roughness
// and emission. Uploaded as nearest-filtered textures on flat quads, three.js lights then
// shade the art one texel at a time: a cyan sign lights the edge of a sleeve that faces it.
//
// Canvas space is y-down, like an image. Normals are stored y-up (tangent space of a quad
// whose uv runs left to right, bottom to top), so a pixel on the top edge of a capsule has
// a normal pointing up.
import * as THREE from 'three';

export const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Deterministic hash and value noise, so textures bake the same every load.
export function hash2(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)), (s >>>= 0) / 4294967296);
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

export class PixelCanvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    const n = w * h;
    this.color = new Float32Array(n * 3);   // sRGB 0..255
    this.alpha = new Uint8Array(n);
    this.nrm = new Float32Array(n * 3);     // explicit normal, z = 0 means "derive from height"
    this.height = new Float32Array(n);
    this.depth = new Float32Array(n).fill(-1e9);
    this.emit = new Float32Array(n * 3);
    this.rough = new Float32Array(n).fill(0.85);
  }

  // Writes one texel. Options: z (depth test, larger is nearer), n (normal [x,y,z]), h (height),
  // e (emission rgb 0..255), r (roughness 0..1). A texel with a nearer depth already wins.
  put(x, y, c, o = {}) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    const z = o.z ?? 0;
    if (z < this.depth[i]) return;
    this.depth[i] = z;
    this.alpha[i] = 255;
    this.color[i * 3] = c[0]; this.color[i * 3 + 1] = c[1]; this.color[i * 3 + 2] = c[2];
    if (o.n) { this.nrm[i * 3] = o.n[0]; this.nrm[i * 3 + 1] = o.n[1]; this.nrm[i * 3 + 2] = o.n[2]; }
    else { this.nrm[i * 3 + 2] = 0; }
    this.height[i] = o.h ?? 0;
    const e = o.e;
    this.emit[i * 3] = e ? e[0] : 0; this.emit[i * 3 + 1] = e ? e[1] : 0; this.emit[i * 3 + 2] = e ? e[2] : 0;
    if (o.r !== undefined) this.rough[i] = o.r;
  }

  // c and o may be functions of (x, y); a colour function returning null leaves a hole.
  rect(x0, y0, x1, y1, c, o = {}) {
    for (let y = Math.max(0, y0 | 0); y < Math.min(this.h, Math.ceil(y1)); y++)
      for (let x = Math.max(0, x0 | 0); x < Math.min(this.w, Math.ceil(x1)); x++) {
        const col = typeof c === 'function' ? c(x, y) : c;
        if (col) this.put(x, y, col, typeof o === 'function' ? o(x, y) : o);
      }
  }

  // A sphere-swept segment with exact normals. ra and rb are radii at each end in texels.
  // colour may be a function (x, y, nx, ny, nz) so a part can carry a stripe or a highlight.
  capsule(ax, ay, bx, by, ra, rb, c, o = {}) {
    const minX = Math.floor(Math.min(ax - ra, bx - rb)) - 1, maxX = Math.ceil(Math.max(ax + ra, bx + rb)) + 1;
    const minY = Math.floor(Math.min(ay - ra, by - rb)) - 1, maxY = Math.ceil(Math.max(ay + ra, by + rb)) + 1;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1e-6;
    const z0 = o.z ?? 0;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
      const cx = ax + dx * t, cy = ay + dy * t, r = ra + (rb - ra) * t;
      const ex = px - cx, ey = py - cy, d2 = ex * ex + ey * ey;
      if (d2 > r * r) continue;
      const nz = Math.sqrt(Math.max(0, r * r - d2)) / r;
      const nx = ex / r, ny = -ey / r;
      const col = typeof c === 'function' ? c(x, y, nx, ny, nz) : c;
      if (!col) continue;
      this.put(x, y, col, { ...o, z: z0 + nz * r, n: [nx * (o.flat ?? 1), ny * (o.flat ?? 1), nz] });
    }
  }

  disc(cx, cy, r, c, o) { this.capsule(cx, cy, cx, cy, r, r, c, o); }

  // Convex or concave polygon, even-odd fill. Normal comes from height unless o.n is given.
  poly(pts, c, o = {}) {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = [], py = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= py && y1 > py) || (y1 <= py && y0 > py)) xs.push(x0 + ((py - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) {
          const col = typeof c === 'function' ? c(x, y) : c;
          if (col) this.put(x, y, col, typeof o === 'function' ? o(x, y) : o);
        }
    }
  }

  // Raise every opaque texel by its distance to the silhouette edge, up to `bevel` texels,
  // through a quarter circle. Gives painted shapes a lit rim and a shaded rim (the outline
  // relief method from the isometric skill, applied here to whole flats).
  bevelAlpha(bevel = 2, top = 2, select = () => true) {
    const { w, h } = this;
    const dist = new Float32Array(w * h).fill(1e9);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!this.alpha[i] || !select(x, y)) { dist[i] = 0; continue; }
    }
    // Two-pass chamfer distance, cheap and good enough for a few texels of bevel.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!dist[i]) continue;
      let d = dist[i];
      if (x > 0) d = Math.min(d, dist[i - 1] + 1); else d = Math.min(d, 1);
      if (y > 0) d = Math.min(d, dist[i - w] + 1); else d = Math.min(d, 1);
      dist[i] = d;
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!dist[i]) continue;
      let d = dist[i];
      if (x < w - 1) d = Math.min(d, dist[i + 1] + 1); else d = Math.min(d, 1);
      if (y < h - 1) d = Math.min(d, dist[i + w] + 1); else d = Math.min(d, 1);
      dist[i] = d;
    }
    for (let i = 0; i < w * h; i++) if (dist[i] && !this.nrm[i * 3 + 2]) {
      const t = Math.min(1, (dist[i] - 0.5) / bevel);
      this.height[i] += top * Math.sqrt(1 - (1 - t) * (1 - t));
    }
  }

  // Fill unset normals from the height field. Steeper strength gives deeper grooves.
  finishNormals(strength = 1) {
    const { w, h } = this;
    const H = (x, y) => {
      x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
      const i = y * w + x;
      return this.alpha[i] ? this.height[i] : 0;
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!this.alpha[i] || this.nrm[i * 3 + 2]) continue;
      const gx = (H(x + 1, y) - H(x - 1, y)) * 0.5 * strength;
      const gy = (H(x, y - 1) - H(x, y + 1)) * 0.5 * strength; // y-down canvas, y-up normal
      const l = Math.hypot(gx, gy, 1);
      this.nrm[i * 3] = -gx / l; this.nrm[i * 3 + 1] = -gy / l; this.nrm[i * 3 + 2] = 1 / l;
    }
  }

  // Upload as textures. Rows are flipped here so uv (0,0) is the bottom-left texel.
  textures() {
    this.finishNormals();
    const { w, h } = this, n = w * h;
    const col = new Uint8Array(n * 4), nor = new Uint8Array(n * 4), emi = new Uint8Array(n * 4), rgh = new Uint8Array(n * 4);
    let hasEmit = false;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const s = y * w + x, d = (h - 1 - y) * w + x;
      col[d * 4] = this.color[s * 3]; col[d * 4 + 1] = this.color[s * 3 + 1]; col[d * 4 + 2] = this.color[s * 3 + 2];
      col[d * 4 + 3] = this.alpha[s];
      const nz = this.nrm[s * 3 + 2] || 1;
      nor[d * 4] = (this.nrm[s * 3] * 0.5 + 0.5) * 255; nor[d * 4 + 1] = (this.nrm[s * 3 + 1] * 0.5 + 0.5) * 255;
      nor[d * 4 + 2] = (nz * 0.5 + 0.5) * 255; nor[d * 4 + 3] = 255;
      emi[d * 4] = this.emit[s * 3]; emi[d * 4 + 1] = this.emit[s * 3 + 1]; emi[d * 4 + 2] = this.emit[s * 3 + 2]; emi[d * 4 + 3] = 255;
      if (this.emit[s * 3] + this.emit[s * 3 + 1] + this.emit[s * 3 + 2] > 0) hasEmit = true;
      rgh[d * 4 + 1] = this.rough[s] * 255; rgh[d * 4 + 3] = 255; // roughness lives in green
    }
    const tex = (data, srgb) => {
      const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
      t.magFilter = t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
      return t;
    };
    return { map: tex(col, true), normalMap: tex(nor, false), emissiveMap: hasEmit ? tex(emi, true) : null, roughnessMap: tex(rgh, false), w, h };
  }
}

// Standard material for pixel textures. Lighting is evaluated at the centre of each texel,
// so a point light's falloff steps in whole texels instead of sliding smoothly across them.
export function pixelMaterial(t, o = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap,
    emissiveMap: t.emissiveMap ?? null, emissive: t.emissiveMap ? new THREE.Color(o.emissive ?? 0xffffff) : new THREE.Color(0),
    emissiveIntensity: o.emissiveIntensity ?? 1, roughness: 1, metalness: o.metalness ?? 0,
    alphaTest: 0.5, transparent: false, side: o.side ?? THREE.FrontSide,
    normalScale: new THREE.Vector2(o.normalScale ?? 1, o.normalScale ?? 1),
  });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      'vec3 geometryPosition = - vViewPosition;',
      /* glsl */ `
      vec3 geometryPosition = - vViewPosition;
      {
        // Move the shading point to this texel's centre using screen derivatives of uv.
        vec2 tsz = vec2( textureSize( map, 0 ) );
        vec2 tc = vMapUv * tsz;
        vec2 duv = ( floor( tc ) + 0.5 - tc ) / tsz;
        vec3 px = dFdx( geometryPosition ), py = dFdy( geometryPosition );
        vec2 ux = dFdx( vMapUv ), uy = dFdy( vMapUv );
        float det = ux.x * uy.y - ux.y * uy.x;
        if ( abs( det ) > 1e-12 ) {
          vec2 ab = vec2( duv.x * uy.y - duv.y * uy.x, - duv.x * ux.y + duv.y * ux.x ) / det;
          geometryPosition += px * ab.x + py * ab.y;
        }
      }`
    );
  };
  m.customProgramCacheKey = () => 'pixel-texel-snap';
  return m;
}
