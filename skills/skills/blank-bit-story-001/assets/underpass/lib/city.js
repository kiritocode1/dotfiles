// The city behind the street, generated from a seed (?seed=N rerolls it).
//   - districts: a noise curve along x decides whether a stretch is industrial, residential or
//     downtown, and a second curve shapes the skyline, so heights rise and fall in runs
//   - building types, each with its own facade grammar and roofs: tenements (paired windows, a
//     lit stairwell column, balconies, fire escapes), housing blocks (open corridor galleries
//     with lamps), offices (ribbon glazing, setbacks, lit crowns), towers (spires, edge neon),
//     warehouses (sawtooth roofs, multi-pane windows, loading doors), shophouses (shops, signs)
//   - lights cluster the way people live: a whole apartment or office floor is on or off, and
//     each building has its own share of lit rooms, so some stand dark and some blaze
//   - cables sagging between buildings, five depth bands with fixed haze instead of distance
//     fog, and a glowing haze card in front of each band
import * as THREE from 'three';
import { PixelCanvas, pixelMaterial, hex, mix, noise2, hash2, rng } from './pixel.js';
import { tpuAt } from './world.js';

const MOODS = [
  { c: [255, 178, 102], w: 0.55 },   // warm amber
  { c: [255, 214, 160], w: 0.15 },   // warm white
  { c: [150, 214, 255], w: 0.17 },   // cool white
  { c: [255, 112, 168], w: 0.07 },   // pink
  { c: [120, 255, 214], w: 0.06 },   // aqua
];
const pickMood = (r) => { let x = r(); for (const m of MOODS) { if ((x -= m.w) <= 0) return m.c; } return MOODS[0].c; };
const WALLS = {
  brick: [0x4c2f28, 0x56352b, 0x3f2a26],
  concrete: [0x41474a, 0x3a4044, 0x4a4e4f],
  tile: [0x2f4245, 0x34484a, 0x283b3e],
  plaster: [0x4e4434, 0x463f33, 0x55493a],
};
const NEON = [0xff3d7f, 0x31e3d2, 0xffb347, 0x8f7bff];
const METAL = hex(0x1c2123), METAL_HI = hex(0x3a4447);
const scale = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const lerp = ([a, b], u) => a + (b - a) * u;
const pick = (list, r) => list[Math.floor(r() * list.length)];

// Building types. w and h are fractions of the band's width and height ranges; floor is the
// storey height in world units; lit is the range of a building's share of lit rooms.
export const TYPES = {
  tenement: { kinds: ['brick', 'plaster'], w: [0.6, 1.0], h: [0.3, 0.7], floor: 3.1, layout: 'pair', roofs: ['flat', 'flat', 'cornice', 'gable'], balconies: 0.5, fireEscape: 0.6, shop: 0.6, lit: [0.25, 0.55] },
  shophouse: { kinds: ['plaster', 'tile', 'brick'], w: [0.45, 0.65], h: [0.25, 0.5], floor: 3.0, layout: 'grid', roofs: ['flat', 'cornice', 'gable'], balconies: 0.6, fireEscape: 0.2, shop: 1, lit: [0.3, 0.6], signs: 1.8 },
  block: { kinds: ['concrete', 'plaster'], w: [0.9, 1.4], h: [0.45, 0.85], floor: 2.9, layout: 'gallery', roofs: ['flat', 'setback'], shop: 0.3, lit: [0.25, 0.6] },
  office: { kinds: ['concrete', 'tile'], w: [0.75, 1.2], h: [0.6, 1.0], floor: 3.4, layout: 'ribbon', roofs: ['setback', 'crown', 'flat'], shop: 0.2, lit: [0.1, 0.7] },
  tower: { kinds: ['concrete', 'tile'], w: [0.55, 0.8], h: [1.0, 1.45], floor: 3.4, layout: 'ribbon', roofs: ['crown', 'spire', 'setback'], shop: 0, lit: [0.2, 0.6], neon: 0.6 },
  warehouse: { kinds: ['brick', 'concrete'], w: [1.0, 1.6], h: [0.15, 0.35], floor: 4.4, layout: 'industrial', roofs: ['sawtooth', 'sawtooth', 'flat'], shop: 0, lit: [0.05, 0.3] },
};

// d: district value 0 (industrial) .. 1 (downtown); far: 0 for the nearest band, 1 for the farthest.
function pickType(r, d, far) {
  const bump = (c, w) => Math.max(0, 1 - Math.abs(d - c) / w);
  const weights = {
    warehouse: bump(0.1, 0.35) * 1.4 * (1.1 - far),
    tenement: bump(0.45, 0.4) * (1.3 - far * 0.6),
    shophouse: bump(0.4, 0.3) * (1 - far) * 0.9,
    block: bump(0.55, 0.45) * 0.8,
    office: bump(0.8, 0.35) * (0.5 + far),
    tower: bump(0.95, 0.25) * (0.15 + far * 1.2),
  };
  let total = 0; for (const k in weights) total += weights[k];
  let x = r() * total;
  for (const k in weights) if ((x -= weights[k]) <= 0) return k;
  return 'tenement';
}

/**
 * The silhouette as tiers: [{ x0, x1, top }], widest first. A column x is wall from the
 * smallest top of any tier covering it down to the ground.
 */
function profile(roof, W, wallH, y0, r, t) {
  if (roof === 'setback' && W > 10) {
    const steps = r() < 0.5 ? 2 : 3, side = r(), tiers = [];
    let x0 = 0, x1 = W, top = y0 + Math.round(wallH * (0.16 + r() * 0.16));
    tiers.push({ x0, x1, top });
    for (let s = 1; s < steps; s++) {
      const cut = Math.max(2, Math.round((x1 - x0) * (0.12 + r() * 0.14)));
      if (side < 0.33) x1 -= cut; else if (side < 0.66) { x0 += cut; x1 -= cut; } else x0 += cut;
      top = s === steps - 1 ? y0 : top - Math.round((top - y0) * (0.4 + r() * 0.3));
      tiers.push({ x0, x1, top });
    }
    return tiers;
  }
  if ((roof === 'crown' || roof === 'spire') && W > 8) {
    const inset = Math.max(1, Math.round(W * 0.1)), ch = Math.max(3, Math.round(t * 2.2));
    return [{ x0: 0, x1: W, top: y0 + ch }, { x0: inset, x1: W - inset, top: y0 }];
  }
  return [{ x0: 0, x1: W, top: y0 }];
}

/**
 * One building, painted into a PixelCanvas sized for its depth. o: { type, w, h (wall
 * height), roof (room above the wall for roof shapes and clutter), seed, kind, t, shop,
 * sign, billboard, litShare }. Returns the canvas; the caller hazes it and makes the mesh.
 */
export function paintBuilding(o) {
  const T = TYPES[o.type], t = o.t, r = rng(o.seed);
  const W = Math.max(4, Math.round(o.w * t)), wallH = Math.round(o.h * t), roofH = Math.round(o.roof * t);
  const H = wallH + roofH, y0 = roofH;
  const pc = new PixelCanvas(W, H);
  const wall = hex(pick(WALLS[o.kind], r));
  const floorH = Math.max(4, Math.round(T.floor * t));
  const groundH = o.shop || o.type === 'warehouse' ? Math.max(5, Math.round(4.2 * t)) : floorH;
  const roof = pick(T.roofs, r);
  const tiers = profile(roof, W, wallH, y0, r, t);
  const colTop = new Int32Array(W).fill(H);
  for (const tr of tiers) for (let x = tr.x0; x < tr.x1; x++) colTop[x] = Math.min(colTop[x], tr.top);
  const inside = (x, y) => x >= 0 && x < W && y >= colTop[x] && y < H;
  const topTier = tiers[tiers.length - 1];

  // roof shapes and clutter first: the wall drawn after covers anything that overhangs a
  // taller neighbouring tier
  if (roof === 'gable') gable(pc, y0, W, roofH, r, t, wall);
  else if (roof === 'sawtooth') sawtooth(pc, y0, W, roofH, r, t, o.litShare);
  else {
    for (const tr of tiers) {                     // clutter on every exposed run of roof
      const top = tr === topTier;
      for (let x = tr.x0; x < tr.x1;) {
        if (colTop[x] !== tr.top) { x++; continue; }
        let x1 = x; while (x1 < tr.x1 && colTop[x1] === tr.top) x1++;
        if (roof === 'spire' && top) spire(pc, (x + x1) >> 1, tr.top, roofH, t);
        else if (o.billboard && top && billboard(pc, x, x1, tr.top, roofH, t, hex(o.billboard), r)) { /* board takes the roof */ }
        else rooftop(pc, tr.top, x, x1, top ? roofH : Math.min(roofH, Math.round(1.4 * t)), r, t);
        x = x1;
      }
    }
  }

  // wall: noise, rain streaks from each column's top, brick or tile courses close up
  const streaks = new Float32Array(W);
  for (let x = 0; x < W; x++) streaks[x] = hash2(x >> 1, 3, o.seed) < 0.16 ? 0.3 + hash2(x, 5, o.seed) * 0.6 : 0;
  const course = Math.max(2, Math.round(t * 0.09)), tileS = Math.max(3, Math.round(t * 0.18));
  pc.rect(0, 0, W, H, (x, y) => {
    if (!inside(x, y)) return null;
    const n = noise2(x / (t * 1.6), y / (t * 1.6), o.seed) - 0.5, f = hash2(x, y, o.seed) - 0.5;
    const yy = y - colTop[x];
    let k = 1 + n * 0.3 + f * 0.06 - streaks[x] * Math.max(0, 1 - yy / (wallH * 0.5)) * 0.35;
    if (o.kind === 'brick' && t > 7) {
      const row = Math.floor(yy / course);
      if (yy % course === 0 || (x + (row % 2) * 3) % Math.max(4, Math.round(t * 0.22)) === 0) k *= 0.82;
    }
    if (o.kind === 'tile' && t > 7 && (x % tileS === 0 || yy % tileS === 0)) k *= 0.85;
    return scale(wall, k);
  }, (x, y) => ({ h: (hash2(x, y, o.seed + 2) - 0.5) * 0.4, r: 0.85 }));

  // storeys counted up from the ground, so every tier shares the same floor lines
  const floors = [];
  for (let fb = H - groundH, i = 0; fb - floorH >= topTier.top + Math.max(1, Math.round(0.4 * t)); fb -= floorH, i++) floors.push({ top: fb - floorH, bot: fb, i });

  // cornices between storeys (not on glass offices or gallery blocks, which carry their own lines)
  if (T.layout === 'pair' || T.layout === 'grid' || T.layout === 'industrial') {
    for (const f of floors) for (let x = 0; x < W; x++) {
      if (!inside(x, f.bot - 1)) continue;
      pc.put(x, f.bot - 1, scale(wall, 1.35), { h: 2, r: 0.7 });
      if (inside(x, f.bot)) pc.put(x, f.bot, scale(wall, 0.6), { h: -0.5, r: 0.9 });
    }
  }
  // parapet along every roof edge
  const parH = Math.max(1, Math.round((roof === 'cornice' ? 0.5 : 0.25) * t));
  for (let x = 0; x < W; x++) for (let k = 0; k < parH; k++) pc.put(x, colTop[x] + k, scale(wall, k === 0 ? 1.45 : 1.2), { h: roof === 'cornice' && k === parH - 1 ? 3.5 : 2.5, r: 0.7 });

  // facade
  const c = { pc, r, t, W, H, wall, floors, floorH, inside, seed: o.seed, litShare: o.litShare, top: topTier.top + parH, groundTop: H - groundH };
  if (T.layout === 'ribbon') ribbon(c);
  else if (T.layout === 'gallery') gallery(c);
  else if (T.layout === 'industrial') industrial(c);
  else {
    const cols = windows(c, T.layout === 'pair');
    if (r() < T.balconies) balconies(c, cols);
    if (o.kind === 'brick' && r() < T.fireEscape && t > 5) fireEscape(c);
  }
  if (roof === 'crown') crown(c, topTier, tiers[0].top);
  if (T.neon && r() < T.neon) edgeNeon(c, topTier, hex(pick(NEON, r)), wallH);

  // ground floor: shops, or loading doors on a warehouse
  if (o.shop) shopfront(pc, H - groundH, W, groundH, r, t, wall);
  else if (o.type === 'warehouse') loadingBay(pc, H - groundH, W, groundH, r, t, wall);

  // drainpipe down one side, with brackets
  if (r() < 0.75 && t > 3) {
    const px = r() < 0.5 ? 1 : W - 2;
    for (let y = colTop[px]; y < H; y++) pc.put(px, y, y % Math.max(3, Math.round(t * 0.8)) === 0 ? METAL_HI : METAL, { h: 2, r: 0.4 });
  }
  // vertical neon blade sign
  if (o.sign) {
    const sx = Math.round(W * o.sign.x);
    bladeSign(pc, sx, colTop[Math.min(W - 1, sx)] + Math.round(wallH * 0.12), Math.round(wallH * 0.42), t, hex(o.sign.color), r);
  }
  return pc;
}

// ---- facades --------------------------------------------------------------------------

// Lit rooms come in apartments: every window of one unit shares on/off and its lamp colour.
const unitLit = (c, f, u) => hash2(u, f, c.seed) < c.litShare;
const unitMood = (c, f, u) => pickMood(() => hash2(u, f, c.seed + 11));
const fits = (c, x, y, w) => c.inside(x - 1, y - 1) && c.inside(x + w, y - 1);

/** Punched windows, evenly spaced or in pairs, with an optional stairwell column. Returns the columns. */
function windows(c, pair) {
  const { pc, r, t, W, floorH, wall, floors } = c;
  const bay = Math.max(3, Math.round((1.5 + r() * 0.6) * t));
  const winW = Math.max(2, Math.round(bay * (pair ? 0.55 : 0.48 + r() * 0.14)));
  const winH = Math.max(2, Math.round(floorH * (0.5 + r() * 0.12)));
  const cols = [];
  if (pair) {
    const gap = Math.max(1, Math.round(t * 0.22)), pier = Math.max(2, Math.round(bay * 0.6));
    for (let x = 0; x + 2 * winW + gap <= W - 2; x += 2 * winW + gap + pier) cols.push(x, x + winW + gap);
  } else for (let x = 0; x + winW <= W - 2; x += bay) cols.push(x);
  const shift = cols.length ? Math.max(1, (W - (cols[cols.length - 1] + winW)) >> 1) : 0;
  for (let i = 0; i < cols.length; i++) cols[i] += shift;
  const unitCols = pair ? 2 : 2 + (r() < 0.5 ? 1 : 0);
  // a stairwell: narrow windows half a storey down, lit on most landings with cold tube light
  const stair = cols.length >= 4 && r() < 0.45 ? 1 + Math.floor(r() * (cols.length - 2)) : -1;
  for (const f of floors) {
    for (let ci = 0; ci < cols.length; ci++) {
      const x = cols[ci];
      if (ci === stair) {
        const sw = Math.max(1, winW >> 1), sx = x + ((winW - sw) >> 1), sy = f.top + Math.round(floorH * 0.55), sh = Math.max(2, Math.round(winH * 0.7));
        if (!fits(c, sx, sy, sw) || sy + sh >= c.H) continue;
        window_(pc, sx, sy, sw, sh, r, t, wall, hash2(ci, f.i, c.seed + 5) < 0.75, [170, 235, 200]);
        continue;
      }
      const wy = f.top + Math.round(floorH * 0.28);
      if (!fits(c, x, wy, winW)) continue;
      const u = Math.floor(ci / unitCols);
      window_(pc, x, wy, winW, winH, r, t, wall, unitLit(c, f.i, u), unitMood(c, f.i, u));
      // AC unit under some windows, with a drip stain down the wall
      if (t > 5 && r() < 0.12) {
        const aw = Math.max(2, Math.round(0.55 * t)), ah = Math.max(2, Math.round(0.4 * t)), ax = x + (r() < 0.5 ? 0 : winW - aw), ay = wy + winH + 1;
        pc.rect(ax, ay, ax + aw, ay + ah, (xx) => ((xx - ax) % 2 === 0 && t > 9 ? hex(0x6e7474) : hex(0x868c8b)), { h: 2.5, r: 0.5 });
        for (let d = ay + ah; d < Math.min(c.H, ay + ah + floorH * 0.8); d++) if (hash2(ax, d, 7) > 0.35) pc.put(ax + (aw >> 1), d, scale(wall, 0.72), { h: -0.3 });
      }
    }
  }
  c.winW = winW; c.winH = winH;
  return cols.filter((_, i) => i !== stair);
}

/** Office glazing: a continuous band of glass per storey, lit a floor at a time. */
function ribbon(c) {
  const { pc, t, W, floorH, wall, floors, seed, litShare, r } = c;
  const m = Math.max(2, Math.round(t * 0.85)), margin = Math.max(1, Math.round(t * 0.45));
  const tube = r() < 0.65 ? [175, 215, 235] : [255, 222, 176];
  const gh = Math.max(2, Math.round(floorH * 0.56));
  for (const f of floors) {
    const gy = f.top + Math.round(floorH * 0.24);
    const floorOn = hash2(f.i, 1, seed) < litShare * 1.3;
    for (let x = 0; x < W; x++) {
      if (!c.inside(x - margin, gy - 1) || !c.inside(x + margin, gy - 1)) continue;
      const lit = floorOn && hash2(Math.floor(x / (m * 4)), f.i, seed + 3) > 0.28;
      pc.put(x, gy - 1, scale(wall, 1.3), { h: 1.5, r: 0.6 });                       // head
      pc.put(x, gy + gh, scale(wall, 1.15), { h: 1.5, r: 0.6 });                     // sill
      for (let y = gy; y < gy + gh; y++) {
        const v = (y - gy) / Math.max(1, gh - 1);
        if (x % m === 0) { pc.put(x, y, scale(wall, 0.55), { h: 1, r: 0.5 }); continue; }
        if (lit) {
          // desks as runs along the bottom, and now and then someone standing at the glass
          // furniture: a dim band along the bottom (lit from above, so not black), and now and
          // then someone standing at the glass in silhouette
          const desk = y >= gy + gh - Math.max(1, Math.round(gh * 0.18)) && hash2(x >> 3, f.i, seed + 4) > 0.2;
          const person = v > 0.3 && hash2(x >> 1, f.i, seed + 6) > 0.96 && (v > 0.42 || (x & 1) === 0);
          const col = person ? [24, 26, 30] : desk ? scale(tube, 0.32) : scale(tube, 0.95 - v * 0.35);
          pc.put(x, y, col, { h: -1, r: 0.2, e: person ? null : scale(tube, desk ? 0.18 : 0.8 - v * 0.3) });
        } else {
          const glint = ((x - y) & 7) === 0;
          pc.put(x, y, glint ? [44, 70, 82] : [22, 30, 38], { h: -1, r: 0.1 });
        }
      }
    }
  }
}

/** Housing block: an open corridor on every storey with a railing, doors, small windows and lamps. */
function gallery(c) {
  const { pc, t, W, floorH, wall, floors, seed, r } = c;
  const unit = Math.max(4, Math.round(2.3 * t)), rail = Math.max(2, Math.round(floorH * 0.3));
  const lamp = r() < 0.6 ? [190, 230, 215] : [255, 200, 140];
  const doorW = Math.max(1, Math.round(0.4 * t)), doorH = Math.max(2, Math.round(floorH * 0.62));
  for (const f of floors) {
    // recess: the corridor wall sits back, a shade darker
    for (let x = 0; x < W; x++) for (let y = f.top + 1; y < f.bot - 1; y++) if (c.inside(x, f.top)) pc.put(x, y, scale(wall, 0.72 + (hash2(x, y, seed) - 0.5) * 0.06), { h: -0.8, r: 0.85 });
    for (let u = 0, ux = 1; ux + unit <= W; u++, ux += unit) {
      if (!c.inside(ux, f.top) || !c.inside(ux + unit - 1, f.top)) continue;
      const lit = unitLit(c, f.i, u), mood = unitMood(c, f.i, u);
      pc.rect(ux + 1, f.bot - 1 - doorH, ux + 1 + doorW, f.bot - 1, [20, 22, 24], { h: -1.2, r: 0.6 });
      const ww = Math.max(2, Math.round(unit * 0.35)), wy = f.top + Math.round(floorH * 0.3);
      window_(pc, ux + 2 + doorW, wy, ww, Math.max(2, Math.round(floorH * 0.35)), r, t, wall, lit, mood);
      if (hash2(u, f.i, seed + 9) > 0.18) {                                            // corridor lamp and its pool on the wall
        const lx = ux + unit - 2;
        pc.put(lx, f.top + 1, lamp, { e: lamp, h: 1 });
        for (let k = 2; k < 4; k++) if (f.top + k < f.bot - 1) pc.put(lx, f.top + k, mix(scale(wall, 0.72), lamp, 0.3 - k * 0.05), { e: scale(lamp, 0.12) });
      }
    }
    // slab and railing in front
    for (let x = 0; x < W; x++) {
      if (!c.inside(x, f.top)) continue;
      pc.put(x, f.top, scale(wall, 1.3), { h: 3, r: 0.6 });
      pc.put(x, f.bot - 1, scale(wall, 1.25), { h: 3, r: 0.6 });
      for (let k = 1; k <= rail; k++) if (x % 2 === 0 || k === rail) pc.put(x, f.bot - 1 - k, METAL, { h: 3.2, r: 0.4 });
    }
    // washing hung over the rail
    if (t > 6) for (let x = 1; x < W - 1; x++) if (c.inside(x, f.top) && hash2(x >> 2, f.i, seed + 7) > 0.78 && hash2(x, f.i, seed) > 0.4) {
      const cloth = [hex(0xb8b2a4), hex(0x7a3a34), hex(0x3f5f7a), hex(0xc49a4a)][Math.floor(hash2(x, f.i, seed + 8) * 4)];
      for (let k = 0; k < 2; k++) pc.put(x, f.bot - 1 - rail + k, scale(cloth, 0.8), { h: 3.5, r: 0.9 });
    }
  }
}

/** Warehouse: tall steel windows of small panes, mostly dark, a few lit or broken. */
function industrial(c) {
  const { pc, t, W, floorH, floors, seed, litShare, r } = c;
  const bay = Math.max(5, Math.round(2.6 * t)), ww = Math.max(3, Math.round(bay * 0.7));
  const glow = r() < 0.5 ? [255, 190, 120] : [170, 220, 210];
  // a low shed has no full storey above its loading doors: glaze the strip that is there
  const levels = floors.length ? floors : [{ top: c.top + 1, bot: c.groundTop, i: 0 }];
  for (const f of levels) {
    const fh = f.bot - f.top, wh = Math.max(3, Math.round(fh * 0.62)), wy = f.top + Math.round(fh * 0.2);
    if (wh < 3) continue;
    for (let x = ((W % bay) >> 1) + ((bay - ww) >> 1); x + ww <= W - 1; x += bay) {
      if (!fits(c, x, wy, ww)) continue;
      pc.rect(x - 1, wy - 1, x + ww + 1, wy + wh + 1, METAL_HI, { h: 1.5, r: 0.5 });
      pc.rect(x, wy, x + ww, wy + wh, (xx, yy) => {
        if ((xx - x) % 2 === 1 && (yy - wy) % 2 === 1) return null;
        return METAL;
      }, { h: 1.2, r: 0.5 });
      for (let py = wy; py < wy + wh; py += 2) for (let px = x; px < x + ww; px += 2) {
        const hsh = hash2(px, py, seed);
        const lit = hash2(Math.floor(px / 6), f.i, seed + 2) < litShare && hsh > 0.25;
        const col = lit ? scale(glow, 0.6 + hsh * 0.3) : hsh < 0.08 ? [8, 10, 10] : [36, 50, 50];
        pc.put(px, py, col, { h: -1, r: 0.15, e: lit ? scale(glow, 0.45) : null });
      }
    }
  }
}

/** Office crown: fins over the top tier and a lit band across it. */
function crown(c, tier, bodyTop) {
  const { pc, wall, t } = c, ch = bodyTop - tier.top;
  const band = hex(0x9fe8f0), by = tier.top + Math.round(ch * 0.55);
  for (let x = tier.x0; x < tier.x1; x++) {
    for (let y = tier.top + 1; y < bodyTop; y++) if ((x - tier.x0) % 2 === 1) pc.put(x, y, scale(wall, 0.62), { h: 1.5, r: 0.6 });
    if (t > 3) pc.put(x, by, band, { e: scale(band, 0.85), h: 1 });
  }
}

/** Thin neon tubes up the corners of a tower's top tier. */
function edgeNeon(c, tier, col, wallH) {
  const len = Math.round(wallH * 0.35);
  for (const x of [tier.x0 + 1, tier.x1 - 2]) for (let y = tier.top + 1; y < tier.top + len && y < c.H; y++) c.pc.put(x, y, col, { e: col, h: 2, r: 0.3 });
}

function window_(pc, x0, y0, w, h, r, t, wall, lit, c) {
  const frame = scale(wall, 1.45);
  // frame and sill
  pc.rect(x0 - 1, y0 - 1, x0 + w + 1, y0 + h + 1, frame, { h: 1.6, r: 0.6 });
  pc.rect(x0 - 1, y0 + h, x0 + w + 1, y0 + h + 1, scale(frame, 1.15), { h: 2.2, r: 0.5 });
  if (!lit) {
    // dark glass with a faint diagonal reflection, sometimes tinted by a sign across the street
    const tint = r() < 0.15 ? [50, 120, 130] : [34, 44, 52];
    pc.rect(x0, y0, x0 + w, y0 + h, (x, y) => (((x - y) & 7) === 0 && w > 2 ? scale(tint, 1.5) : scale(tint, 0.55)), { h: -1.2, r: 0.12 });
    mullions(pc, x0, y0, w, h, frame);
    return;
  }
  const dim = 0.45 + r() * 0.55;
  const blinds = r() < 0.3, curtain = !blinds && r() < 0.4, person = r() < 0.18, plant = !person && r() < 0.18, tv = r() < 0.08;
  const tvC = [90, 150, 255];
  pc.rect(x0, y0, x0 + w, y0 + h, (x, y) => {
    const v = (y - y0) / Math.max(1, h - 1);
    let k = 1.05 - v * 0.45;                                    // ceiling lamp: bright at the top
    if (blinds && (y - y0) % 2 === 1) k *= 0.45;
    let col = scale(c, k);
    if (curtain && (x - x0 < Math.max(1, w * 0.28) || x0 + w - x <= Math.max(1, w * 0.18))) col = scale(mix(c, [150, 60, 70], 0.6), 0.6);
    if (tv && x - x0 >= w * 0.5 && v > 0.5) col = mix(col, tvC, 0.6);
    return col;
  }, (x, y) => {
    const v = (y - y0) / Math.max(1, h - 1);
    let k = (1.05 - v * 0.45) * dim;
    if (blinds && (y - y0) % 2 === 1) k *= 0.4;
    return { h: -1.2, r: 0.2, e: scale(c, k) };
  });
  // a figure or a plant against the light
  if (person && w >= 3 && h >= 4) {
    const px = x0 + 1 + Math.floor(r() * Math.max(1, w - 2)), hy = y0 + Math.round(h * 0.35);
    pc.rect(px, hy, px + 1, hy + 1, [20, 16, 18], { h: -1, r: 0.6 });
    pc.rect(px - (w > 4 ? 1 : 0), hy + 1, px + 1 + (w > 4 ? 1 : 0), y0 + h, [20, 16, 18], { h: -1, r: 0.6 });
  }
  if (plant && w >= 3) for (let i = 0; i < w; i++) if (hash2(x0 + i, y0, 9) > 0.35) pc.put(x0 + i, y0 + h - 1 - (hash2(i, y0, 3) > 0.6 ? 1 : 0), [26, 52, 30], { h: -0.5 });
  mullions(pc, x0, y0, w, h, frame);
}

// Window bars: a centre post and a transom, drawn last so lit panes read as glass, not blocks.
function mullions(pc, x0, y0, w, h, frame) {
  const bar = scale(frame, 0.55), o = { h: 1.4, r: 0.6 };
  if (w >= 5) pc.rect(x0 + (w >> 1), y0, x0 + (w >> 1) + 1, y0 + h, bar, o);
  if (h >= 6) { const ty = y0 + Math.round(h * 0.34); pc.rect(x0, ty, x0 + w, ty + 1, bar, o); }
}

/** Balconies on alternate storeys under the window columns: slab, railing, laundry or plants. */
function balconies(c, cols) {
  const { pc, r, t, wall, floors, winW, winH, floorH } = c;
  if (t <= 4 || !cols.length) return;
  const every = r() < 0.5 ? 1 : 2, slab = scale(wall, 1.2), rail = Math.max(2, Math.round(0.45 * t));
  for (const f of floors) {
    if (f.i % every) continue;
    const y = f.top + Math.round(floorH * 0.28) + winH;
    for (const bx0 of cols) {
      const bx = bx0 - 1, x1 = bx0 + winW + 1;
      if (r() < 0.35 || !c.inside(bx, y - rail - 1) || !c.inside(x1, y - rail - 1)) continue;
      pc.rect(bx, y + 1, x1, y + 2, slab, { h: 3, r: 0.6 });
      for (let x = bx; x < x1; x++) for (let k = 1; k <= rail; k++) if (x % 2 === 0 || k === rail) pc.put(x, y + 1 - k, METAL, { h: 3, r: 0.4 });
      if (r() < 0.45) {                          // laundry line
        for (let x = bx + 1; x < x1 - 1; x++) {
          if (hash2(x, y, 4) < 0.55) continue;
          const cloth = [hex(0xb8b2a4), hex(0x7a3a34), hex(0x3f5f7a), hex(0xc49a4a), hex(0x6a7a52)][Math.floor(hash2(x, y, 5) * 5)];
          const len = 1 + Math.floor(hash2(x, y, 6) * Math.max(1, rail));
          for (let k = 0; k < len; k++) pc.put(x, y - rail - 1 + k, scale(cloth, 0.8), { h: 3.5, r: 0.9 });
        }
      } else if (r() < 0.5) {                    // plants spilling over the rail
        for (let x = bx; x < x1; x++) if (hash2(x, y, 8) > 0.4) pc.put(x, y - rail - (hash2(x, y, 2) > 0.6 ? 1 : 0), [30, 58, 34], { h: 3.5, r: 0.9 });
      }
    }
  }
}

/** Fire escape: a platform on each storey, stairs zig-zagging between them. */
function fireEscape(c) {
  const { pc, r, t, W, floors, inside } = c;
  const fw = Math.max(5, Math.round(2.4 * t)), fx = Math.round(r() * Math.max(1, W - fw - 2)) + 1;
  const levels = floors.filter((f) => inside(fx, f.top) && inside(fx + fw, f.top)).sort((a, b) => a.bot - b.bot);
  const railH = Math.max(2, Math.round(0.4 * t));
  let dir = 1;
  for (let i = 0; i < levels.length; i++) {
    const fy = levels[i].bot - 1;
    pc.rect(fx, fy, fx + fw, fy + 1, METAL_HI, { h: 4, r: 0.4 });                    // platform
    for (let x = fx; x < fx + fw; x += 2) for (let k = 1; k < railH; k++) pc.put(x, fy - k, METAL, { h: 4 });
    pc.rect(fx, fy - railH, fx + fw, fy - railH + 1, METAL, { h: 4 });
    if (i + 1 >= levels.length) break;
    const sy = fy + 1, ey = levels[i + 1].bot - 1;                                    // stair down to the next one
    for (let y = sy; y < ey; y++) { const k = (y - sy) / Math.max(1, ey - sy); const x = Math.round(dir > 0 ? fx + k * (fw - 1) : fx + fw - 1 - k * (fw - 1)); pc.put(x, y, METAL_HI, { h: 4.2 }); pc.put(x + (dir > 0 ? -1 : 1), y, METAL, { h: 4 }); }
    dir = -dir;
  }
}

// ---- roofs ----------------------------------------------------------------------------

function gable(pc, y0, W, roofH, r, t, wall) {
  const gh = Math.min(roofH - 1, Math.max(2, Math.round(W * (0.22 + r() * 0.12))));
  const tileC = r() < 0.5 ? [52, 40, 38] : [38, 44, 46];
  pc.poly([[0, y0], [W / 2, y0 - gh], [W, y0]], (x, y) => scale(tileC, (y - y0) % 2 ? 0.85 : 1.05), { h: 2.5, r: 0.7 });
  if (W > 8 && r() < 0.6) {                                                           // a chimney on one slope
    const cx = Math.round(W * (r() < 0.5 ? 0.25 : 0.7)), ch = Math.round(gh * 0.9);
    pc.rect(cx, y0 - ch, cx + Math.max(2, Math.round(0.4 * t)), y0, scale(wall, 0.9), { h: 3, r: 0.8 });
  }
  if (t > 6 && gh > 5) {                                                              // dormer window in the gable
    const dw = Math.max(2, Math.round(t * 0.4)), dx = (W >> 1) - (dw >> 1), dy = y0 - Math.round(gh * 0.55);
    window_(pc, dx, dy, dw, Math.max(2, Math.round(gh * 0.3)), r, t, wall, r() < 0.4, pickMood(r));
  }
}

function sawtooth(pc, y0, W, roofH, r, t, litShare) {
  const tw = Math.max(4, Math.round(3 * t)), th = Math.min(roofH - 1, Math.max(2, Math.round(tw * 0.45)));
  const glass = [120, 170, 170];
  for (let x0 = 0; x0 < W; x0 += tw) {
    const lit = r() < litShare + 0.15;
    pc.poly([[x0, y0], [x0 + tw - 1, y0 - th], [x0 + tw - 1, y0]], [44, 46, 46], { h: 2, r: 0.8 });
    for (let y = y0 - th; y < y0; y++) pc.put(x0 + tw - 1, y, lit ? glass : [30, 40, 42], { h: 1, r: 0.2, e: lit ? scale(glass, 0.5) : null });
  }
}

function spire(pc, x, top, roofH, t) {
  const sh = Math.max(4, roofH - 2);
  for (let k = 0; k < sh; k++) {
    pc.put(x, top - 1 - k, METAL_HI, { h: 3 });
    if (k < sh * 0.4) pc.put(x - 1, top - 1 - k, METAL, { h: 3 });
    if (k % Math.max(3, Math.round(t * 0.7)) === 2) { pc.put(x - 1, top - 1 - k, METAL); pc.put(x + 1, top - 1 - k, METAL); }
  }
  pc.put(x, top - sh, [255, 60, 40], { e: [255, 40, 20], h: 3 });
}

/** Rooftop billboard on legs. Returns false when the roof is too small for one. */
function billboard(pc, xa, xb, top, roofH, t, col, r) {
  const span = xb - xa, bw = Math.min(span - 2, Math.round(span * (0.55 + r() * 0.3))), legs = Math.max(2, Math.round(0.6 * t));
  const bh = Math.min(roofH - legs - 1, Math.max(7, Math.round(bw * 0.38)));
  if (bh < 7 || bw < 9) return false;
  const bx = xa + ((span - bw) >> 1), by = top - legs - bh;
  for (const lx of [bx + 1, bx + (bw >> 1), bx + bw - 2]) for (let k = 0; k < legs; k++) pc.put(lx, top - 1 - k, METAL, { h: 3 });
  for (let x = bx + 1; x < bx + bw - 1; x++) pc.put(x, top - legs, METAL_HI, { h: 3 });
  sign(pc, bx, by, bw, bh, col, r);
  return true;
}

function rooftop(pc, y0, xa, xb, roofH, r, t) {
  if (roofH < 3) return;
  let x = xa + Math.round(r() * 3);
  while (x < xb - 2) {
    const p = r();
    if (p < 0.22 && t > 3) {                    // water tank on legs
      const tw = Math.max(3, Math.round(1.4 * t)), th = Math.max(3, Math.round(1.3 * t)), legs = Math.max(1, Math.round(0.5 * t));
      if (legs + th + 2 > roofH) { x += 2; continue; }
      const top = y0 - legs - th;
      pc.rect(x, top, x + tw, y0 - legs, (xx, yy) => ((yy - top) % 2 === 0 ? hex(0x3a3330) : hex(0x463d37)), { h: 3, r: 0.8 });
      pc.poly([[x - 1, top], [x + tw / 2, top - Math.max(2, tw * 0.35)], [x + tw + 1, top]], hex(0x2e2a28), { h: 3.5 });
      for (let k = 0; k < legs; k++) { pc.put(x, y0 - 1 - k, METAL); pc.put(x + tw - 1, y0 - 1 - k, METAL); }
      x += tw + 2;
    } else if (p < 0.42) {                      // antenna mast with crossbars, sometimes a red light
      const ah = Math.min(roofH - 1, Math.max(3, Math.round((1.5 + r() * 2.5) * t)));
      for (let k = 0; k < ah; k++) pc.put(x, y0 - 1 - k, METAL_HI, { h: 3 });
      for (let k = 2; k < ah; k += Math.max(2, Math.round(t * 0.5))) { pc.put(x - 1, y0 - 1 - k, METAL); pc.put(x + 1, y0 - 1 - k, METAL); }
      if (r() < 0.4) pc.put(x, y0 - ah, [255, 60, 40], { e: [255, 40, 20], h: 3 });
      x += 3;
    } else if (p < 0.55 && t > 4) {             // dish
      pc.capsule(x + 2, y0 - 3, x + 2, y0 - 3, 1.6, 1.6, hex(0x8a908e), { z: 2, r: 0.4 });
      pc.put(x + 2, y0 - 1, METAL);
      x += 5;
    } else if (p < 0.7) {                       // vent box or stair housing
      const vw = Math.max(2, Math.round((p < 0.6 ? 0.9 : 1.8) * t)), vh = Math.min(roofH - 1, Math.max(1, Math.round((p < 0.6 ? 0.6 : 1.6) * t)));
      pc.rect(x, y0 - vh, x + vw, y0, hex(0x3b4143), { h: 2, r: 0.6 });
      if (p >= 0.6 && t > 6) pc.put(x + 1, y0 - vh + 1, [255, 200, 140], { e: [255, 180, 110] });
      x += vw + 1;
    } else x += Math.max(2, Math.round(t));
  }
}

// ---- signs and ground floors ------------------------------------------------------------

// Pictogram shapes for signs, on a 5 x 5 grid: no letter-like patterns.
const ICONS = [
  ['.###.', '#...#', '#####', '.#.#.', '..#..'],   // bowl with steam
  ['..#..', '.###.', '#####', '..#..', '..#..'],   // arrow up
  ['.#.#.', '#####', '.#.#.', '#####', '.#.#.'],   // grid
  ['..#..', '..#..', '#####', '..#..', '..#..'],   // cross
  ['.###.', '#...#', '#.#.#', '#...#', '.###.'],   // eye
  ['##.##', '#...#', '.....', '#...#', '##.##'],   // brackets
];
export function sign(pc, x0, y0, w, h, c, r) {
  // neon frame tube with a pictogram in the middle, everything else dark
  pc.rect(x0, y0, x0 + w, y0 + h, hex(0x0f1214), { h: 2, r: 0.4 });
  const tube = (x, y) => pc.put(x, y, c, { h: 3, e: c, r: 0.3 });
  for (let x = x0; x < x0 + w; x++) { tube(x, y0); tube(x, y0 + h - 1); }
  for (let y = y0; y < y0 + h; y++) { tube(x0, y); tube(x0 + w - 1, y); }
  if (h >= 7 && w >= 7) {
    const icon = ICONS[Math.floor(r() * ICONS.length)], s = Math.max(1, Math.floor(Math.min(w - 2, h - 2) / 5));
    const ix = x0 + Math.floor((w - 5 * s) / 2), iy = y0 + Math.floor((h - 5 * s) / 2);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (icon[j][i] === '#') for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) tube(ix + i * s + a, iy + j * s + b);
  }
}

function shopfront(pc, y0, W, gh, r, t, wall) {
  const unitW = Math.max(6, Math.round((3 + r() * 2) * t));
  for (let ux = 1; ux + 3 < W; ux += unitW) {
    const x1 = Math.min(W - 1, ux + unitW - 2), top = y0 + Math.round(gh * 0.3), bot = y0 + gh - 1;
    const shut = r() < 0.6, c = pickMood(r);
    if (r() < 0.6) {
      const sc = [hex(0x2fe6d2), hex(0xff3d7f), hex(0xffb347), [255, 230, 190]][Math.floor(r() * 4)];
      const sh = Math.max(3, Math.round(gh * 0.2)), sw = Math.min(x1 - ux - 2, Math.max(sh, Math.round(sh * (1 + r() * 1.5))));
      sign(pc, ux + 1 + Math.floor(r() * Math.max(1, x1 - ux - 2 - sw)), y0 + Math.round(gh * 0.04), sw, sh, sc, r);
    }
    if (shut) {                                 // corrugated shutter, part raised, a slit of light under it
      const raise = top + Math.round((bot - top) * (0.7 + r() * 0.28));
      pc.rect(ux, top, x1, bot, (x, y) => (y < raise ? ((y - top) % 3 === 0 ? hex(0x15191b) : (y - top) % 3 === 1 ? hex(0x353b3d) : hex(0x272c2e)) : scale(c, 0.45)), (x, y) => ({ h: y < raise ? ((y - top) % 3 === 1 ? 1.6 : 0.4) : -1, r: 0.45, e: y >= raise ? scale(c, 0.35) : null }));
      if (t > 6) for (let i = 0; i < 3; i++) { const gx = ux + Math.floor(r() * (x1 - ux)), gy = top + Math.floor(r() * (raise - top)); const gc = [hex(0x8a3a5a), hex(0x3a7a7a), hex(0xb8b090)][i]; for (let k = 0; k < 3; k++) pc.put(gx + k, gy + (k & 1), gc, { h: 1.2 }); }
    } else {                                     // lit interior: shelves of goods, a counter, sometimes a person
      const shelfH = Math.max(3, Math.round(gh * 0.18)), person = r() < 0.5, px = ux + 2 + Math.floor(r() * Math.max(1, x1 - ux - 4));
      const goodsAt = (x, y) => (y - top) % shelfH !== 0 && (y - top) % shelfH >= shelfH - 2 && hash2(x, y, 21) > 0.3;
      pc.rect(ux, top, x1, bot, (x, y) => {
        const v = (y - top) / Math.max(1, bot - top);
        if (person && Math.abs(x - px) <= 1 && v > 0.35) return [22, 18, 20];
        if ((y - top) % shelfH === 0) return scale(c, 0.25);
        if (goodsAt(x, y)) return [hex(0xb04a3a), hex(0x3a7a9a), hex(0xd8c070), hex(0x7a9a5a)][Math.floor(hash2(x, y, 22) * 4)];
        return scale(c, 0.34 - v * 0.18);
      }, (x, y) => {
        const v = (y - top) / Math.max(1, bot - top);
        if (person && Math.abs(x - px) <= 1 && v > 0.35) return { h: -1, r: 0.6 };
        return { h: -1.4, r: 0.2, e: (y - top) % shelfH === 0 || goodsAt(x, y) ? scale(c, 0.12) : scale(c, 0.28 - v * 0.16) };
      });
      // a striped awning over some lit shops
      if (r() < 0.45 && t > 6) {
        const ac = pick([[120, 40, 44], [40, 90, 96], [150, 120, 60]], r), ah = Math.max(2, Math.round(0.5 * t));
        for (let x = ux - 1; x <= x1; x++) for (let k = 0; k < ah; k++) pc.put(x, top - 1 + k, ((x - ux) >> 1) % 2 ? scale(ac, 0.55) : ac, { h: 4 - k * 0.5, r: 0.8 });
        continue;
      }
    }
    pc.rect(ux - 1, top - 1, x1 + 1, top, scale(wall, 1.5), { h: 2, r: 0.5 });
  }
}

/** Warehouse ground floor: wide roller doors, each with a caged lamp above. */
function loadingBay(pc, y0, W, gh, r, t, wall) {
  const dw = Math.max(5, Math.round(3.2 * t)), lamp = [255, 196, 130];
  for (let x = Math.round(t); x + dw < W - 1; x += dw + Math.max(3, Math.round(2.5 * t))) {
    const top = y0 + Math.round(gh * 0.25), bot = y0 + gh;
    pc.rect(x - 1, top - 1, x + dw + 1, bot, scale(wall, 0.5), { h: -0.5, r: 0.8 });
    pc.rect(x, top, x + dw, bot, (xx, yy) => ((yy - top) % 2 ? hex(0x2b3133) : hex(0x3e4547)), (xx, yy) => ({ h: (yy - top) % 2 ? 0.3 : 1.4, r: 0.5 }));
    if (r() < 0.7) {
      const lx = x + (dw >> 1);
      pc.put(lx, top - 2, lamp, { e: lamp, h: 2 });
      for (let k = 0; k < Math.min(gh * 0.5, 6); k++) { const yy = top + k; pc.put(lx - 1, yy, mix(hex(0x3e4547), lamp, 0.25 - k * 0.04), { e: scale(lamp, 0.1) }); pc.put(lx + 1, yy, mix(hex(0x3e4547), lamp, 0.25 - k * 0.04), { e: scale(lamp, 0.1) }); }
    }
  }
}

function bladeSign(pc, sx, sy0, len, t, c, r) {
  const sw = Math.max(5, Math.round(0.75 * t));
  sign(pc, sx, sy0, sw, len, c, r);
  // extra pictograms down a tall blade
  if (sw >= 7) for (let y = sy0 + sw; y + sw < sy0 + len; y += sw + 1) sign(pc, sx + 1, y, sw - 2, sw - 2, c, r);
}

/**
 * Mix a painted canvas toward the haze colour, emission dimmed less than albedo, and give
 * every opaque texel a little self-light from the haze (lift), the city's own glow bouncing
 * in the wet air. Without it no scene light reaches far bands and their walls go black.
 */
export function hazeCanvas(pc, haze, hz, lift = 0, dim = 0.55) {
  const n = pc.w * pc.h;
  for (let i = 0; i < n; i++) {
    if (!pc.alpha[i]) continue;
    for (let k = 0; k < 3; k++) {
      pc.color[i * 3 + k] += (hz[k] - pc.color[i * 3 + k]) * haze;
      pc.emit[i * 3 + k] = pc.emit[i * 3 + k] * Math.max(0, 1 - haze * dim) + hz[k] * lift;
    }
  }
}

export const cardMat = (pc, o) => { const m = pixelMaterial(pc.textures(), { emissiveIntensity: o.emissiveIntensity ?? 2.0 }); m.fog = false; return m; };

/** Cables sagging across a band, some strung with bulbs. One transparent flat per band. */
function cables(width, height, z, t, seed, haze, hz) {
  const W = Math.round(width * t), H = Math.round(height * t), r = rng(seed);
  const pc = new PixelCanvas(W, H);
  const n = Math.round(width / 9);
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, span = (6 + r() * 14) * t, yA = H * (0.15 + r() * 0.5), yB = yA + (r() - 0.5) * H * 0.15, sag = (0.6 + r() * 1.6) * t;
    const bulbs = r() < 0.3, bc = [[255, 196, 120], [255, 120, 160], [140, 230, 255]][Math.floor(r() * 3)];
    for (let s = 0; s <= span; s++) {
      const u = s / span, x = x0 + s, y = yA + (yB - yA) * u + sag * 4 * u * (1 - u);
      pc.put(x, y, [16, 20, 22], { h: 1, r: 0.5 });
      if (bulbs && s % Math.max(3, Math.round(t * 0.9)) === 0) pc.put(x, y + 1, bc, { e: bc, h: 1.5 });
    }
  }
  hazeCanvas(pc, haze, hz, 0);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), cardMat(pc, { emissiveIntensity: 2.4 }));
}

/** A soft haze sheet in front of a band: brightest near the ground, gone by mid height. */
function hazeCard(width, height, color, strength) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { color: { value: new THREE.Color(color) }, strength: { value: strength } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 color; uniform float strength; varying vec2 vUv;
      void main(){ float a = pow(1.0 - vUv.y, 2.2) * strength; gl_FragColor = vec4(color, a); }`,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}

// Self-light from the haze per unit of haze. REPLACED lifts the far band's mean luma to about 1.7x
// the play plane's at half its edge contrast (research/depth-light.md). LIFT 1.1 gives 1.6x;
// DIM dims lit windows and signs by haze, since they carry most of a band's edges.
const LIFT = 1.1, DIM = 1.25;

export const BANDS = [
  // z, height range, width range, haze, gap between buildings, roof room, sign odds
  { z: -150, h: [40, 110], w: [10, 22], haze: 0.76, gap: 1, roof: 6, signs: 0.0, cables: false },
  { z: -90, h: [28, 70], w: [9, 18], haze: 0.66, gap: 2, roof: 5, signs: 0.15, cables: false },
  { z: -52, h: [16, 40], w: [8, 15], haze: 0.56, gap: 1.5, roof: 4, signs: 0.3, cables: true },
  { z: -30, h: [10, 24], w: [7, 13], haze: 0.48, gap: 1.6, roof: 3.5, signs: 0.35, cables: true },
  { z: -20, h: [6, 14], w: [5, 10], haze: 0.4, gap: 3.5, roof: 2.5, signs: 0.4, cables: true, shop: true },
];

/**
 * Builds every band into group. hazeColor matches the scene fog colour. Returns the group,
 * so callers can hide it or swap it for painted layers. The same seed builds the same city.
 */
export function buildCity(group, { seed = 77, hazeColor = 0x31505a, glowColor = 0x4a6f78, span = [-110, 110] } = {}) {
  const r = rng(seed);
  const hz = hex(hazeColor);
  BANDS.forEach((B, bi) => {
    const t = tpuAt(B.z), far = 1 - bi / (BANDS.length - 1);
    const xStart = span[0] * (1 + -B.z / 120), xEnd = span[1] * (1 + -B.z / 120);   // farther bands cover more width
    const wMid = (B.w[0] + B.w[1]) / 2;
    let x = xStart;
    while (x < xEnd) {
      const district = noise2(x / 38, bi * 13.7, seed);                // 0 industrial .. 1 downtown
      const skyline = 0.72 + 0.56 * noise2(x / 21, bi * 5.1 + 3, seed + 1);
      const type = pickType(r, district, far), T = TYPES[type];
      const w = wMid * lerp(T.w, r());
      const h = Math.max(B.h[0] * 0.5, (B.h[0] + (B.h[1] - B.h[0]) * lerp(T.h, r())) * skyline);
      const roof = B.roof * (type === 'tower' ? 1.8 : 1);
      const kind = pick(T.kinds, r);
      const sign = r() < B.signs * (T.signs ?? 1) ? { x: 0.1 + r() * 0.75, color: pick(NEON, r) } : null;
      const billboard = (type === 'office' || type === 'block' || type === 'tower') && bi >= 1 && bi <= 3 && r() < 0.3 ? pick(NEON, r) : null;
      const litShare = Math.min(0.9, lerp(T.lit, r()) * (0.5 + r()));
      const shop = B.shop ? type !== 'warehouse' : r() < T.shop * 0.4;
      const pc = paintBuilding({ type, w, h, roof, seed: Math.floor(r() * 1e9), kind, t, shop, sign, billboard, litShare });
      hazeCanvas(pc, B.haze, hz, B.haze * LIFT, DIM);
      pc.bevelAlpha(1.5, 1.5);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h + roof), cardMat(pc, {}));
      mesh.position.set(x + w / 2, (h + roof) / 2, B.z - r() * 2.5);
      mesh.userData.band = true;
      mesh.userData.building = type;
      group.add(mesh);
      x += w + r() * B.gap;
    }
    if (B.cables) {
      const c = cables(xEnd - xStart, B.h[1] * 0.9, B.z, t, Math.floor(r() * 1e9), B.haze, hz);
      c.position.set((xEnd + xStart) / 2, B.h[0] * 0.5 + B.h[1] * 0.45, B.z + 1.5);
      c.userData.band = true;
      group.add(c);
    }
    // glowing haze in front of the band, so its base dissolves and the next band stands out
    const card = hazeCard((xEnd - xStart) * 1.2, B.h[1] * 1.3, glowColor, (0.85 - B.haze * 0.35) * 0.5);
    card.position.set(0, B.h[1] * 0.65 - 1, B.z + 3);
    card.renderOrder = 1; card.userData.band = true;
    group.add(card);
  });
  return group;
}
