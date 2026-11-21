// The street front behind the viaduct. REPLACED's depth comes from a densely dressed band just
// behind the play plane, moving at 0.65 to 0.9 of its speed (research/depth-light.md), not from
// many layers. In Tidewall this is the old city below the sea wall: ground-floor shops that stay
// open under the rail line, people sheltering from the rain in doorways, bulbs strung over the
// street, a wall lamp over each door. Alleys open between some buildings onto the hazed city.
//
// Two flats per stretch: the frontage at FRONT_Z, and the props in front of it at PROPS_Z
// (people, crates, a bike, a vending machine, hanging signs, bulb strings). Lamps and bulbs get
// a glow sprite that breathes at 0.5 to 0.7 Hz, the only motion the footage shows back there.
import * as THREE from 'three';
import { PixelCanvas, hex, mix, hash2, rng } from './pixel.js';
import { tpuAt } from './world.js';
import { TYPES, paintBuilding, hazeCanvas, cardMat, sign } from './city.js';
import { createGlow } from './atmos.js';

export const FRONT_Z = -10, PROPS_Z = -8.4;
const HAZE = hex(0x31505a);
const LAMP = [255, 196, 128], COOL = [150, 225, 235];
const scale = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const pick = (list, r) => list[Math.floor(r() * list.length)];

/**
 * Builds the street front into group between span[0] and span[1] (world x). skip is a list of
 * [x0, x1] stretches with no frontage (where the stall's back wall stands in front anyway).
 * Returns the glow sprites to breathe: [{ sprite, color, f, ph }].
 */
export function buildStreet(group, { seed = 5, span = [-62, 62], skip = [] } = {}) {
  const r = rng(seed), t = tpuAt(FRONT_Z), breathers = [];
  const glow = (x, y, z, c, size, k) => {
    const s = createGlow(new THREE.Vector3(x, y, z), new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255), size, k);
    s.userData.band = true; group.add(s);
    breathers.push({ sprite: s, color: s.material.color.clone(), f: 0.5 + r() * 0.2, ph: r() * 6.28 });
  };
  const fronts = [];
  let x = span[0], since = 0;
  while (x < span[1]) {
    const sk = skip.find(([a, b]) => x >= a && x < b);
    if (sk) { x = sk[1]; continue; }
    if (since >= 2 && r() < 0.3) {                                      // an alley
      const w = 1.6 + r() * 1.6;
      alley(group, x, w, r, glow);
      x += w; since = 0; continue;
    }
    const type = r() < 0.65 ? 'shophouse' : 'tenement';
    const w = 4.2 + r() * 4.4, h = 6.6 + r() * 4.2, roof = 1.6;
    const pc = paintBuilding({
      type, w, h, roof, seed: Math.floor(r() * 1e9), kind: pick(TYPES[type].kinds, r), t, shop: true,
      sign: r() < 0.45 ? { x: 0.15 + r() * 0.6, color: pick([0xff3d7f, 0x31e3d2, 0xffb347], r) } : null,
      billboard: null, litShare: 0.3 + r() * 0.35,
    });
    const x0 = x, z = FRONT_Z - r() * 0.5;
    // a caged lamp over a doorway or two, each throwing a warm pool down the wall
    const groundTop = pc.h - Math.max(5, Math.round(4.2 * t));
    for (let k = 0, n = 1 + (r() < 0.5 ? 1 : 0); k < n; k++) {
      const lx = Math.round(pc.w * (0.15 + r() * 0.7)), ly = groundTop - 2, c = r() < 0.75 ? LAMP : COOL;
      wallLamp(pc, lx, ly, c, t);
      glow(x0 + lx / t, (pc.h - ly) / t, z + 0.35, c, 1.5, 0.55);
    }
    hazeCanvas(pc, 0.16, HAZE, 0.25);
    pc.bevelAlpha(1.5, 1.5);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h + roof), cardMat(pc, { emissiveIntensity: 2.2 }));
    mesh.position.set(x0 + w / 2, (h + roof) / 2, z);
    mesh.userData.band = true;
    group.add(mesh);
    fronts.push([x0, x0 + w]);
    x += w; since++;
  }
  props(group, fronts, r, glow);
  return breathers;
}

/**
 * The recess behind a gap in the frontage: walls going back into the dark, a fire escape, a
 * bulb over a side door, wet ground, and the fog lifting where the alley meets the next street.
 * It sits 3 m behind the frontage, so it moves slower than the shops on either side of it.
 */
function alley(group, x, w, r, glow) {
  const z = FRONT_Z - 3, aw = w + 1.2, ah = 9, t = tpuAt(z);
  const W = Math.round(aw * t), H = Math.round(ah * t), pc = new PixelCanvas(W, H);
  const far = Math.round(W * 0.5), fw = Math.max(4, Math.round(W * 0.28));
  const fog = [52, 74, 80];
  pc.rect(0, 0, W, H, (px, py) => {
    const v = py / H, d = Math.abs(px - far) / (W / 2);          // 0 in the middle, 1 at the walls
    const wall = d > fw / W;
    const lift = Math.max(0, 1 - Math.abs(v - 0.82) / 0.35) * (1 - d) ** 1.5;   // fog brightest low, at the far end
    const k = wall ? 0.55 + (hash2(px >> 1, py >> 2, 3) - 0.5) * 0.1 : 0.3;
    return mix(scale([30, 34, 38], k), fog, Math.min(0.75, lift * 0.85));
  }, (px, py) => ({ h: 0, r: 0.9, e: scale(fog, Math.max(0, 1 - Math.abs(py / H - 0.82) / 0.3) * 0.12 * (1 - Math.abs(px - far) / (W / 2))) }));
  // fire escape up one wall
  const fx = r() < 0.5 ? 2 : W - Math.round(0.9 * t) - 2, fwid = Math.round(0.9 * t);
  for (let y = Math.round(H * 0.15); y < H * 0.62; y += Math.round(2.6 * t)) {
    pc.rect(fx, y, fx + fwid, y + 1, [44, 50, 52], { h: 3, r: 0.4 });
    for (let k = 1; k < Math.round(0.4 * t); k++) for (let xx = fx; xx <= fx + fwid; xx += 2) pc.put(xx, y - k, [26, 30, 32], { h: 2 });
  }
  // a side door with a bulb over it and its pool, and the bulb's reflection on the wet ground
  const dx = Math.round(W * (0.3 + r() * 0.4)), dy = H - Math.round(0.6 * t), c = r() < 0.7 ? LAMP : COOL;
  pc.rect(dx - 3, dy - Math.round(2.0 * t), dx + 3, dy, [14, 16, 18], { h: -1 });
  wallLamp(pc, dx, dy - Math.round(2.3 * t), c, t);
  for (let k = 1; k < Math.round(0.5 * t); k++) if (k % 2) pc.put(dx + ((k * 3) % 3) - 1, H - 1 - Math.round(k * 0.3), mix([20, 24, 26], c, 0.5 * (1 - k / (0.5 * t))), { e: scale(c, 0.2 * (1 - k / (0.5 * t))) });
  hazeCanvas(pc, 0.08, HAZE, 0.02);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), cardMat(pc, { emissiveIntensity: 2.2 }));
  mesh.position.set(x + w / 2, ah / 2, z);
  mesh.userData.band = true;
  group.add(mesh);
  glow(x + w / 2 - aw / 2 + dx / t, ah - (dy - Math.round(2.3 * t)) / t, z + 0.3, c, 1.2, 0.5);
}

/** A small lamp on a bracket and the pool of its light down the wall below it. */
function wallLamp(pc, lx, ly, c, t) {
  pc.put(lx - 1, ly - 1, [30, 34, 36], { h: 3 }); pc.put(lx, ly - 1, [30, 34, 36], { h: 3 }); pc.put(lx + 1, ly - 1, [30, 34, 36], { h: 3 });
  pc.put(lx, ly, c, { e: c, h: 3 });
  const reach = Math.round(2.6 * t);
  for (let k = 1; k < reach; k++) {
    const half = Math.round(1 + k * 0.55), a = 0.32 * (1 - k / reach) ** 1.6;
    for (let dx = -half; dx <= half; dx++) {
      const px = lx + dx, py = ly + k;
      if (px < 0 || px >= pc.w || py >= pc.h) continue;
      const i = py * pc.w + px;
      if (!pc.alpha[i]) continue;
      const edge = 1 - Math.abs(dx) / (half + 1);
      for (let j = 0; j < 3; j++) {
        pc.color[i * 3 + j] += (c[j] - pc.color[i * 3 + j]) * a * edge;
        pc.emit[i * 3 + j] += c[j] * a * edge * 0.35;
      }
    }
  }
}

// ---- people --------------------------------------------------------------------------------

// Poses in metres, feet at y 0, facing +x: [part, x0, y0, x1, y1, radius]. Parts: 1 skin,
// 2 hair, 3 coat, 4 legs, 5 umbrella canopy, 6 prop (crate, bowl, shaft).
const POSES = {
  stand: [[4, -0.07, 0.04, -0.06, 0.82, 0.065], [4, 0.07, 0.04, 0.06, 0.82, 0.065], [3, 0, 0.62, 0, 1.36, 0.19], [3, -0.15, 1.36, 0.15, 1.36, 0.08],
    [3, -0.19, 1.34, -0.22, 0.86, 0.055], [3, 0.19, 1.34, 0.21, 0.86, 0.055], [1, 0, 1.5, 0, 1.58, 0.1], [2, -0.03, 1.62, -0.03, 1.64, 0.1]],
  umbrella: [[4, -0.07, 0.04, -0.06, 0.82, 0.065], [4, 0.07, 0.04, 0.06, 0.82, 0.065], [3, 0, 0.62, 0, 1.36, 0.19], [3, -0.15, 1.36, 0.15, 1.36, 0.08],
    [3, -0.19, 1.34, -0.22, 0.86, 0.055], [3, 0.18, 1.34, 0.16, 1.16, 0.055], [6, 0.12, 1.12, 0.12, 2.0, 0.018],
    [5, 0.12, 2.0, 0.12, 2.0, 0.56], [1, 0, 1.5, 0, 1.58, 0.1], [2, -0.03, 1.62, -0.03, 1.64, 0.1]],
  sit: [[6, -0.22, 0.02, 0.22, 0.42, 0.02], [4, 0.0, 0.5, 0.36, 0.52, 0.07], [4, 0.36, 0.5, 0.38, 0.03, 0.06],
    [3, -0.02, 0.5, 0, 1.04, 0.18], [3, -0.14, 1.04, 0.14, 1.04, 0.08], [3, 0.16, 1.02, 0.3, 0.66, 0.055], [1, 0.02, 1.18, 0.02, 1.25, 0.1], [2, -0.01, 1.29, -0.01, 1.31, 0.1]],
  eat: [[4, -0.07, 0.04, -0.06, 0.82, 0.065], [4, 0.07, 0.04, 0.06, 0.82, 0.065], [3, 0, 0.62, 0, 1.36, 0.19], [3, -0.15, 1.36, 0.15, 1.36, 0.08],
    [3, 0.16, 1.32, 0.26, 1.12, 0.055], [3, -0.17, 1.32, 0.18, 1.14, 0.055], [6, 0.24, 1.17, 0.34, 1.17, 0.04], [1, 0.03, 1.48, 0.04, 1.55, 0.1], [2, 0, 1.6, 0, 1.62, 0.1]],
  lean: [[4, -0.04, 0.04, -0.12, 0.82, 0.065], [4, 0.14, 0.04, -0.02, 0.8, 0.065], [3, -0.08, 0.62, -0.14, 1.34, 0.19], [3, -0.29, 1.34, 0.01, 1.36, 0.08],
    [3, -0.3, 1.32, -0.34, 0.9, 0.055], [3, 0.02, 1.32, 0.12, 1.0, 0.055], [1, -0.12, 1.48, -0.13, 1.56, 0.1], [2, -0.16, 1.6, -0.16, 1.62, 0.1]],
};
const COATS = [[66, 70, 66], [84, 66, 52], [52, 60, 74], [92, 84, 60], [62, 52, 62], [40, 44, 48]];
const SKINS = [[156, 114, 92], [112, 80, 64], [184, 144, 118], [92, 64, 52]];
const HAIRS = [[24, 20, 18], [48, 36, 28], [90, 88, 84]];
const BROLLY = [[26, 28, 32], [96, 32, 34], [46, 86, 88], [150, 150, 140]];

/** Paints one person at canvas x (feet centre) and ground y. dir flips them; rim is the light behind. */
function person(pc, cx, gy, t, pose, dir, r, rim) {
  const parts = POSES[pose];
  let x0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [, a, b, c, d, rad] of parts) { x0 = Math.min(x0, a - rad, c - rad); x1 = Math.max(x1, a + rad, c + rad); y1 = Math.max(y1, b + rad, d + rad); }
  const W = Math.ceil((x1 - x0) * t) + 2, H = Math.ceil(y1 * t) + 2, ox = -x0 * t + 1;
  const mask = new Uint8Array(W * H);
  for (const [p, a, b, c, d, rad] of parts) {
    const ax = ox + a * t, ay = H - 1 - b * t, bx = ox + c * t, by = H - 1 - d * t, rr = Math.max(0.6, rad * t);
    for (let y = Math.floor(Math.min(ay, by) - rr); y <= Math.ceil(Math.max(ay, by) + rr); y++) for (let x = Math.floor(Math.min(ax, bx) - rr); x <= Math.ceil(Math.max(ax, bx) + rr); x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (p === 5 && y > ay) continue;                                 // canopy: the top half of a disc
      const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      const u = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
      const ex = x - (ax + dx * u), ey = y - (ay + dy * u);
      if (ex * ex + ey * ey <= rr * rr) mask[y * W + x] = p;
    }
  }
  const pal = { 1: pick(SKINS, r), 2: pick(HAIRS, r), 3: pick(COATS, r), 4: scale(pick(COATS, r), 0.6), 5: pick(BROLLY, r), 6: [70, 58, 46] };
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : mask[y * W + x]);
  const side = r() < 0.5 ? 1 : -1;                                     // which edge faces the light
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = mask[y * W + x];
    if (!p) continue;
    const px = dir > 0 ? cx - ox + x : cx + ox - x, py = gy - (H - 1) + y;
    const v = y / H;
    // the street behind is lit, the people are not: a dim fill that keeps the coat's colour,
    // lighter up top, a rim on the side that faces their light, and rain sheen on top edges
    let c = scale(pal[p], 0.7 + (1 - v) * 0.3);
    let e = scale(pal[p], 0.16 + (1 - v) * 0.08);
    const lit = !at(x + side, y), top = !at(x, y - 1);
    if (lit) { c = mix(c, rim, 0.55); e = scale(rim, 0.3); }
    else if (top) { c = mix(c, [170, 190, 196], 0.3); e = scale(c, 0.2); }
    if (p === 1) e = scale(pal[1], 0.3);                                    // faces catch the shop light
    if (p === 5 && top) { c = mix(pal[5], [200, 220, 225], 0.45); e = scale(c, 0.25); }
    pc.put(px, py, c, { h: 1, r: p === 5 ? 0.25 : 0.8, z: 2, e });
  }
}

// ---- props -----------------------------------------------------------------------------------

function crates(pc, x, gy, t, r) {
  const s = Math.round(0.5 * t), n = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const cx = x + (i % 2) * s + (i > 1 ? s >> 1 : 0), cy = gy - (i > 1 ? s : 0);
    const c = pick([[92, 70, 48], [60, 74, 70], [104, 96, 80]], r);
    pc.rect(cx, cy - s, cx + s - 1, cy, (xx, yy) => ((yy - cy) % 3 === 0 ? scale(c, 0.7) : c), { h: 2, r: 0.8, z: 1 });
  }
}

function bike(pc, x, gy, t) {
  const R = Math.max(3, Math.round(0.33 * t)), wb = Math.round(1.05 * t), c = [36, 40, 42];
  for (const wx of [x, x + wb]) for (let a = 0; a < 64; a++) pc.put(wx + Math.cos(a / 10.2) * R, gy - R + Math.sin(a / 10.2) * R, c, { h: 2, z: 1 });
  const seat = [x + wb * 0.35, gy - R * 2.6], bar = [x + wb * 0.92, gy - R * 2.9];
  const line = (a, b) => { for (let k = 0; k <= 24; k++) pc.put(a[0] + (b[0] - a[0]) * k / 24, a[1] + (b[1] - a[1]) * k / 24, c, { h: 2, z: 1 }); };
  line([x, gy - R], seat); line(seat, [x + wb * 0.5, gy - R]); line([x + wb * 0.5, gy - R], bar); line(bar, [x + wb, gy - R]); line(seat, bar);
  pc.rect(seat[0] - 2, seat[1] - 1, seat[0] + 2, seat[1], [20, 20, 22], { z: 1 });
}

/** A drinks machine: the brightest thing in its stretch, a cold panel with a few lit buttons. */
function vending(pc, x, gy, t) {
  const w = Math.round(0.9 * t), h = Math.round(1.8 * t), c = [190, 236, 240];
  pc.rect(x, gy - h, x + w, gy, [52, 60, 66], { h: 2, r: 0.4, z: 1 });
  pc.rect(x + 2, gy - h + 2, x + w - 3, gy - Math.round(h * 0.42), (xx, yy) => ((yy - gy + h) % 4 === 0 ? scale(c, 0.55) : c), { e: scale(c, 0.7), h: 1, z: 1 });
  for (let k = 0; k < 4; k++) pc.put(x + w - 2, gy - h + 4 + k * 3, [255, 110, 90], { e: [255, 80, 60], z: 1 });
  pc.rect(x + 2, gy - Math.round(h * 0.25), x + w - 3, gy - Math.round(h * 0.18), [14, 16, 18], { z: 1 });
}

function hangingSign(pc, x, y, t, r) {
  const w = Math.round((0.8 + r() * 0.7) * t), h = Math.round((0.5 + r() * 0.3) * t), c = hex(pick([0xff3d7f, 0x31e3d2, 0xffb347, 0xfff0c8], r));
  for (const bx of [x + 2, x + w - 3]) for (let k = 1; k <= 3; k++) pc.put(bx, y - k, [26, 30, 32], { z: 1 });
  sign(pc, x, y, w, h, c, r);
}

/** Cables across the street with a bulb every so often; every third bulb gets a breathing glow. */
function bulbString(pc, xa, xb, ya, sag, t, r, glow, toWorld) {
  const c = pick([[255, 206, 140], [255, 190, 120], [255, 140, 170]], r), every = Math.max(4, Math.round(0.7 * t));
  let n = 0;
  for (let x = xa; x <= xb; x++) {
    const u = (x - xa) / Math.max(1, xb - xa), y = ya + sag * 4 * u * (1 - u);
    pc.put(x, y, [18, 22, 24], { h: 1, z: 1 });
    if ((x - xa) % every === 0 && x > xa) {
      pc.put(x, y + 1, c, { e: c, h: 1.5, z: 1 });
      if (n++ % 3 === 0) { const [wx, wy] = toWorld(x, y + 1); glow(wx, wy, PROPS_Z + 0.1, c, 0.7, 0.32); }
    }
  }
}

/** The props flat: one canvas the width of the street, painted from the frontage list. */
function props(group, fronts, r, glow) {
  if (!fronts.length) return;
  const t = tpuAt(PROPS_Z), X0 = fronts[0][0], X1 = fronts[fronts.length - 1][1], HM = 5.2;
  const W = Math.round((X1 - X0) * t), H = Math.round(HM * t), gy = H - 1;
  const pc = new PixelCanvas(W, H);
  const cx = (wx) => Math.round((wx - X0) * t);
  const toWorld = (px, py) => [X0 + px / t, (H - py) / t];
  const WARM = [255, 186, 120];
  for (const [a, b] of fronts) {
    let x = a + 0.4 + r() * 0.8;
    while (x < b - 0.6) {
      const p = r(), rim = r() < 0.7 ? WARM : COOL;
      if (p < 0.34) {                                                     // one or two people
        person(pc, cx(x), gy, t, pick(['stand', 'stand', 'umbrella', 'eat', 'lean'], r), r() < 0.5 ? 1 : -1, r, rim);
        if (r() < 0.45) person(pc, cx(x + 0.45 + r() * 0.2), gy, t, pick(['stand', 'eat', 'umbrella'], r), -1, r, rim);
        x += 1.3 + r() * 1.2;
      } else if (p < 0.46) { crates(pc, cx(x), gy, t, r); if (r() < 0.5) person(pc, cx(x + 0.75), gy, t, 'sit', -1, r, rim); x += 1.6 + r(); }
      else if (p < 0.52) { bike(pc, cx(x), gy, t); x += 1.8; }
      else if (p < 0.57) { vending(pc, cx(x), gy, t); const [wx, wy] = toWorld(cx(x) + 0.45 * t, gy - 1.3 * t); glow(wx, wy, PROPS_Z + 0.2, [190, 236, 240], 2.2, 0.45); x += 1.4; }
      else x += 0.8 + r() * 1.6;                                          // nothing: the street needs gaps
    }
    if (r() < 0.55) hangingSign(pc, cx(a + 0.6 + r() * Math.max(0.2, b - a - 2.2)), Math.round(gy - (3.0 + r() * 0.5) * t), t, r);
  }
  // bulb strings sagging across a few stretches
  for (let x = X0 + r() * 4; x < X1 - 6; x += 7 + r() * 9) {
    if (r() < 0.35) continue;
    const span = 4 + r() * 5, ya = Math.round(gy - (3.7 + r() * 0.8) * t);
    bulbString(pc, cx(x), Math.min(W - 1, cx(x + span)), ya, Math.round((0.25 + r() * 0.3) * t), t, r, glow, toWorld);
  }
  hazeCanvas(pc, 0.1, HAZE, 0.02);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, HM), cardMat(pc, { emissiveIntensity: 2.2 }));
  mesh.position.set((X0 + X1) / 2, HM / 2, PROPS_Z);
  mesh.userData.band = true;
  group.add(mesh);
}
