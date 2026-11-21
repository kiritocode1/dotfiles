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
// near-black boots with pale soles.
//
// Her face and hair follow the user's reference photo: warm medium-brown skin, strong dark brows,
// full lips, and big black curly hair parted near the middle, falling past the shoulders and
// framing an open face. The face stays uncovered in the three-quarter view the game uses.
//
// Built facing +z with the feet on y = 0. Joint names match outfits.js, so Figure and motion.js
// drive her unchanged. J.hipY0 is her hip height.
import * as THREE from 'three';
import { skirt, strip } from './cloth.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: 0,
  side: o.side ?? THREE.FrontSide, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return new THREE.Mesh(g, m); };

/**
 * A smooth tube through elliptical rings, top to bottom. secs: [y, rx, rz, dz = 0, dx = 0]
 * (half-width, half-depth, centre offsets). Ends close by giving the first and last ring a tiny
 * radius. a0..a1 limits the arc for an open garment; angle 0 is the front (+z). o.bump(a, y)
 * scales the radius per vertex, for lumpy surfaces such as curls.
 */
export function loft(secs, m, o = {}) {
  const N = o.seg ?? 16, a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2, bump = o.bump ?? (() => 1);
  const closed = a1 - a0 >= Math.PI * 2 - 1e-6, cols = closed ? N : N + 1;
  const pos = [], idx = [];
  for (const [y, rx, rz, dz = 0, dx = 0] of secs)
    for (let i = 0; i < cols; i++) {
      const a = a0 + ((a1 - a0) * i) / N;
      const b = bump(a, y);
      pos.push(dx + Math.sin(a) * rx * b, y, dz + Math.cos(a) * rz * b);
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

export function januwu() {
  const M = {
    jacket: mat(0x8a7448, { side: THREE.DoubleSide }), jacketIn: mat(0x4a3d27, { side: THREE.DoubleSide }), cuff: mat(0x5a4a30),
    shirt: mat(0x2c2a2e), trouser: mat(0x393b44), boot: mat(0x1c1a19, { r: 0.5 }), sole: mat(0x9a968c, { r: 0.6 }),
    skin: mat(0xa8735a, { r: 0.6 }), hair: mat(0x15100e, { r: 0.7, side: THREE.DoubleSide }),
    brow: mat(0x150f0d, { r: 0.9 }), eye: mat(0x0e0a09, { r: 0.3 }), lip: mat(0x96564d, { r: 0.55 }), scarf: mat(0x9c3a30, { r: 0.95 }),
    bag: mat(0x474c53, { r: 0.7 }), strap: mat(0x2e3238, { r: 0.7 }),
  };
  const root = new THREE.Group(), J = {};
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
  skirt(J, M.jacket, M.jacketIn, { len: 0.17, r: 0.168, depth: 0.72, open: front + 0.05, y: 0, flare: 0.6 });

  // bag on the back, strap from the right shoulder to the left hip
  J.pack = joint(J.spine, 0.02, 0.36, -0.13);
  J.pack.add(loft([[0.0, 0.01, 0.01], [-0.02, 0.13, 0.05], [-0.25, 0.14, 0.06], [-0.3, 0.12, 0.05], [-0.31, 0.01, 0.01]], M.bag, { seg: 12 }));
  const strap = box(0.04, 0.5, 0.02, M.strap, 0, 0, 0); strap.position.set(-0.01, 0.21, 0.13); strap.rotation.z = -0.62; J.spine.add(strap);

  // neck, scarf wrapped high to the jaw, tail hanging from the back as cloth that clears the
  // shoulders and the bag
  J.neck = joint(J.spine, 0, 0.43, 0);
  J.neck.add(loft([[0.1, 0.01, 0.01], [0.09, 0.048, 0.052], [-0.02, 0.055, 0.06]], M.skin, { seg: 10 }));
  J.neck.add(loft([[0.11, 0.055, 0.06, 0.01], [0.08, 0.075, 0.082, 0.008], [0.02, 0.088, 0.094], [-0.02, 0.1, 0.1], [-0.04, 0.06, 0.06]], M.scarf, { seg: 14 }));
  strip(J, J.neck, M.scarf, { at: [0.03, 0.02, -0.095], w: 0.06, len: 0.38, rows: 5, colliders: [
    { j1: J.spine, o1: [0, 0.05, 0], j2: J.spine, o2: [0, 0.3, 0], r: 0.13 },
    { j1: J.pack, o1: [0, -0.03, 0], j2: J.pack, o2: [0, -0.27, 0], r: 0.075 },
  ] });

  // head: skull, cheek and jaw, then the features. At 2x density a texel is about 2 cm, so each
  // feature is one or two texels: brows and eyes as dark bars that read as a set look, a nose
  // that breaks the profile, and lips a shade darker than the skin.
  J.head = joint(J.neck, 0, 0.05, 0);
  J.head.add(loft([[0.215, 0.01, 0.01], [0.205, 0.06, 0.065, -0.005], [0.17, 0.083, 0.095, -0.005], [0.12, 0.08, 0.096, 0.004], [0.075, 0.068, 0.085, 0.012], [0.04, 0.045, 0.06, 0.022], [0.022, 0.012, 0.02, 0.03]], M.skin, { seg: 14 }));
  J.head.add(box(0.022, 0.042, 0.03, M.skin, 0, 0.108, 0.103));                    // nose
  for (const sx of [1, -1]) {
    const brow = box(0.042, 0.012, 0.016, M.brow, 0.031 * sx, 0.153, 0.093);
    brow.rotation.z = -0.12 * sx; J.head.add(brow);                                 // outer end lower
    J.head.add(box(0.028, 0.012, 0.012, M.eye, 0.032 * sx, 0.13, 0.091));          // eye
  }
  J.head.add(box(0.044, 0.017, 0.014, M.lip, 0, 0.072, 0.094));                    // lips

  // Hair: big black curls, wider than the head from the ears down. A cap over the crown ends at
  // the hairline, a curtain open at the face swells past the jaw and over the shoulders, and
  // clumps break the outline. Curl lumps are 2 to 3 cm, more than a texel, so the scene's
  // lights pick them out and the crown highlight breaks up instead of drawing a hat brim.
  const curl = (k) => (a, y) => 1 + k * Math.sin(a * 5 + y * 28) * Math.sin(y * 36 + a * 2.3);
  J.head.add(loft([[0.272, 0.01, 0.01], [0.266, 0.06, 0.064, -0.012], [0.25, 0.104, 0.11, -0.014], [0.222, 0.128, 0.134, -0.017], [0.19, 0.134, 0.14, -0.02]], M.hair, { seg: 18, bump: curl(0.12) }));
  const face = 1.3;   // half-angle of the opening; the game's view is about 1.07 off the face
  const CURTAIN = [[0.19, 0.13, 0.136, -0.02], [0.14, 0.145, 0.14, -0.03], [0.08, 0.165, 0.142, -0.042], [0.02, 0.188, 0.142, -0.052], [-0.04, 0.205, 0.14, -0.06], [-0.1, 0.21, 0.132, -0.066], [-0.16, 0.19, 0.11, -0.07], [-0.2, 0.13, 0.075, -0.07]];
  J.head.add(loft(CURTAIN, M.hair, { a0: face, a1: Math.PI * 2 - face, seg: 24, bump: curl(0.14) }));
  // a curl over each temple from the parting, beside the face rather than over it
  for (const sx of [1, -1]) {
    const lock = joint(J.head, 0.09 * sx, 0.2, 0.05); lock.rotation.z = 0.14 * sx;
    lock.add(loft([[0.01, 0.01, 0.01], [0.0, 0.03, 0.026], [-0.06, 0.034, 0.03], [-0.13, 0.03, 0.026], [-0.17, 0.01, 0.01]], M.hair, { seg: 8, bump: curl(0.2) }));
  }
  // clumps on the curtain, placed by a fixed sequence so every load matches
  const ring = (y) => {   // the curtain ring at height y, interpolated
    let i = 0; while (i < CURTAIN.length - 2 && CURTAIN[i + 1][0] > y) i++;
    const [y0, ...r0] = CURTAIN[i], [y1, ...r1] = CURTAIN[i + 1], t = (y0 - y) / (y0 - y1);
    return r0.map((v, k) => v + (r1[k] - v) * t);
  };
  for (let i = 0; i < 28; i++) {
    const a = face + 0.1 + ((i * 0.618) % 1) * (Math.PI * 2 - 2 * face - 0.2);
    const y = 0.12 - ((i * 0.382) % 1) * 0.3, r = 0.034 + ((i * 0.27) % 1) * 0.026;
    const [rx, rz, dz] = ring(y);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.hair);
    c.position.set(Math.sin(a) * rx, y, dz + Math.cos(a) * rz);
    J.head.add(c);
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
