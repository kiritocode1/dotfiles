// Characters: one skeleton, several outfits. Each outfit is designed for a 63 x 68 texel render,
// so it is planned in shapes and values, not detail:
//   - one silhouette idea that reads in black (a long coat, a big hood, a short shell)
//   - values grouped dark low, mid on the body, light near the face and hands
//   - one accent colour that is not in the set (the set is teal and sodium orange)
//   - cloth that swings (coat tails, hood trim), because secondary motion carries fluidity
// Built facing +z, feet on y = 0. Positive joint x rotation swings a hanging part backward.
import * as THREE from 'three';
import { januwu } from './januwu.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: 0, flatShading: true,
  emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide });
const capsule = (r, len, m, rb) => {
  const g = new THREE.CapsuleGeometry(r, len, 2, 7); g.translate(0, -len / 2 - r * 0.4, 0);
  if (rb) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = Math.min(1, Math.max(0, -p.getY(i) / (len + r))); const k = 1 + (rb / r - 1) * t; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); }
  return new THREE.Mesh(g, m);
};
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return new THREE.Mesh(g, m); };
const cyl = (rt, rb, h, m, y = 0, sz = 1, seg = 8) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, y, 0); const o = new THREE.Mesh(g, m); o.scale.z = sz; return o; };
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; };

/** Bare skeleton. Proportions: shoulder half-width, hip height, leg and arm lengths. */
function skeleton(p = {}) {
  const S = { shoulder: 0.25, hip: 0.98, thigh: 0.46, shin: 0.42, upper: 0.33, fore: 0.31, ...p };
  const root = new THREE.Group(), J = { cloth: [] };
  J.hips = joint(root, 0, S.hip, 0);
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    J['thigh' + k] = joint(J.hips, 0.1 * sx, -0.05, 0);
    J['shin' + k] = joint(J['thigh' + k], 0, -S.thigh, 0);
    J['foot' + k] = joint(J['shin' + k], 0, -S.shin, 0);
  }
  J.spine = joint(J.hips, 0, 0.06, 0);
  J.neck = joint(J.spine, 0, 0.6, 0);
  J.head = joint(J.neck, 0, 0.045, 0);   // low, so the head sits on the collar with no gap
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    J['arm' + k] = joint(J.spine, S.shoulder * sx, 0.55, 0);
    J['elbow' + k] = joint(J['arm' + k], 0, -S.upper, 0);
    J['hand' + k] = joint(J['elbow' + k], 0, -S.fore, 0);
  }
  return { root, J, S };
}

/**
 * Coat skirt: a ring of narrow panels hung from the waist, each hinged at the top and swinging
 * outward on its own spring. Figure.update pushes each panel by how much the legs, speed and
 * hip sway move the cloth in that panel's direction, so the skirt flares and settles as one
 * round shape. o.open leaves a gap at the front (an unbuttoned coat).
 */
function skirt(J, m, lining, o) {
  const { len, y = -0.02, flare = 1, n = 10, r = 0.2, depth = 0.76, open = 0 } = o;
  const w = (2 * Math.PI * r / n) * 1.12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;                      // 0 is the front, PI/2 the left side
    if (open && Math.cos(a) > Math.cos(open)) continue;
    const j = joint(J.hips, Math.sin(a) * r, y, Math.cos(a) * r * depth);
    j.rotation.order = 'YXZ'; j.rotation.y = a;
    j.add(box(w, len, 0.02, m, 0, -len / 2, 0));
    j.add(box(w * 0.94, len * 0.97, 0.01, lining, 0, -len / 2, -0.014));
    J.cloth.push({ j, a, sx: Math.sin(a), cz: Math.cos(a), s: { x: 0.08 * flare, v: 0 }, flare, len });
  }
}

// A short thick neck from the collar into the jaw. The head is its own joint, and a gap of a
// texel between head and collar reads as a thin stalk at this size.
const neck = (J, m) => J.neck.add(cyl(0.068, 0.08, 0.15, m, 0.05));

const hands = (J, m, r = 0.04) => {
  for (const k of ['L', 'R']) J['hand' + k].add(box(r * 1.9, r * 2.5, r * 2.1, m, 0, -0.03, 0.005));
};
const boots = (J, m, sole, w = 0.13, h = 0.11) => {
  for (const k of ['L', 'R']) {
    J['foot' + k].add(box(w, h, 0.27, m, 0, -0.03, 0.045));
    if (sole) J['foot' + k].add(box(w + 0.01, 0.035, 0.28, sole, 0, -0.085, 0.045));
  }
};

export const OUTFITS = {
  /** Januwu, the realistic courier built from lofted anatomy (lib/januwu.js). */
  januwu,

  /**
   * Ash. Ankle-length oilskin duster, charcoal with an oxblood lining that shows when the
   * tails swing, high stand collar, bare hands and a pale shirt at the throat so the light
   * values sit at the face and hands. Silhouette: a tall closed wedge.
   */
  duster() {
    const { root, J } = skeleton({ shoulder: 0.27 });
    const M = {
      coat: mat(0x2d3330, { r: 0.55, side: THREE.DoubleSide }), coatHi: mat(0x3a423e, { r: 0.5 }), lining: mat(0x6e1f1c, { side: THREE.DoubleSide }),
      shirt: mat(0x9a958a), trouser: mat(0x1c1e23), boot: mat(0x16130f, { r: 0.45 }), skin: mat(0xc39377), hair: mat(0x17120f), belt: mat(0x0f0f10, { r: 0.4 }),
    };
    J.hips.add(box(0.33, 0.2, 0.22, M.trouser, 0, -0.02, 0));
    for (const k of ['L', 'R']) {
      J['thigh' + k].add(capsule(0.08, 0.36, M.trouser));
      J['shin' + k].add(capsule(0.066, 0.32, M.trouser));
    }
    boots(J, M.boot, null, 0.125, 0.12);
    J.spine.add(cyl(0.215, 0.18, 0.62, M.coat, 0.28, 0.72));            // coat body, broad at the shoulder
    J.spine.add(box(0.36, 0.1, 0.24, M.coatHi, 0, 0.55, 0));            // shoulder yoke
    J.spine.add(cyl(0.19, 0.19, 0.05, M.belt, 0.02, 0.74));              // belt
    J.spine.add(box(0.08, 0.16, 0.02, M.shirt, 0, 0.5, 0.155));          // shirt at the open collar
    skirt(J, M.coat, M.lining, { len: 0.74, flare: 1, open: 0.32 });   // open at the front, splits as the legs move
    // stand collar: open at the front, rising to the jaw
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.12, 9, 1, true, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5), M.coat);
    collar.position.set(0, 0.035, -0.01); collar.scale.z = 0.95; J.neck.add(collar);
    neck(J, M.skin);
    J.head.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.112, 1), M.skin), 0, 0.13, 0.01));
    J.head.add(box(0.235, 0.09, 0.235, M.hair, 0, 0.215, -0.012));      // short cut, swept back
    J.head.add(box(0.21, 0.12, 0.06, M.hair, 0, 0.16, -0.1));
    for (const k of ['L', 'R']) {
      J['arm' + k].add(capsule(0.072, 0.26, M.coat, 0.068));
      J['elbow' + k].add(capsule(0.064, 0.21, M.coat, 0.07));           // wide cuff
      J['elbow' + k].add(box(0.1, 0.03, 0.1, M.shirt, 0, -0.29, 0));
    }
    hands(J, M.skin);
    return { root, J, name: 'Ash' };
  },

  /**
   * Wren. Oversized ochre parka with the hood up and a grey fur ruff, black cargo trousers,
   * chunky boots with pale soles so every footfall reads. A cross-body sling. Silhouette: a
   * big rounded top on thin dark legs. Ochre is the one warm colour the teal set lacks.
   */
  parka() {
    const { root, J } = skeleton({ shoulder: 0.27 });
    const M = {
      parka: mat(0xa8822c, { side: THREE.DoubleSide }), parkaD: mat(0x7a5d20, { side: THREE.DoubleSide }), fur: mat(0x6f6a62, { r: 1 }),
      hoodIn: mat(0x2a2016, { side: THREE.BackSide }), trouser: mat(0x1b1c20), pocket: mat(0x24262c), boot: mat(0x2b2621, { r: 0.6 }),
      sole: mat(0xa59f94), skin: mat(0xb88466), sling: mat(0x272b31), strap: mat(0x15171a), glove: mat(0x1e1f22),
    };
    J.hips.add(box(0.34, 0.2, 0.22, M.trouser, 0, -0.02, 0));
    for (const k of ['L', 'R']) {
      J['thigh' + k].add(capsule(0.088, 0.36, M.trouser));
      J['thigh' + k].add(box(0.05, 0.13, 0.11, M.pocket, k === 'L' ? 0.09 : -0.09, -0.26, 0));   // cargo pocket
      J['shin' + k].add(capsule(0.072, 0.32, M.trouser, 0.078));
    }
    boots(J, M.boot, M.sole, 0.15, 0.13);
    J.spine.add(cyl(0.245, 0.24, 0.66, M.parka, 0.27, 0.78));           // puffed body
    J.spine.add(cyl(0.25, 0.25, 0.04, M.parkaD, 0.12, 0.79));            // quilting lines
    J.spine.add(cyl(0.25, 0.25, 0.04, M.parkaD, 0.32, 0.79));
    skirt(J, M.parka, M.parkaD, { len: 0.3, y: -0.06, flare: 1.6 });     // short hem that flips
    // sling across the chest, bag riding on the back hip
    const strap = box(0.05, 0.7, 0.03, M.strap, 0, 0.3, 0.19); strap.rotation.z = 0.75; J.spine.add(strap);
    J.pack = joint(J.spine, -0.14, 0.08, -0.17);
    J.pack.add(box(0.26, 0.18, 0.1, M.sling, 0, -0.06, -0.02));
    // hood up: a deep shell with a fur ruff around the opening
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.8), M.parka);
    hood.position.set(0, 0.13, -0.035); J.head.add(hood);
    const inside = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), M.hoodIn); inside.position.copy(hood.position); J.head.add(inside);
    const ruff = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.03, 5, 12), M.fur);
    ruff.position.set(0, 0.13, 0.05); ruff.scale.set(0.95, 1.1, 0.8); J.head.add(ruff);
    J.ruff = ruff;
    J.head.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.105, 1), M.skin), 0, 0.12, 0.02));
    neck(J, M.skin);
    for (const k of ['L', 'R']) {
      J['arm' + k].add(capsule(0.085, 0.25, M.parka, 0.08));
      J['elbow' + k].add(capsule(0.075, 0.2, M.parka, 0.07));
    }
    hands(J, M.glove, 0.042);
    return { root, J, name: 'Wren' };
  },

  /**
   * Juno. A knee-length rain shell in pale blue-grey over a black turtleneck and slim black
   * trousers, white sneakers, a coral bag on a short strap, a black bob with a straight
   * fringe. Silhouette: light shell, dark core. The pale coat is the lightest value in the
   * frame, so she reads against the dark street the way a white shirt reads in film noir.
   */
  shell() {
    const { root, J } = skeleton({ shoulder: 0.235, upper: 0.32, fore: 0.3 });
    const M = {
      shell: mat(0x9eb2bb, { r: 0.28, side: THREE.DoubleSide }), shellD: mat(0x71868f, { r: 0.3, side: THREE.DoubleSide }),
      knit: mat(0x141517), trouser: mat(0x17181b), shoe: mat(0xd8d4cc, { r: 0.5 }), sole: mat(0xefece6), skin: mat(0xd2a184),
      hair: mat(0x0e0d0f, { r: 0.4 }), bag: mat(0xc0503f, { r: 0.5 }), strap: mat(0x5a2820),
    };
    J.hips.add(box(0.3, 0.2, 0.2, M.trouser, 0, -0.02, 0));
    for (const k of ['L', 'R']) {
      J['thigh' + k].add(capsule(0.074, 0.36, M.trouser, 0.064));
      J['shin' + k].add(capsule(0.06, 0.32, M.trouser, 0.05));
    }
    boots(J, M.shoe, M.sole, 0.12, 0.1);
    J.spine.add(cyl(0.19, 0.175, 0.6, M.shell, 0.28, 0.74));
    J.spine.add(box(0.03, 0.5, 0.02, M.shellD, 0.03, 0.28, 0.145));      // zip placket
    skirt(J, M.shell, M.shellD, { len: 0.5, flare: 1.3 });
    J.neck.add(cyl(0.085, 0.09, 0.17, M.knit, 0.045));                   // turtleneck, up to the jaw
    const hoodDown = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.05, 5, 10, Math.PI * 1.3), M.shell);
    hoodDown.rotation.set(Math.PI / 2, 0, Math.PI * 1.35); hoodDown.position.set(0, -0.01, -0.03); J.neck.add(hoodDown);
    J.head.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.105, 1), M.skin), 0, 0.13, 0.01));
    // bob: a cap over the crown, a fringe, and sides to the jaw
    J.head.add(box(0.235, 0.1, 0.24, M.hair, 0, 0.21, -0.01));
    J.head.add(box(0.215, 0.04, 0.04, M.hair, 0, 0.19, 0.105));
    J.head.add(box(0.04, 0.16, 0.13, M.hair, 0.112, 0.12, -0.06));    // sides stop behind the cheek
    J.head.add(box(0.04, 0.16, 0.13, M.hair, -0.112, 0.12, -0.06));
    J.head.add(box(0.2, 0.16, 0.04, M.hair, 0, 0.12, -0.115));
    // short-strap bag under the left arm
    J.pack = joint(J.spine, 0.2, 0.5, 0.0);
    J.pack.add(box(0.025, 0.36, 0.025, M.strap, 0, -0.17, 0.0));
    J.pack.add(box(0.07, 0.15, 0.2, M.bag, 0.02, -0.38, 0.0));
    for (const k of ['L', 'R']) {
      J['arm' + k].add(capsule(0.064, 0.25, M.shell, 0.06));
      J['elbow' + k].add(capsule(0.056, 0.2, M.shell, 0.058));
    }
    hands(J, M.skin, 0.036);
    return { root, J, name: 'Juno' };
  },

  /**
   * Enforcer, the enemy. A short black bomber with lighter shoulder panels so the arms read
   * against the dark, a knit cap, a dark mask over the lower face, a red armband as the one
   * accent. Silhouette: square shoulders on straight legs, nothing that swings, so the eye
   * tells them from the hero at a glance.
   */
  enforcer() {
    const { root, J } = skeleton({ shoulder: 0.28 });
    const M = {
      jacket: mat(0x24272c, { r: 0.6 }), panel: mat(0x41474f, { r: 0.55 }), trouser: mat(0x1a1c20), boot: mat(0x121212, { r: 0.5 }),
      skin: mat(0xa87a5e), mask: mat(0x15171a), cap: mat(0x191a1d, { r: 1 }), band: mat(0x9a2a22), glove: mat(0x141516),
    };
    J.hips.add(box(0.35, 0.2, 0.22, M.trouser, 0, -0.02, 0));
    for (const k of ['L', 'R']) {
      J['thigh' + k].add(capsule(0.09, 0.36, M.trouser));
      J['shin' + k].add(capsule(0.072, 0.32, M.trouser, 0.075));
    }
    boots(J, M.boot, null, 0.14, 0.13);
    J.spine.add(cyl(0.23, 0.2, 0.56, M.jacket, 0.3, 0.78));             // bomber body, cut at the waist
    J.spine.add(cyl(0.205, 0.205, 0.07, M.panel, 0.03, 0.8));            // ribbed hem
    J.spine.add(box(0.42, 0.11, 0.26, M.panel, 0, 0.55, 0));             // shoulder panels
    J.neck.add(cyl(0.095, 0.11, 0.12, M.jacket, 0.02));                  // collar
    neck(J, M.mask);
    J.head.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), M.skin), 0, 0.13, 0.01));
    J.head.add(box(0.2, 0.09, 0.2, M.mask, 0, 0.075, 0.025));            // mask over the jaw
    J.head.add(box(0.23, 0.1, 0.23, M.cap, 0, 0.22, -0.005));            // knit cap
    for (const k of ['L', 'R']) {
      J['arm' + k].add(capsule(0.078, 0.26, M.jacket, 0.07));
      J['elbow' + k].add(capsule(0.066, 0.21, M.jacket, 0.06));
    }
    J.armL.add(cyl(0.083, 0.083, 0.06, M.band, -0.16));                  // armband
    hands(J, M.glove, 0.042);
    return { root, J, name: 'Enforcer' };
  },
};
