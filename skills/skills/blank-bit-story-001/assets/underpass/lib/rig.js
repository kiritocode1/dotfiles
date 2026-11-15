// Character rigs drawn from capsules into PixelCanvas frames, baked once into an atlas.
// A pose is a set of joint angles; draw order and depth come from near/far limbs, so the
// far arm sits behind the torso and the near arm in front, each with exact normals.
import * as THREE from 'three';
import { PixelCanvas, pixelMaterial, hex, mix } from './pixel.js';

export const FRAME_W = 48, FRAME_H = 56, FOOT_Y = 53;   // texels; feet rest on canvas row 53

// Limb end from a start point, angle in radians from straight down, positive swings forward.
const limb = (x, y, a, len) => [x + Math.sin(a) * len, y + Math.cos(a) * len];

// Darken texels on the silhouette edge (selective outline). Keeps the figure readable
// against busy backgrounds without a hard black line.
function selout(pc, k = 0.72) {
  const { w, h, alpha, color } = pc;
  const edge = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!alpha[i]) continue;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !alpha[i - 1] || !alpha[i + 1] || !alpha[i - w] || !alpha[i + w]) edge.push(i);
  }
  for (const i of edge) { color[i * 3] *= k; color[i * 3 + 1] *= k; color[i * 3 + 2] *= k * 1.05; }
}

// Fold shading baked into albedo: undersides of parts lose a little light, as hand-painted
// pixel art does, so form survives when the scene light is flat.
const fold = (c, ny, amt = 0.16) => (ny < -0.35 ? mix(c, [c[0] * 0.62, c[1] * 0.6, c[2] * 0.72], amt / 0.16 * Math.min(1, -ny)) : c);

/**
 * Courier: hooded waxed jacket, backpack with a status light, scarf tail. Faces +x.
 * pose = { lean, bob, hipX, thigh:[near,far], knee:[near,far], arm:[near,far], elbow:[near,far], scarf, breath }
 */
export function drawCourier(pc, pose, ox = 0) {
  const P = {
    lean: 0, bob: 0, hipX: 0, thigh: [0, 0], knee: [0, 0], arm: [0.05, -0.05], elbow: [0.25, 0.25],
    scarf: 0, breath: 0, fist: [false, false], ...pose,
  };
  const JACKET = hex(0x8a7448), JACKET_D = hex(0x5e4f34), TROUSER = hex(0x34363e), BOOT = hex(0x2a2522);
  const SKIN = hex(0xb07f62), PACK = hex(0x464b52), SCARF = hex(0x9c3a30), TAPE = hex(0xd8d4c4), GLOVE = hex(0x2c2c30);
  const cx = 24 + ox + P.hipX;
  const hipY = FOOT_Y - 21 + P.bob;
  const lean = P.lean;
  const chest = [cx + Math.sin(lean) * 11, hipY - Math.cos(lean) * 11 - P.breath];
  const neck = [cx + Math.sin(lean) * 14.5, hipY - Math.cos(lean) * 14.5 - P.breath];
  const head = [neck[0] + 0.6, neck[1] - 4.2];

  const leg = (side) => {
    const z = side === 0 ? 4 : -6, shade = side === 0 ? 1 : 0.7;
    const hx = cx + (side === 0 ? 1 : -1);
    const knee = limb(hx, hipY + 1, P.thigh[side], 10);
    const ankle = limb(knee[0], knee[1], P.thigh[side] - P.knee[side], 10.5);
    const tc = (x, y, nx, ny) => fold(mix([0, 0, 0], TROUSER, shade), ny);
    pc.capsule(hx, hipY + 1, knee[0], knee[1], 3.1, 2.6, tc, { z });
    pc.capsule(knee[0], knee[1], ankle[0], ankle[1], 2.6, 2.2, tc, { z });
    const toe = [ankle[0] + 3.2, Math.min(ankle[1] + 1.2, FOOT_Y + 0.5)];
    pc.capsule(ankle[0] - 0.5, ankle[1] + 0.2, toe[0], toe[1], 2.0, 1.6, mix([0, 0, 0], BOOT, shade), { z: z + 1, r: 0.5 });
  };

  const arm = (side) => {
    const z = side === 0 ? 8 : -8, shade = side === 0 ? 1 : 0.68;
    const sh = [chest[0] + (side === 0 ? 1.2 : -1.6), chest[1] - 1.5];
    const elbow = limb(sh[0], sh[1], P.arm[side], 7.5);
    const wrist = limb(elbow[0], elbow[1], P.arm[side] + P.elbow[side], 7);
    const jc = (x, y, nx, ny) => fold(mix([0, 0, 0], JACKET, shade), ny);
    pc.capsule(sh[0], sh[1], elbow[0], elbow[1], 2.8, 2.4, jc, { z });
    pc.capsule(elbow[0], elbow[1], wrist[0], wrist[1], 2.4, 2.1, (x, y, nx, ny) => {
      // reflective cuff tape: one texel band near the wrist catches every light in the room
      const t = Math.hypot(x + 0.5 - wrist[0], y + 0.5 - wrist[1]);
      return t > 1.6 && t < 2.8 ? mix([0, 0, 0], TAPE, shade) : jc(x, y, nx, ny);
    }, { z, r: 0.6 });
    pc.disc(wrist[0] + Math.sin(P.arm[side] + P.elbow[side]) * 1.4, wrist[1] + Math.cos(P.arm[side] + P.elbow[side]) * 1.4,
      P.fist[side] ? 2.0 : 1.7, mix([0, 0, 0], GLOVE, shade), { z: z + 1 });
  };

  // far side first: depth test keeps near parts in front regardless of order, but order
  // still matters for equal depths at joints.
  arm(1); leg(1);

  // backpack, behind the torso
  const packTop = [chest[0] - 5.2, chest[1] + 0.5], packBot = [cx - 5.6, hipY - 3];
  pc.capsule(packTop[0], packTop[1], packBot[0], packBot[1], 3.6, 3.4, (x, y, nx, ny) => fold(PACK, ny), { z: -3, r: 0.7 });
  pc.put(Math.round(packTop[0] - 1), Math.round(packTop[1] + 3), hex(0x9ff7e4), { z: 6, e: [14, 60, 50], n: [0, 0, 1] });

  // torso and jacket hem
  pc.capsule(cx, hipY - 1, chest[0], chest[1], 5.4, 6.0, (x, y, nx, ny) => {
    const zipper = Math.abs(x + 0.5 - (cx + 3.6 + (chest[0] - cx) * ((hipY - y) / 11))) < 0.5 && nx > 0.4;
    return zipper ? JACKET_D : fold(JACKET, ny);
  }, { z: 0 });
  pc.poly([[cx - 5, hipY - 2], [cx + 5.4, hipY - 2], [cx + 6, hipY + 4], [cx - 5.6, hipY + 4.4]], (x, y) => (y > hipY + 3 ? JACKET_D : JACKET), { z: 1.5, h: 1 });

  leg(0);

  // scarf tail streams behind the neck; P.scarf is a phase for its wave
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x = neck[0] - 2 - i * 1.25, y = neck[1] + 1 + i * 0.35 + Math.sin(P.scarf + i * 0.9) * (0.4 + t * 1.3);
    pc.disc(x, y, 1.5 - t * 0.5, SCARF, { z: -1 + (i < 2 ? 6 : 0) });
  }
  pc.capsule(neck[0] - 2.5, neck[1] + 0.5, neck[0] + 2.5, neck[1] + 0.8, 2.2, 2.2, SCARF, { z: 3 });

  // head: hood shell, then the face only where it turns toward the viewer and forward
  pc.disc(head[0] - 0.8, head[1] - 0.5, 4.6, (x, y, nx, ny) => fold(JACKET, ny, 0.1), { z: -1 });
  pc.disc(head[0] + 0.7, head[1] + 0.4, 3.3, (x, y, nx, ny) => (nx > 0.15 && ny < 0.55 ? SKIN : null), { z: 5 });
  // goggle band: a dark strip with a faint cyan lens glint
  pc.put(Math.round(head[0] + 3), Math.round(head[1] - 0.6), hex(0x1c2a2e), { z: 9, e: [10, 60, 64], n: [0.6, 0, 0.8] });
  pc.put(Math.round(head[0] + 2), Math.round(head[1] - 0.6), hex(0x1c2a2e), { z: 9, n: [0.3, 0, 0.95] });
  // hood rim, overhanging the brow
  pc.capsule(head[0] - 1.5, head[1] - 4, head[0] + 3.4, head[1] - 2.2, 1.3, 1.1, (x, y, nx, ny) => fold(JACKET_D, ny), { z: 7 });

  arm(0);
}

/** Vendor: apron, cap, broad shoulders; used behind counters. Faces +x. */
export function drawVendor(pc, pose, ox = 0) {
  const P = { lean: 0.08, breath: 0, arm: [0.5, 0.3], elbow: [1.2, 1.0], headTurn: 0, ...pose };
  const SHIRT = hex(0x5d6a72), APRON = hex(0xc9c2ae), SKIN = hex(0xa47258), CAP = hex(0x2d3a40);
  const cx = 24 + ox, hipY = FOOT_Y - 21;
  const chest = [cx + Math.sin(P.lean) * 11, hipY - 11 - P.breath];
  const head = [chest[0] + 1.2, chest[1] - 7.6];
  const arm = (side) => {
    const z = side === 0 ? 8 : -8, s = side === 0 ? 1 : 0.68;
    const sh = [chest[0] + (side ? -2 : 1.5), chest[1] - 1.5];
    const el = limb(sh[0], sh[1], P.arm[side], 7.5), wr = limb(el[0], el[1], P.arm[side] + P.elbow[side], 7);
    pc.capsule(sh[0], sh[1], el[0], el[1], 3.0, 2.6, (x, y, nx, ny) => fold(mix([0, 0, 0], SHIRT, s), ny), { z });
    pc.capsule(el[0], el[1], wr[0], wr[1], 2.4, 2.1, mix([0, 0, 0], SKIN, s), { z });
  };
  arm(1);
  pc.capsule(cx, hipY + 6, cx, hipY + 20, 4.2, 3.6, TROUSERISH, { z: -2 });
  pc.capsule(cx, hipY - 1, chest[0], chest[1], 6.2, 6.8, (x, y, nx, ny) => (nx > -0.2 && y > chest[1] + 1 ? fold(APRON, ny) : fold(SHIRT, ny)), { z: 0 });
  pc.disc(head[0], head[1], 3.6, SKIN, { z: 2 });
  pc.capsule(head[0] - 3, head[1] - 2.2, head[0] + 4.6, head[1] - 2.6, 1.8, 1.2, CAP, { z: 6 });
  arm(0);
}
const TROUSERISH = hex(0x2e3036);

/**
 * Bake a set of named clips into one atlas. clips = { name: { frames, fps, pose: (i, n) => pose } }.
 * Returns textures plus a lookup from clip name to [first frame, count, fps].
 */
export function bakeAtlas(draw, clips) {
  const names = Object.keys(clips);
  const total = names.reduce((s, k) => s + clips[k].frames, 0);
  const atlas = new PixelCanvas(FRAME_W * total, FRAME_H);
  const index = {};
  let f = 0;
  for (const k of names) {
    const c = clips[k];
    index[k] = { start: f, count: c.frames, fps: c.fps, loop: c.loop !== false };
    for (let i = 0; i < c.frames; i++, f++) {
      const pc = new PixelCanvas(FRAME_W, FRAME_H);
      draw(pc, c.pose(i, c.frames));
      selout(pc);
      copyInto(atlas, pc, f * FRAME_W);
    }
  }
  return { tex: atlas.textures(), index, total };
}

function copyInto(dst, src, ox) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const s = y * src.w + x, d = y * dst.w + x + ox;
    if (!src.alpha[s]) continue;
    dst.alpha[d] = 255; dst.depth[d] = src.depth[s]; dst.height[d] = src.height[s]; dst.rough[d] = src.rough[s];
    for (let k = 0; k < 3; k++) {
      dst.color[d * 3 + k] = src.color[s * 3 + k]; dst.nrm[d * 3 + k] = src.nrm[s * 3 + k]; dst.emit[d * 3 + k] = src.emit[s * 3 + k];
    }
  }
}

/** A world-space actor: one quad, feet at its origin, playing clips from a baked atlas. */
export class Actor {
  constructor(baked, tpu, o = {}) {
    this.baked = baked; this.index = baked.index;
    const t = baked.tex;
    // each actor owns texture views so frame offsets do not leak between actors
    const view = (src) => { if (!src) return null; const c = src.clone(); c.repeat.set(1 / baked.total, 1); c.needsUpdate = true; return c; };
    this.tex = { map: view(t.map), normalMap: view(t.normalMap), roughnessMap: view(t.roughnessMap), emissiveMap: view(t.emissiveMap) };
    this.material = pixelMaterial(this.tex, { emissiveIntensity: o.emissiveIntensity ?? 3 });
    const w = FRAME_W / tpu, h = FRAME_H / tpu;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, h / 2 - (FRAME_H - FOOT_Y - 1) / tpu, 0);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.castShadow = true;
    this.clip = null; this.t = 0; this.frame = 0; this.facing = 1;
  }
  play(name, restart = false) {
    if (this.clip === name && !restart) return;
    this.clip = name; this.t = 0;
  }
  update(dt) {
    const c = this.index[this.clip];
    this.t += dt;
    let i = Math.floor(this.t * c.fps);
    i = c.loop ? i % c.count : Math.min(i, c.count - 1);
    this.frame = c.start + i;
    this.done = !c.loop && this.t * c.fps >= c.count;
    const off = this.frame / this.baked.total;
    for (const k in this.tex) if (this.tex[k]) this.tex[k].offset.x = off;
    this.mesh.scale.x = this.facing;
  }
}
