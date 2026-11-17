// Januwu, the courier. A realistic woman built in code for the pixel-art figure render: each body
// part is a smooth tube lofted through elliptical rings shaped like the anatomy under the
// clothes (thigh, calf, waist, bust), with smooth shading, so the low-resolution render gets
// soft light gradients and a human silhouette instead of capsule segments and facets.
//
// Proportions for 1.68 m: about 7.6 heads tall, shoulder joints 0.35 m apart, hips wider than
// the shoulders, legs about half the height, hanging fingertips at mid-thigh.
//
// The courier look from sprites/SPEC.md: an ochre canvas work jacket, hip length and open over a
// dark shirt, sleeves slightly long; a dark red scarf high at the neck with a trailing tail; a
// grey courier bag on the back with a strap across the chest; charcoal trousers tucked into
// near-black boots with pale soles; dark shaggy chin-length hair.
//
// Built facing +z with the feet on y = 0. Joint names match outfits.js, so Figure and motion.js
// drive her unchanged. J.hipY0 is her hip height.
import * as THREE from 'three';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: 0,
  side: o.side ?? THREE.FrontSide, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return new THREE.Mesh(g, m); };

/**
 * A smooth tube through elliptical rings, top to bottom. secs: [y, rx, rz, dz = 0, dx = 0]
 * (half-width, half-depth, centre offsets). Ends close by giving the first and last ring a tiny
 * radius. a0..a1 limits the arc for an open garment; angle 0 is the front (+z).
 */
function loft(secs, m, o = {}) {
  const N = o.seg ?? 16, a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2;
  const closed = a1 - a0 >= Math.PI * 2 - 1e-6, cols = closed ? N : N + 1;
  const pos = [], idx = [];
  for (const [y, rx, rz, dz = 0, dx = 0] of secs)
    for (let i = 0; i < cols; i++) {
      const a = a0 + ((a1 - a0) * i) / N;
      pos.push(dx + Math.sin(a) * rx, y, dz + Math.cos(a) * rz);
    }
  for (let r = 0; r + 1 < secs.length; r++)
    for (let i = 0; i < N; i++) {
      const i1 = closed ? (i + 1) % N : i + 1;
      const p = r * cols + i, q = r * cols + i1, s = (r + 1) * cols + i, t = (r + 1) * cols + i1;
      idx.push(p, s, q, q, s, t);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}

/** Jacket hem: panels hung from the hips that Figure swings on springs (see outfits.js skirt). */
function hem(J, m, lining, { len, r, depth, open, n = 12, y = 0 }) {
  const w = ((2 * Math.PI * r) / n) * 1.14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (Math.cos(a) > Math.cos(open)) continue;
    const j = joint(J.hips, Math.sin(a) * r, y, Math.cos(a) * r * depth);
    j.rotation.order = 'YXZ'; j.rotation.y = a;
    j.add(box(w, len, 0.016, m, 0, -len / 2, 0));
    j.add(box(w * 0.94, len * 0.96, 0.008, lining, 0, -len / 2, -0.012));
    J.cloth.push({ j, a, sx: Math.sin(a), cz: Math.cos(a), s: { x: 0.05, v: 0 }, flare: 0.6, len });
  }
}

export function januwu() {
  const M = {
    jacket: mat(0x8a7448, { side: THREE.DoubleSide }), jacketIn: mat(0x4a3d27, { side: THREE.DoubleSide }), cuff: mat(0x5a4a30),
    shirt: mat(0x2c2a2e), trouser: mat(0x393b44), boot: mat(0x1c1a19, { r: 0.5 }), sole: mat(0x9a968c, { r: 0.6 }),
    skin: mat(0xc58866, { r: 0.6 }), hair: mat(0x0b0a0c, { r: 0.4, side: THREE.DoubleSide }), scarf: mat(0x9c3a30, { r: 0.95 }),
    bag: mat(0x474c53, { r: 0.7 }), strap: mat(0x2e3238, { r: 0.7 }),
  };
  const root = new THREE.Group(), J = { cloth: [] };
  const THIGH = 0.41, SHIN = 0.39, ANKLE = 0.075, UPPER = 0.28, FORE = 0.245;
  J.hipY0 = 0.05 + THIGH + SHIN + ANKLE;                              // 0.925

  // pelvis in trousers, wider than the waist, seat a little back
  J.hips = joint(root, 0, J.hipY0, 0);
  J.hips.add(loft([[0.07, 0.01, 0.01], [0.065, 0.14, 0.095], [0.0, 0.162, 0.104], [-0.06, 0.176, 0.112, -0.01], [-0.12, 0.168, 0.104, -0.006], [-0.16, 0.12, 0.08], [-0.18, 0.02, 0.02]], M.trouser));

  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const th = J['thigh' + k] = joint(J.hips, 0.088 * sx, -0.05, 0);
    th.add(loft([[0.05, 0.01, 0.01], [0.03, 0.07, 0.074], [-0.03, 0.08, 0.084, 0.004], [-0.13, 0.074, 0.078, 0.006], [-0.26, 0.061, 0.065], [-0.37, 0.05, 0.053], [-0.43, 0.037, 0.037], [-0.45, 0.01, 0.01]], M.trouser));
    const sh = J['shin' + k] = joint(th, 0, -THIGH, 0);
    sh.add(loft([[0.04, 0.01, 0.01], [0.02, 0.048, 0.05], [-0.06, 0.054, 0.058, -0.008], [-0.15, 0.054, 0.058, -0.01], [-0.2, 0.05, 0.054], [-0.22, 0.01, 0.01]], M.trouser));
    // boot shaft over the tucked trousers, then the foot
    sh.add(loft([[-0.19, 0.01, 0.01], [-0.2, 0.056, 0.06], [-0.3, 0.05, 0.054], [-0.39, 0.05, 0.055, 0.008], [-0.41, 0.01, 0.01]], M.boot));
    const ft = J['foot' + k] = joint(sh, 0, -SHIN, 0);
    ft.add(loft([[0.02, 0.01, 0.01], [0.0, 0.048, 0.06, 0.03], [-0.04, 0.05, 0.11, 0.05], [-0.055, 0.046, 0.115, 0.05], [-0.06, 0.01, 0.01, 0.05]], M.boot));
    ft.add(box(0.096, 0.016, 0.24, M.sole, 0, -0.067, 0.05));
  }

  // torso: the dark shirt with a woman's waist and chest, the open jacket over it
  J.spine = joint(J.hips, 0, 0.06, 0);
  J.spine.add(loft([[0.46, 0.01, 0.01], [0.44, 0.07, 0.06], [0.41, 0.14, 0.082], [0.36, 0.152, 0.096], [0.3, 0.145, 0.11, 0.012], [0.25, 0.138, 0.118, 0.02], [0.19, 0.122, 0.1, 0.008], [0.1, 0.11, 0.086], [0.03, 0.122, 0.09], [-0.04, 0.138, 0.096], [-0.06, 0.01, 0.01]], M.shirt));
  const front = 0.36;
  // jacket taken in at the waist, flaring again over the hips
  J.spine.add(loft([[0.44, 0.095, 0.072], [0.41, 0.175, 0.096], [0.35, 0.172, 0.114], [0.28, 0.162, 0.13, 0.01], [0.19, 0.142, 0.118], [0.1, 0.128, 0.104], [0.03, 0.14, 0.108], [-0.06, 0.165, 0.118]], M.jacket, { a0: front, a1: Math.PI * 2 - front, seg: 18 }));
  hem(J, M.jacket, M.jacketIn, { len: 0.17, r: 0.168, depth: 0.72, open: front + 0.05 });

  // bag on the back, strap from the right shoulder to the left hip
  J.pack = joint(J.spine, 0.02, 0.36, -0.13);
  J.pack.add(loft([[0.0, 0.01, 0.01], [-0.02, 0.13, 0.05], [-0.25, 0.14, 0.06], [-0.3, 0.12, 0.05], [-0.31, 0.01, 0.01]], M.bag, { seg: 12 }));
  const strap = box(0.04, 0.5, 0.02, M.strap, 0, 0, 0); strap.position.set(-0.01, 0.21, 0.13); strap.rotation.z = -0.62; J.spine.add(strap);

  // neck, scarf wrapped high to the jaw, tail trailing from the back
  J.neck = joint(J.spine, 0, 0.43, 0);
  J.neck.add(loft([[0.1, 0.01, 0.01], [0.09, 0.048, 0.052], [-0.02, 0.055, 0.06]], M.skin, { seg: 10 }));
  J.neck.add(loft([[0.11, 0.055, 0.06, 0.01], [0.08, 0.075, 0.082, 0.008], [0.02, 0.088, 0.094], [-0.02, 0.1, 0.1], [-0.04, 0.06, 0.06]], M.scarf, { seg: 14 }));
  J.tail = [];
  let par = joint(J.neck, 0.03, 0.02, -0.09);
  for (let i = 0; i < 3; i++) {
    par.add(box(0.065 - i * 0.008, 0.14, 0.022, M.scarf, 0, -0.065, 0));
    J.tail.push(par);
    par = joint(par, 0, -0.13, 0);
  }

  // head: skull, cheek and jaw, a small nose; hair over the crown and down the sides to the chin
  J.head = joint(J.neck, 0, 0.05, 0);
  J.head.add(loft([[0.215, 0.01, 0.01], [0.205, 0.06, 0.065, -0.005], [0.17, 0.083, 0.095, -0.005], [0.12, 0.08, 0.096, 0.004], [0.075, 0.068, 0.085, 0.012], [0.04, 0.045, 0.06, 0.022], [0.022, 0.012, 0.02, 0.03]], M.skin, { seg: 14 }));
  J.head.add(box(0.022, 0.04, 0.03, M.skin, 0, 0.11, 0.1));
  // black hair, shoulder length: a full crown, then a curtain open at the face that falls past
  // the jaw and over the scarf at the back, and locks framing the face down to the chin
  J.head.add(loft([[0.245, 0.01, 0.01], [0.238, 0.075, 0.08, -0.012], [0.21, 0.112, 0.122, -0.014], [0.17, 0.122, 0.13, -0.014]], M.hair, { seg: 16 }));
  const face = 1.0;
  J.head.add(loft([[0.175, 0.122, 0.13, -0.014], [0.12, 0.122, 0.128, -0.026], [0.06, 0.118, 0.12, -0.04], [0.0, 0.122, 0.11, -0.055], [-0.06, 0.13, 0.095, -0.07], [-0.1, 0.12, 0.08, -0.075]], M.hair, { a0: face, a1: Math.PI * 2 - face, seg: 16 }));
  for (const [x, y, l, rz, rx] of [[0.0, 0.2, 0.07, 0.1, -0.5], [0.06, 0.19, 0.08, 0.35, -0.45], [-0.06, 0.19, 0.075, -0.3, -0.45], [0.095, 0.16, 0.17, 0.08, -0.12], [-0.095, 0.16, 0.17, -0.08, -0.12]]) {
    const p = joint(J.head, x, y, 0.085); p.rotation.set(rx, 0, rz); p.add(box(0.04, l, 0.03, M.hair, 0, -l / 2, 0));
  }

  // arms in the jacket sleeves, cuffs a little long, bare hands
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const ua = J['arm' + k] = joint(J.spine, 0.165 * sx, 0.37, 0);
    ua.add(loft([[0.065, 0.01, 0.01], [0.045, 0.046, 0.05], [0.0, 0.058, 0.06], [-0.07, 0.054, 0.056], [-0.17, 0.049, 0.051], [-0.27, 0.046, 0.048], [-0.31, 0.037, 0.039], [-0.32, 0.01, 0.01]], M.jacket));
    const fa = J['elbow' + k] = joint(ua, 0, -UPPER, 0);
    fa.add(loft([[0.03, 0.01, 0.01], [0.02, 0.048, 0.05], [-0.05, 0.05, 0.052], [-0.15, 0.046, 0.046], [-0.21, 0.046, 0.046], [-0.215, 0.01, 0.01]], M.jacket));
    fa.add(loft([[-0.205, 0.048, 0.048], [-0.245, 0.047, 0.047], [-0.25, 0.01, 0.01]], M.cuff, { seg: 12 }));
    const hd = J['hand' + k] = joint(fa, 0, -FORE, 0);
    hd.add(loft([[0.01, 0.01, 0.01], [0.0, 0.026, 0.02], [-0.03, 0.036, 0.019, 0.004], [-0.075, 0.04, 0.018, 0.01], [-0.12, 0.034, 0.016, 0.018], [-0.145, 0.01, 0.01, 0.024]], M.skin, { seg: 10 }));
  }
  return { root, J, name: 'Januwu' };
}
