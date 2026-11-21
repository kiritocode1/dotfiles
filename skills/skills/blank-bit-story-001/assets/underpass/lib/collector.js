// The Collector, the first enemy. Sent to take back the bag Januwu carries: a professional doing
// a job, so nothing about him is loud. Built like Januwu from lofted rings over the anatomy
// (see januwu.js), so both read as real bodies on the same 2x grid.
//
// Silhouette against hers: Januwu is big hair over a short jacket. He is a small head under a
// flat cap on a long straight raincoat to the knee. The pale gloves are the tell: at 2x the gun
// hand is the lightest thing on him, so the eye sees it come up before the shot.
//
// 1.80 m. Built facing +z with the feet on y = 0; joint names match januwu.js, so Figure and
// motion.js drive him unchanged. J.hipY0 is his hip height.
import * as THREE from 'three';
import { loft } from './januwu.js';
import { skirt } from './cloth.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: 0,
  side: o.side ?? THREE.FrontSide });
const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return new THREE.Mesh(g, m); };

export function collector() {
  const M = {
    coat: mat(0x3a4047, { r: 0.55, side: THREE.DoubleSide }), lining: mat(0x18191b, { side: THREE.DoubleSide }),
    trouser: mat(0x232428), shoe: mat(0x111112, { r: 0.4 }), skin: mat(0xc49478, { r: 0.6 }),
    hair: mat(0x1d1712, { r: 0.8 }), cap: mat(0x3a3631, { r: 0.95 }), glove: mat(0xd2cbbb, { r: 0.7 }),
    brow: mat(0x1d1612, { r: 0.9 }), eye: mat(0x0e0a09, { r: 0.3 }), mouth: mat(0x6a4236, { r: 0.7 }),
  };
  const root = new THREE.Group(), J = {};
  const THIGH = 0.45, SHIN = 0.42, ANKLE = 0.08, UPPER = 0.31, FORE = 0.27;
  J.hipY0 = 0.05 + THIGH + SHIN + ANKLE;                              // 1.0

  J.hips = joint(root, 0, J.hipY0, 0);
  J.hips.add(loft([[0.07, 0.01, 0.01], [0.06, 0.14, 0.1], [0.0, 0.155, 0.105], [-0.07, 0.158, 0.108], [-0.14, 0.13, 0.09], [-0.18, 0.02, 0.02]], M.trouser));
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const th = J['thigh' + k] = joint(J.hips, 0.09 * sx, -0.05, 0);
    th.add(loft([[0.05, 0.01, 0.01], [0.03, 0.078, 0.08], [-0.05, 0.084, 0.086], [-0.2, 0.074, 0.078], [-0.38, 0.058, 0.06], [-0.47, 0.04, 0.04], [-0.49, 0.01, 0.01]], M.trouser));
    const sh = J['shin' + k] = joint(th, 0, -THIGH, 0);
    sh.add(loft([[0.04, 0.01, 0.01], [0.02, 0.054, 0.056], [-0.08, 0.06, 0.064, -0.008], [-0.25, 0.052, 0.056], [-0.4, 0.05, 0.052], [-0.43, 0.01, 0.01]], M.trouser));
    const ft = J['foot' + k] = joint(sh, 0, -SHIN, 0);
    ft.add(loft([[0.02, 0.01, 0.01], [0.0, 0.05, 0.06, 0.03], [-0.045, 0.052, 0.12, 0.05], [-0.06, 0.05, 0.125, 0.05], [-0.068, 0.01, 0.01, 0.05]], M.shoe));
  }

  // the raincoat: buttoned, broad at the shoulder, straight down; the skirt hangs to the knee
  J.spine = joint(J.hips, 0, 0.06, 0);
  J.spine.add(loft([[0.5, 0.01, 0.01], [0.49, 0.1, 0.08], [0.46, 0.2, 0.11], [0.4, 0.192, 0.125], [0.3, 0.178, 0.13], [0.18, 0.165, 0.122], [0.06, 0.16, 0.118], [-0.04, 0.17, 0.122], [-0.07, 0.01, 0.01]], M.coat, { seg: 18 }));
  skirt(J, M.coat, M.lining, { len: 0.52, r: 0.172, depth: 0.74, open: 0.22, split: 0.75, y: -0.03, flare: 1 });

  // collar turned up, neck, head
  J.neck = joint(J.spine, 0, 0.5, 0);
  J.neck.add(loft([[0.1, 0.01, 0.01], [0.09, 0.052, 0.056], [-0.02, 0.06, 0.064]], M.skin, { seg: 10 }));
  J.neck.add(loft([[0.1, 0.082, 0.09, -0.02], [0.03, 0.095, 0.1, -0.012], [-0.03, 0.12, 0.11]], M.coat, { a0: 0.7, a1: Math.PI * 2 - 0.7, seg: 14 }));
  J.head = joint(J.neck, 0, 0.06, 0);
  J.head.add(loft([[0.225, 0.01, 0.01], [0.215, 0.064, 0.07, -0.006], [0.18, 0.088, 0.1, -0.006], [0.125, 0.086, 0.1, 0.004], [0.075, 0.078, 0.092, 0.012], [0.035, 0.06, 0.07, 0.022], [0.015, 0.016, 0.024, 0.03]], M.skin, { seg: 14 }));
  J.head.add(box(0.026, 0.05, 0.034, M.skin, 0, 0.112, 0.105));      // nose
  for (const sx of [1, -1]) {
    J.head.add(box(0.044, 0.012, 0.016, M.brow, 0.033 * sx, 0.152, 0.093));
    J.head.add(box(0.026, 0.01, 0.012, M.eye, 0.033 * sx, 0.133, 0.093));
  }
  J.head.add(box(0.04, 0.008, 0.012, M.mouth, 0, 0.07, 0.099));      // a straight mouth
  // short hair at the back and sides, then the flat cap with a short brim
  J.head.add(loft([[0.2, 0.094, 0.104, -0.012], [0.14, 0.096, 0.1, -0.022], [0.09, 0.08, 0.08, -0.04]], M.hair, { a0: 1.5, a1: Math.PI * 2 - 1.5, seg: 12 }));
  J.head.add(loft([[0.262, 0.01, 0.01], [0.258, 0.09, 0.1, 0.0], [0.235, 0.108, 0.122, 0.008], [0.195, 0.104, 0.116, 0.002]], M.cap, { seg: 16 }));
  J.head.add(box(0.15, 0.012, 0.05, M.cap, 0, 0.2, 0.12));

  // sleeves, pale gloves
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const ua = J['arm' + k] = joint(J.spine, 0.195 * sx, 0.43, 0);
    ua.add(loft([[0.07, 0.01, 0.01], [0.05, 0.062, 0.064], [0.0, 0.066, 0.068], [-0.1, 0.06, 0.062], [-0.25, 0.054, 0.056], [-0.33, 0.044, 0.046], [-0.34, 0.01, 0.01]], M.coat));
    const fa = J['elbow' + k] = joint(ua, 0, -UPPER, 0);
    fa.add(loft([[0.03, 0.01, 0.01], [0.02, 0.054, 0.056], [-0.08, 0.054, 0.056], [-0.2, 0.05, 0.052], [-0.25, 0.056, 0.056], [-0.255, 0.01, 0.01]], M.coat));
    const hd = J['hand' + k] = joint(fa, 0, -FORE, 0);
    hd.add(loft([[0.012, 0.01, 0.01], [0.0, 0.03, 0.024], [-0.035, 0.042, 0.022, 0.004], [-0.08, 0.044, 0.02, 0.01], [-0.125, 0.036, 0.018, 0.018], [-0.15, 0.01, 0.01, 0.024]], M.glove, { seg: 10 }));
  }
  return { root, J, name: 'Collector' };
}
