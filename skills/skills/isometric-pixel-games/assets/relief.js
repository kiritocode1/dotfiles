'use strict';
// Outline-height relief for surfaces that have no normals: ground painted in groundColor, and
// anything built from plot() calls. Load after engine.js. Each pixel's height is its distance from
// the region's edge, rounded by a quarter circle, and the engine's fixed upper-left light shades the
// slope: edges facing the light step up one ramp level, edges facing away step down. The flat top
// keeps the colours the painter chose. Method from SpriteCook, "Pixel art normal maps from outline"
// (2026), with the engine's sun in place of a point light and ramp steps in place of light bands.
//
// A ground surface, marked by its kind, right after the ground loop in bake():
//   relief(kinds.map(k => k === KIND_PAVING), { bevel: 2 });
// A plotted surface, by whatever changes depth between the two calls:
//   reliefBegin(); ...plot() calls...; reliefEnd({ bevel: 2 });
//
// Separate blobs in the mask bevel separately. Do not use it on box(), sphere() or capsule(): they
// already shade from real normals, and a box under a uniform bevel turns into a pillow.

// the same light vector sphere() uses, in screen space with y pointing down
const RELIEF_L = [-.55, -.6, .58].map(v => v / Math.hypot(.55, .6, .58));
let reliefDepth = null;

function reliefBegin() { reliefDepth = zb.slice(); }
function reliefEnd(opts) {
  if (!reliefDepth) throw new Error('reliefEnd() without reliefBegin()');
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = zb[i] !== reliefDepth[i] ? 1 : 0;
  reliefDepth = null;
  relief(mask, opts);
}

// bevel: rim width in px. 1 to 2 for square-cornered shapes, 2 to 3 for stones and slabs, up to 5 for a dome.
// top: plateau height; the rim slope is top / bevel. detail: how much the painted brightness raises
// or sinks a pixel, so painted cracks read as grooves. gaps: the darkest fraction of the region
// becomes edge, for one texture holding many blocks of 8 px or more (large pavers). gain: ramp steps per
// unit of light change. dither: Bayer weight on the step; 0 for flat-banded objects.
function relief(mask, { bevel = 2.5, top = 2.5, detail = 1.5, gaps = 0, gain = 3, dither = .5 } = {}) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < W * H; i++) {
    if (!mask[i]) continue;
    const ix = i % W, iy = i / W | 0;
    if (ix < x0) x0 = ix; if (ix > x1) x1 = ix; if (iy < y0) y0 = iy; if (iy > y1) y1 = iy;
  }
  if (x1 < 0) return;
  // work in a box around the region, padded so the blur and gradient have room
  const pad = Math.ceil(bevel) + 3;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, at = (x, y) => (y0 + y) * W + x0 + x;
  const lum = new Float32Array(bw * bh), solid = new Uint8Array(bw * bh);
  let sum = 0, n = 0;
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = at(x, y);
    if (!mask[i]) continue;
    const c = pix[i];
    lum[y * bw + x] = ((c & 255) * .299 + (c >> 8 & 255) * .587 + (c >> 16 & 255) * .114) / 255;
    solid[y * bw + x] = 1; sum += lum[y * bw + x]; n++;
  }
  const mean = sum / n;
  if (gaps > 0) {
    // the tile variant: blurred brightness below the gaps percentile counts as outside
    const soft = blurIn(lum.map((v, k) => solid[k] ? v : mean), bw, bh, .8), values = [];
    for (let k = 0; k < soft.length; k++) if (solid[k]) values.push(soft[k]);
    values.sort((a, b) => a - b);
    const cut = values[Math.floor(values.length * gaps)];
    for (let k = 0; k < soft.length; k++) if (solid[k] && soft[k] <= cut) solid[k] = 0;
  }
  // height: quarter-circle bevel on the distance to the nearest outside pixel, plus painted detail.
  // Anything past the canvas edge counts as outside, so a region touching it still gets a rim.
  const height = new Float32Array(bw * bh), reach = Math.ceil(bevel);
  const outside = (x, y) => {
    const gx = x0 + x, gy = y0 + y;
    if (gx < 0 || gy < 0 || gx >= W || gy >= H) return true;
    if (x < 0 || y < 0 || x >= bw || y >= bh) return true;
    return !solid[y * bw + x];
  };
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const k = y * bw + x;
    if (!solid[k]) continue;
    let d = bevel;
    for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
      if (outside(x + dx, y + dy)) d = Math.min(d, Math.hypot(dx, dy));
    }
    const r = d / bevel;
    height[k] = top * Math.sqrt(1 - (1 - r) * (1 - r)) + detail * (lum[k] - mean);
  }
  const h = blurIn(height, bw, bh, .7), steps = [];
  for (let y = 1; y < bh - 1; y++) for (let x = 1; x < bw - 1; x++) {
    const k = y * bw + x;
    if (!solid[k]) continue;
    const gx = (h[k + 1] - h[k - 1]) / 2, gy = (h[k + bw] - h[k - bw]) / 2;
    // y points down the screen, so the normal is (-gx, -gy, 1). A normal map that stores green as up
    // flips that sign, which is why a ported shader can look lit from below.
    const len = Math.hypot(gx, gy, 1);
    const l = Math.max(0, (-gx * RELIEF_L[0] - gy * RELIEF_L[1] + RELIEF_L[2]) / len);
    const ix = x0 + x, iy = y0 + y;
    const step = clamp(Math.floor((l - RELIEF_L[2]) * gain + .5 + (bayerAt(ix, iy) - .5) * dither), -3, 1);
    if (step) steps.push(iy * W + ix, step);
  }
  for (let s = 0; s < steps.length; s += 2) pix[steps[s]] = shiftTone(pix[steps[s]], steps[s + 1]);
}

// separable gaussian over a w by h float field, radius 2
function blurIn(src, w, h, sigma) {
  const k = [0, 1, 2].map(o => Math.exp(-o * o / (2 * sigma * sigma)));
  const norm = k[0] + 2 * (k[1] + k[2]);
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let o = -2; o <= 2; o++) v += src[y * w + clamp(x + o, 0, w - 1)] * k[Math.abs(o)];
    tmp[y * w + x] = v / norm;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let o = -2; o <= 2; o++) v += tmp[clamp(y + o, 0, h - 1) * w + x] * k[Math.abs(o)];
    out[y * w + x] = v / norm;
  }
  return out;
}

// move a packed colour along its own hue-shifted ramp, treating it as level 3 of rampOf
const SHIFT = { '-3': [.4, .34], '-2': [.62, .18], '-1': [.84, .05] };
function shiftTone(c, step) {
  const r = c & 255, g = c >> 8 & 255, b = c >> 16 & 255;
  if (step > 0) return rgb(lerp(r * 1.1, WARM[0], .22), lerp(g * 1.1, WARM[1], .22), lerp(b * 1.1, WARM[2], .22));
  const [m, k] = SHIFT[step];
  return rgb(lerp(r * m, COOL[0], k), lerp(g * m, COOL[1], k), lerp(b * m, COOL[2], k));
}
