// World building: flats and blocks textured with pixel art at a constant on-screen texel
// size. A surface at depth z gets tpuAt(z) texels per world unit, so a far tower and the
// hero's sleeve show pixels of the same size on screen.
import * as THREE from 'three';
import { PixelCanvas, pixelMaterial, hex, mix, clamp, noise2, hash2, rng } from './pixel.js';
import { buildCity } from './city.js';

export const TPU = 24;       // texels per world unit on the gameplay plane (z = 0)
export const CAM_DIST = 22;  // camera distance to the gameplay plane

export const tpuAt = (z) => (TPU * CAM_DIST) / Math.max(4, CAM_DIST - z);

const jitter = (c, k) => [c[0] + k, c[1] + k, c[2] + k];

/** A flat quad of w x h world units whose texture is painted by paint(pc, W, H, t). */
export function flat(w, h, z, paint, o = {}) {
  const t = tpuAt(z) * (o.density ?? 1);
  const W = Math.max(2, Math.round(w * t)), H = Math.max(2, Math.round(h * t));
  const pc = new PixelCanvas(W, H);
  paint(pc, W, H, t);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), pixelMaterial(pc.textures(), o));
  mesh.receiveShadow = o.receiveShadow ?? true;
  mesh.castShadow = o.castShadow ?? false;
  return mesh;
}

/**
 * A box with painted faces. faces = { front, side, bottom, top }, each paint(pc, W, H, t, face).
 * The back face is never seen and gets a flat dark material.
 */
export function block(w, h, d, z, faces, o = {}) {
  const t = tpuAt(z) * (o.density ?? 1);
  const make = (fw, fh, p, face) => {
    if (!p) return new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 1 });
    const W = Math.max(2, Math.round(fw * t)), H = Math.max(2, Math.round(fh * t));
    const pc = new PixelCanvas(W, H);
    p(pc, W, H, t, face);
    return pixelMaterial(pc.textures(), o);
  };
  const side = faces.side ?? faces.front;
  const mats = [
    make(d, h, side, 'right'), make(d, h, side, 'left'),
    make(w, d, faces.top ?? faces.bottom ?? side, 'top'), make(w, d, faces.bottom ?? side, 'bottom'),
    make(w, h, faces.front, 'front'), make(w, h, null, 'back'),
  ];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  mesh.receiveShadow = true; mesh.castShadow = o.castShadow ?? true;
  return mesh;
}

// ---------------------------------------------------------------- painters

/** Poured concrete: low-frequency stains, rain streaks from the top, form-panel seams, bevelled edges. */
export const concrete = (o = {}) => (pc, W, H, t) => {
  const base = hex(o.base ?? 0x4a4d50), seed = o.seed ?? 1;
  const seamY = Math.round((o.seam ?? 1.2) * t);
  const streaks = new Float32Array(W);
  for (let x = 0; x < W; x++) streaks[x] = hash2(x >> 1, 7, seed) < 0.18 ? 0.4 + hash2(x, 9, seed) * 0.8 : 0;
  pc.rect(0, 0, W, H, (x, y) => {
    const n = noise2(x / (t * 0.9), y / (t * 0.9), seed) - 0.5;
    const fine = hash2(x, y, seed) - 0.5;
    const streak = streaks[x] * Math.max(0, 1 - y / (H * (0.35 + streaks[x] * 0.4)));
    const wick = y > H - t * 0.35 ? 0.75 : 1;            // damp band where water wicks up
    const k = (1 + n * 0.28 + fine * 0.07 - streak * 0.25) * wick;
    return [base[0] * k, base[1] * k, base[2] * k * 1.02];
  }, (x, y) => ({
    h: (seamY && y % seamY === 0 ? -1.4 : 0) + (noise2(x / 3, y / 3, seed + 3) - 0.5) * 0.5,
    r: y > H - t * 0.35 ? 0.45 : 0.9,
  }));
  pc.bevelAlpha(o.bevel ?? 2, 2.2);
};

/** Riveted steel plate with flanges, stiffeners and rust runs. */
export const girder = (o = {}) => (pc, W, H, t) => {
  const base = hex(o.base ?? 0x34403f), rust = hex(0x6a3b22), seed = o.seed ?? 2;
  const flange = Math.max(2, Math.round(0.16 * t)), stiff = Math.round(1.6 * t), rivet = Math.max(3, Math.round(0.22 * t));
  const runs = new Float32Array(W);
  for (let x = 0; x < W; x++) runs[x] = hash2(x, 1, seed) < 0.06 ? hash2(x, 2, seed) : 0;
  pc.rect(0, 0, W, H, (x, y) => {
    const n = noise2(x / (t * 1.4), y / (t * 0.7), seed) - 0.5;
    const r = runs[x] > 0 ? Math.max(0, 1 - (y - flange) / (H * runs[x])) : 0;
    const k = 1 + n * 0.22 + (hash2(x, y, seed) - 0.5) * 0.06;
    return mix([base[0] * k, base[1] * k, base[2] * k], rust, Math.min(0.75, r * 0.9 + (n > 0.32 ? 0.3 : 0)));
  }, (x, y) => {
    const inFlange = y < flange || y >= H - flange;
    const inStiff = stiff > 0 && x % stiff < Math.max(2, Math.round(0.12 * t));
    const onRivet = (y === Math.floor(flange * 1.6) || y === H - 1 - Math.floor(flange * 1.6)) && x % rivet === 0;
    return { h: inFlange ? 2.2 : inStiff ? 1.6 : onRivet ? 1.2 : 0, r: 0.55 };
  });
};

/** Underside of a deck: cross beams, a pipe run, drip stains. */
export const deckUnder = (o = {}) => (pc, W, H, t) => {
  const base = hex(0x262b2d), seed = o.seed ?? 5, beam = Math.round(0.9 * t);
  pc.rect(0, 0, W, H, (x, y) => {
    const k = 1 + (noise2(x / t, y / t, seed) - 0.5) * 0.3;
    return [base[0] * k, base[1] * k, base[2] * k];
  }, (x) => ({ h: x % beam < Math.round(0.22 * t) ? 2 : 0, r: 0.8 }));
  for (const yy of [0.3, 0.42]) {
    const y = H * yy;
    pc.capsule(0, y, W, y, Math.max(1.2, 0.07 * t), Math.max(1.2, 0.07 * t), hex(0x3b4447), { z: 4, r: 0.5 });
  }
};

/**
 * A building front. Windows are emissive when lit; each lit window gets one of three moods.
 * kind: 'brick' | 'concrete' | 'tile'. o.sign adds a vertical neon blade.
 */
export const facade = (o = {}) => (pc, W, H, t) => {
  const r = rng(o.seed ?? 11);
  const wall = hex({ brick: 0x4e3129, concrete: 0x3f4244, tile: 0x2f3c3e }[o.kind ?? 'concrete']);
  const floorH = 3.0 * t, bayW = (o.bay ?? 1.7) * t;
  const winW = Math.max(2, Math.round(bayW * 0.55)), winH = Math.max(2, Math.round(floorH * 0.45));
  pc.rect(0, 0, W, H, (x, y) => {
    let k = 1 + (noise2(x / (t * 2), y / (t * 2), o.seed ?? 11) - 0.5) * 0.3;
    if (o.kind === 'brick' && t > 9 && ((y % Math.max(2, Math.round(t * 0.08)) === 0) || ((x + ((y / Math.round(t * 0.08)) | 0) * 3) % Math.max(4, Math.round(t * 0.25)) === 0))) k *= 0.8;
    return [wall[0] * k, wall[1] * k, wall[2] * k];
  }, (x, y) => ({ h: y % Math.round(floorH) < Math.max(1, Math.round(0.1 * t)) ? 1.5 : 0, r: 0.85 }));
  const litP = o.lit ?? 0.32;
  for (let fy = Math.round(floorH * 0.35); fy + winH < H - (o.groundFloor ? floorH : 0); fy += Math.round(floorH)) {
    for (let fx = Math.round(bayW * 0.22); fx + winW < W; fx += Math.round(bayW)) {
      const lit = r() < litP, mood = r();
      const col = !lit ? null : mood < 0.62 ? [255, 176, 104] : mood < 0.85 ? [130, 214, 255] : [255, 110, 150];
      const dim = 0.35 + r() * 0.65, blinds = r() < 0.4;
      pc.rect(fx, fy, fx + winW, fy + winH, (x, y) => {
        if (!lit) return [14, 18, 22];
        const b = blinds && (y - fy) % 2 === 0 ? 0.55 : 1;
        return [col[0] * 0.5 * b, col[1] * 0.5 * b, col[2] * 0.5 * b];
      }, (x, y) => {
        if (!lit) return { h: -1.5, r: 0.15 };
        const b = blinds && (y - fy) % 2 === 0 ? 0.45 : 1;
        return { h: -1.5, r: 0.2, e: [col[0] * dim * b, col[1] * dim * b, col[2] * dim * b] };
      });
      if (t > 8 && r() < 0.15) { // air conditioner under the window
        const ay = fy + winH + 1;
        pc.rect(fx + 1, ay, fx + Math.min(winW, Math.round(0.5 * t)), ay + Math.max(2, Math.round(0.35 * t)), hex(0x5a5e5e), { h: 2.5, r: 0.6 });
      }
    }
  }
  if (o.sign) {
    const sx = Math.round(W * o.sign.x), sw = Math.max(3, Math.round(0.55 * t)), sy0 = Math.round(H * 0.2), sy1 = Math.round(H * 0.55);
    const c = hex(o.sign.color);
    pc.rect(sx, sy0, sx + sw, sy1, hex(0x121416), { h: 3, r: 0.4 });
    for (let y = sy0 + 2; y < sy1 - 2; y += Math.max(3, Math.round(sw * 0.9))) {
      for (let x = sx + 1; x < sx + sw - 1; x++) if (hash2(x, y, 3) > 0.25) pc.put(x, y, c, { h: 4, e: c, r: 0.3 });
      for (let k = 1; k < Math.max(2, sw * 0.6); k++) pc.put(sx + 1 + ((y * 7) % Math.max(1, sw - 2)), y + k, c, { h: 4, e: c, r: 0.3 });
    }
  }
  pc.bevelAlpha(1.5, 1.5);
};

/** Wet asphalt with cracks, a faded lane line and a manhole cover. World-locked. */
export const asphalt = (o = {}) => (pc, W, H, t) => {
  const base = hex(0x2b2d2f), seed = o.seed ?? 21;
  pc.rect(0, 0, W, H, (x, y) => {
    const n = noise2(x / (t * 1.8), y / (t * 1.8), seed) - 0.5, f = hash2(x, y, seed) - 0.5;
    const k = 1 + n * 0.35 + f * 0.12;
    return [base[0] * k, base[1] * k, base[2] * k];
  }, (x, y) => ({ h: (hash2(x, y, seed + 1) - 0.5) * 0.8, r: 0.5 + noise2(x / t, y / t, seed + 9) * 0.3 }));
  // cracks: short random walks
  const r = rng(seed);
  for (let c = 0; c < W * H / (t * t * 6); c++) {
    let x = r() * W, y = r() * H, a = r() * 6.28;
    for (let s = 0; s < t * (0.5 + r() * 1.2); s++) {
      pc.put(x, y, hex(0x18191a), { h: -1.6, r: 0.3 });
      a += (r() - 0.5) * 0.9; x += Math.cos(a); y += Math.sin(a) * 0.6;
    }
  }
  if (o.lane !== undefined) {
    const ly = Math.round(o.lane * H), dash = Math.round(3 * t), gap = Math.round(2.4 * t);
    pc.rect(0, ly, W, ly + Math.max(2, Math.round(0.12 * t)), (x, y) => {
      if ((x % (dash + gap)) > dash) return null;
      const wear = noise2(x / 3, y, 4);
      return wear < 0.35 ? null : mix(hex(0x2b2d2f), hex(0x8c8468), 0.75);
    }, { h: 0.4, r: 0.6 });
  }
};

/** Chain-link fence, mostly holes. Meant for the defocused foreground. */
export const chainLink = () => (pc, W, H, t) => {
  const cell = Math.max(4, Math.round(0.14 * t));
  pc.rect(0, 0, W, H, (x, y) => (((x + y) % cell === 0 || (x - y + 9999 * cell) % cell === 0) ? hex(0x1d2022) : null), { h: 1, r: 0.4 });
  pc.rect(0, 0, W, Math.max(2, Math.round(0.08 * t)), hex(0x1a1c1e), { h: 2 });
};

// ---------------------------------------------------------------- scene

/**
 * Builds the underpass: a rail viaduct over a wet street, a noodle stall in one bay, a
 * sodium lamp, background towers in three depth bands and dark foreground occluders.
 * Returns the root group plus the lights and anchors the game loop needs.
 */
export function buildUnderpass(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const add = (m, x, y, z) => { m.position.set(x, y, z); root.add(m); return m; };
  const r = rng(77);

  // sky: a smooth gradient with underlit cloud, never pixelated, never fogged
  {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#05080b'); gr.addColorStop(0.55, '#0e171c'); gr.addColorStop(0.78, '#2a2626'); gr.addColorStop(1, '#3a2c26');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * 256, y = 90 + Math.random() * 120;
      const n = noise2(x / 40, y / 14, 5);
      if (n < 0.55) continue;
      g.fillStyle = `rgba(${90 + y * 0.2},${60 + y * 0.12},${50},${(n - 0.55) * 0.08})`;
      g.fillRect(x, y, 10, 3);
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    add(new THREE.Mesh(new THREE.PlaneGeometry(700, 300), new THREE.MeshBasicMaterial({ map: tex, fog: false, depthWrite: false })), 0, 60, -170).renderOrder = -1;
  }

  // three bands of towers
  const band = (z, n, hMin, hMax, wMin, wMax, lit, signs) => {
    let x = -95;
    while (x < 95) {
      const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin);
      const kind = ['concrete', 'brick', 'tile'][Math.floor(r() * 3)];
      const sign = signs && r() < 0.28 ? { x: 0.1 + r() * 0.7, color: [0xff3d7f, 0x31e3d2, 0xffb347][Math.floor(r() * 3)] } : null;
      const m = flat(w, h, z, facade({ seed: Math.floor(r() * 1e6), kind, lit, sign }), { receiveShadow: false, emissiveIntensity: 2.2 });
      add(m, x + w / 2, h / 2, z - r() * 3).userData.band = true;   // painted layers can replace the bands
      // aviation warning light on the tall ones
      if (h > 70) add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a1a).multiplyScalar(6) })), x + w / 2, h + 0.5, z).userData = { blink: r() * 6, band: true };
      x += w + r() * 4;
    }
  };
  // the city behind the street: five hazed bands from lib/city.js (band() above is the
  // first, sparser version, kept for comparison with ?city=old)
  if (new URLSearchParams(location.search).get('city') === 'old') {
    band(-95, 0, 55, 135, 12, 26, 0.35, false);
    band(-48, 0, 22, 52, 8, 16, 0.3, true);
    band(-18, 0, 7, 17, 5, 9, 0.28, true);
  } else buildCity(root, { seed: Number(new URLSearchParams(location.search).get('seed')) || 77 });

  // floor: world-locked asphalt near, coarser beyond
  const near = flat(90, 30, 0, asphalt({ lane: 0.62 }), { density: 0.66 });
  near.rotation.x = -Math.PI / 2; add(near, 0, 0, 1);
  const far = flat(240, 120, -40, asphalt({ seed: 4 }), { density: 0.6 });
  far.rotation.x = -Math.PI / 2; add(far, 0, -0.01, -74);

  // viaduct: deck, pillars, rail girder face, and a cornice where the train runs
  const DECK_Y = 7.4, DECK_H = 1.5, DECK_Z = -5, DECK_D = 4;
  add(block(110, DECK_H, DECK_D, DECK_Z + DECK_D / 2, { front: girder({}), bottom: deckUnder({}), side: girder({ seed: 3 }) }), 0, DECK_Y + DECK_H / 2, DECK_Z);
  add(block(110, 0.5, DECK_D + 0.5, DECK_Z + DECK_D / 2, { front: concrete({ base: 0x3c3f41, seam: 0, bevel: 1 }) }), 0, DECK_Y + DECK_H + 0.25, DECK_Z);
  for (const px of [-28, -14, 0, 14, 28]) {
    add(block(1.6, DECK_Y, 1.6, DECK_Z + 0.8, { front: concrete({ seed: px + 50 }), side: concrete({ seed: px + 51 }) }), px, DECK_Y / 2, DECK_Z);
    // haunch where pillar meets deck
    add(block(3.2, 0.7, 1.7, DECK_Z + 0.85, { front: concrete({ seed: px + 52, seam: 0 }) }), px, DECK_Y - 0.35, DECK_Z);
  }
  // rail parapet and catenary posts on top
  for (let x = -54; x <= 54; x += 6) add(block(0.14, 2.4, 0.14, DECK_Z, { front: girder({ seed: x }) }), x, DECK_Y + DECK_H + 1.7, DECK_Z + 1.2);

  // noodle stall in the bay between x = 0 and x = 14
  const STALL_X = 7;
  add(flat(12.4, DECK_Y, -6.8, (pc, W, H, t) => {
    // tiled back wall with shelves
    const tile = Math.max(3, Math.round(0.3 * t));
    pc.rect(0, 0, W, H, (x, y) => {
      const g = x % tile === 0 || y % tile === 0;
      const n = 1 + (hash2(Math.floor(x / tile), Math.floor(y / tile), 8) - 0.5) * 0.16;
      return g ? [26, 38, 38] : [52 * n, 86 * n, 84 * n];
    }, (x, y) => ({ h: x % tile === 0 || y % tile === 0 ? -0.8 : 0, r: 0.25 }));
    for (const sy of [0.42, 0.6]) {
      const y = Math.round(H * sy);
      pc.rect(Math.round(W * 0.2), y, Math.round(W * 0.8), y + 2, hex(0x5a4030), { h: 2.5, r: 0.6 });
      for (let x = Math.round(W * 0.22); x < W * 0.78; x += Math.round(0.28 * t + hash2(x, y, 1) * 4)) {
        const c = [hex(0xb8b0a0), hex(0x7a2e2a), hex(0x2f5d6a), hex(0xc49a4a)][Math.floor(hash2(x, y, 2) * 4)];
        const bh = 2 + Math.floor(hash2(x, y, 3) * 4);
        pc.capsule(x, y - bh, x, y - 1, 1.4, 1.6, c, { z: 6, r: 0.3 });
      }
    }
    // warm strip light under the top shelf
    const ly = Math.round(H * 0.36);
    pc.rect(Math.round(W * 0.2), ly, Math.round(W * 0.8), ly + 1, [255, 214, 160], { e: [255, 196, 130], h: 1 });
  }, { emissiveIntensity: 3 }), STALL_X, DECK_Y / 2, -6.8);

  // counter
  add(block(5.6, 1.1, 0.9, -3.9, {
    front: (pc, W, H, t) => {
      const slat = Math.max(3, Math.round(0.18 * t));
      pc.rect(0, 0, W, H, (x, y) => { const k = 1 + (hash2(Math.floor(x / slat), 1, 4) - 0.5) * 0.25 + (noise2(x / 2, y / 9, 4) - 0.5) * 0.15; return [92 * k, 62 * k, 42 * k]; },
        (x) => ({ h: x % slat === 0 ? -1.2 : 0, r: 0.7 }));
      pc.rect(0, 0, W, 2, hex(0x7c8284), { h: 2, r: 0.2 });
      pc.bevelAlpha(1.5, 1.5);
    },
    top: (pc, W, H) => pc.rect(0, 0, W, H, (x, y) => jitter(hex(0x6a7072), hash2(x, y, 9) * 8), { r: 0.15 }),
  }), STALL_X, 0.55, -3.9);
  // bowls and a steaming pot on the counter
  add(flat(5.4, 0.7, -3.9, (pc, W, H, t) => {
    for (const fx of [0.12, 0.3, 0.7]) pc.capsule(W * fx - 4, H - 3, W * fx + 4, H - 3, 2.6, 2.6, (x, y, nx, ny) => (ny > 0.2 ? null : hex(0xd8d2c4)), { z: 3, r: 0.25 });
    pc.capsule(W * 0.5 - 5, H - 6, W * 0.5 + 5, H - 6, 5, 5, (x, y, nx, ny) => hex(0x8a8f90), { z: 4, r: 0.2 });
  }, { castShadow: true }), STALL_X, 1.45, -3.85);

  // awning: striped cloth with a scalloped edge
  const awning = flat(6.4, 1.1, -3.2, (pc, W, H, t) => {
    const stripe = Math.max(4, Math.round(0.42 * t)), sc = stripe;
    pc.rect(0, 0, W, H, (x, y) => {
      const edge = H - 1 - Math.floor(Math.sqrt(Math.max(0, (sc / 2) ** 2 - ((x % sc) - sc / 2) ** 2)) * 0.6);
      if (y > edge) return null;
      const k = 1 + (noise2(x / 6, y / 4, 6) - 0.5) * 0.2;
      return (Math.floor(x / stripe) % 2 ? [112 * k, 36 * k, 34 * k] : [176 * k, 164 * k, 142 * k]);
    }, { r: 0.8 });
    pc.bevelAlpha(2, 2);
  }, { castShadow: true, side: THREE.DoubleSide });
  awning.rotation.x = -0.55; add(awning, STALL_X, 3.3, -3.4);

  // neon sign: a bowl, steam, chopsticks. Tubes are capsules, so they have real normals.
  const SIGN_C = [70, 255, 226], SIGN_P = [255, 80, 150];
  const sign = flat(3.2, 1.3, -3.0, (pc, W, H, t) => {
    pc.rect(0, 0, W, H, hex(0x101315), { h: 0, r: 0.4 });
    pc.bevelAlpha(2, 2);
    const tube = (pts, c) => { for (let i = 0; i + 1 < pts.length; i++) pc.capsule(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1.1, 1.1, mix(c, [255, 255, 255], 0.55), { z: 6, e: c, r: 0.2 }); };
    const cx = W * 0.3, cy = H * 0.6, rr = H * 0.26;
    const bowl = []; for (let a = 0; a <= 16; a++) { const th = Math.PI * a / 16; bowl.push([cx - Math.cos(th) * rr * 1.5, cy + Math.sin(th) * rr]); }
    tube(bowl, SIGN_C); tube([[cx - rr * 1.5, cy], [cx + rr * 1.5, cy]], SIGN_C);
    for (const sx of [-0.6, 0, 0.6]) { const s = []; for (let k = 0; k <= 6; k++) s.push([cx + sx * rr + Math.sin(k * 1.2) * 2, cy - 3 - k * 2.2]); tube(s, SIGN_C); }
    tube([[cx + rr * 0.4, cy - rr * 1.6], [cx + rr * 2.1, cy + rr * 0.4]], SIGN_P);
    tube([[cx + rr * 0.9, cy - rr * 1.7], [cx + rr * 2.4, cy + rr * 0.1]], SIGN_P);
    // three abstract glyph blocks, not text
    for (let g = 0; g < 3; g++) {
      const gx = W * (0.6 + g * 0.12), gy = H * 0.3, gs = H * 0.38;
      tube([[gx, gy], [gx + gs * 0.6, gy]], SIGN_P); tube([[gx + gs * 0.3, gy], [gx + gs * 0.3, gy + gs]], SIGN_P);
      tube([[gx, gy + gs * (0.4 + g * 0.15)], [gx + gs * 0.6, gy + gs * (0.4 + g * 0.15)]], SIGN_P);
    }
  }, { emissiveIntensity: 2.2, castShadow: false });
  add(sign, STALL_X - 0.4, 4.45, -3.1);

  // lamp post with a sodium head
  const LAMP = new THREE.Vector3(-7, 5.0, -1.6);
  add(block(0.16, 5.1, 0.16, -1.6, { front: girder({ seed: 31, base: 0x2b302f }) }), LAMP.x - 0.9, 2.55, LAMP.z);
  add(block(1.1, 0.1, 0.1, -1.6, { front: girder({ seed: 32 }) }), LAMP.x - 0.4, 5.1, LAMP.z);
  add(block(0.7, 0.18, 0.34, -1.6, {
    front: (pc, W, H) => pc.rect(0, 0, W, H, hex(0x2a2d2c), { r: 0.5 }),
    bottom: (pc, W, H) => pc.rect(0, 0, W, H, [255, 210, 150], { e: [255, 170, 80] }),
  }, { emissiveIntensity: 8 }), LAMP.x, LAMP.y, LAMP.z);

  // paper lanterns at the stall edges
  const lanterns = [];
  for (const lx of [STALL_X - 3.4, STALL_X + 3.4]) {
    const m = flat(0.5, 0.75, -3.3, (pc, W, H) => {
      pc.disc(W / 2, H / 2, Math.min(W, H) / 2 - 0.5, (x, y, nx, ny) => ((y % 3) === 0 ? [150, 40, 30] : [220, 70, 50]), { z: 0, e: [255, 70, 40], r: 0.7 });
      pc.rect(W / 2 - 2, 0, W / 2 + 2, 2, hex(0x1a1a1a));
    }, { emissiveIntensity: 2.2 });
    add(m, lx, 3.0, -3.3); lanterns.push(m);
  }

  // foreground occluders, defocused by depth of field: posts, fence, a hanging cable
  for (const fx of [-24, -9, 6, 21]) add(block(0.42, 12, 0.42, 7, { front: concrete({ base: 0x17191a, seed: fx }) }), fx, 6, 7.5);
  const fence = flat(14, 3.2, 6, chainLink(), { castShadow: false }); add(fence, -16, 1.6, 6.2);
  const fence2 = flat(10, 2.8, 6, chainLink(), { castShadow: false }); add(fence2, 14, 1.4, 6.6);

  // lights
  const lights = {};
  lights.hemi = new THREE.HemisphereLight(0x284450, 0x0a0b0c, 0.55); root.add(lights.hemi);
  lights.back = new THREE.DirectionalLight(0x7aa6c0, 0.55); lights.back.position.set(-10, 16, -24); root.add(lights.back);
  lights.sodium = new THREE.SpotLight(0xff8f3a, 140, 0, 0.62, 0.55, 2);
  lights.sodium.position.copy(LAMP).add(new THREE.Vector3(0, -0.12, 0));
  lights.sodium.target.position.set(LAMP.x + 0.4, 0, LAMP.z + 0.6);
  lights.sodium.castShadow = true; lights.sodium.shadow.mapSize.set(1024, 1024); lights.sodium.shadow.bias = -0.0004; lights.sodium.shadow.radius = 2;
  root.add(lights.sodium, lights.sodium.target);
  lights.neon = new THREE.PointLight(0x2fe6d2, 26, 18, 2); lights.neon.position.set(STALL_X - 0.4, 4.2, -2.4); root.add(lights.neon);
  lights.stall = new THREE.PointLight(0xffb36b, 16, 12, 2); lights.stall.position.set(STALL_X, 2.6, -5.0); root.add(lights.stall);
  lights.lanternL = new THREE.PointLight(0xff4a2a, 2.5, 5, 2); lights.lanternL.position.set(STALL_X - 3.4, 2.9, -3.0); root.add(lights.lanternL);
  lights.lanternR = new THREE.PointLight(0xff4a2a, 2.5, 5, 2); lights.lanternR.position.set(STALL_X + 3.4, 2.9, -3.0); root.add(lights.lanternR);

  const anchors = { LAMP, STALL_X, DECK_Y, DECK_H, DECK_Z, SIGN: new THREE.Vector3(STALL_X - 0.4, 4.45, -3.0) };
  return { root, lights, anchors, lanterns };
}
