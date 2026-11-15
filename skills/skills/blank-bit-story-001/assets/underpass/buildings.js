// Contact sheet of the city generator: one row per building type, several seeds each, painted
// straight from PixelCanvas (albedo under a flat ambient plus emission), no haze, no scene.
// ?t=8 sets texels per unit (the mid band is about 7), ?n=6 seeds per row, ?seed=1 the first.
import { paintBuilding, TYPES } from './lib/city.js';

const q = new URLSearchParams(location.search);
const t = Number(q.get('t')) || 8, n = Number(q.get('n')) || 6, seed0 = Number(q.get('seed')) || 1;
const ZOOM = 2, PAD = 12, AMBIENT = 0.5;
const mid = ([a, b]) => (a + b) / 2;

const rows = Object.keys(TYPES).map((type, ti) => {
  const T = TYPES[type];
  return Array.from({ length: n }, (_, i) => {
    const s = seed0 + ti * 1000 + i;
    const w = 11 * (T.w[0] + (T.w[1] - T.w[0]) * ((i * 0.37) % 1));
    const h = 26 * mid(T.h);
    const roof = type === 'tower' ? 7 : 4;
    return paintBuilding({ type, w, h, roof, seed: s * 7919, kind: T.kinds[i % T.kinds.length], t,
      shop: i % 2 === 0 && T.shop > 0, sign: i % 3 === 1 ? { x: 0.7, color: 0xff3d7f } : null,
      billboard: i % 3 === 2 && type !== 'warehouse' ? 0x31e3d2 : null, litShare: 0.25 + (i % 3) * 0.2 });
  });
});

const rowH = rows.map((r) => Math.max(...r.map((pc) => pc.h)));
const W = Math.max(...rows.map((r) => r.reduce((a, pc) => a + pc.w + PAD, PAD)));
const H = rowH.reduce((a, h) => a + h + PAD, PAD);
const cv = document.getElementById('sheet');
cv.width = W; cv.height = H; cv.style.width = W * ZOOM + 'px'; cv.style.height = H * ZOOM + 'px';
const g = cv.getContext('2d');
g.fillStyle = '#1a262b'; g.fillRect(0, 0, W, H);
const img = g.getImageData(0, 0, W, H);

let y = PAD;
rows.forEach((r, ri) => {
  let x = PAD;
  for (const pc of r) {
    const oy = y + rowH[ri] - pc.h;                    // stand every building on the row's ground line
    for (let j = 0; j < pc.h; j++) for (let i = 0; i < pc.w; i++) {
      const k = j * pc.w + i; if (!pc.alpha[k]) continue;
      const o = ((oy + j) * W + x + i) * 4;
      for (let c = 0; c < 3; c++) img.data[o + c] = Math.min(255, pc.color[k * 3 + c] * AMBIENT + pc.emit[k * 3 + c]);
      img.data[o + 3] = 255;
    }
    x += pc.w + PAD;
  }
  y += rowH[ri] + PAD;
});
g.putImageData(img, 0, 0);
window.__sheet = { types: Object.keys(TYPES), t, n };
