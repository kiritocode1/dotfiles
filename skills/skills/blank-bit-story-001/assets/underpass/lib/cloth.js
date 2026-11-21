// Cloth for the figures. A coat skirt, a jacket hem or a scarf tail is one continuous sheet: a
// grid of points under gravity held together by distance constraints (position-based Verlet,
// after Jakobsen, "Advanced Character Physics", 2001). The top row is sewn to a joint. The rest
// trails the body when it moves, swings back when it stops, folds around the legs it collides
// with, and lands on the street when the body falls.
//
// Points live in world space and step at a fixed 120 Hz, so the sheet keeps its momentum as the
// body walks. The mesh is rewritten only on the figure's pose ticks, so the cloth holds like
// drawn frames along with the rest of the body.
import * as THREE from 'three';

const STEP = 1 / 120, MAX_STEPS = 4, ITER = 6;
const GRAVITY = -9.8, DAMP = 0.994;      // DAMP: velocity kept per step, so a still sheet settles
// Air drag, quadratic in speed through still air: acceleration AIR * v^2. At a 4.6 m/s run that is
// 8 m/s^2 against gravity's 9.8, so a coat trails about 40 degrees; at a 1.7 m/s walk about 6.
// A weak linear drag alone let the coat swing like a pendulum, in front of the hips mid-run.
const AIR = 0.38;
const GROUND = 0.012, FRICTION = 0.4;    // a point on the street keeps this much of its slide
const TELEPORT = 1.0;                    // the joint jumped this far in one frame: lay the cloth out again

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _v = new THREE.Vector3(), _inv = new THREE.Matrix4();

export class Cloth {
  /**
   * parent: the joint the top row is sewn to. rest(c, r): the point at column c, row r in the
   * parent's space at rest, row 0 on top. front and back: materials for the outside and the inside.
   * colliders: capsules [{ j1, o1, j2, o2, r }] from offset o1 on joint j1 to o2 on j2, radius r.
   * o.closed joins the last column to the first (a ring); o.bend is the stiffness against folding.
   */
  constructor(parent, cols, rows, rest, front, back, colliders = [], o = {}) {
    this.parent = parent; this.colliders = colliders;
    const closed = !!o.closed, C = closed ? cols : cols + 1, R = rows + 1, n = C * R;
    this.C = C; this.n = n;
    this.rest = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) this.rest.push(rest(c, r));
    this.p = new Float32Array(n * 3); this.q = new Float32Array(n * 3);
    this.pin = new Float32Array(C * 3); this.pinPrev = new Float32Array(C * 3);
    const id = (c, r) => r * C + ((c + C) % C);
    const links = [];
    const link = (a, b, k) => links.push(a, b, this.rest[a].distanceTo(this.rest[b]), k);
    const bend = o.bend ?? 0.35;
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const across = closed || c + 1 < C, across2 = closed || c + 2 < C;
        if (across) link(id(c, r), id(c + 1, r), 1);
        if (r + 1 < R) link(id(c, r), id(c, r + 1), 1);
        if (across && r + 1 < R) { link(id(c, r), id(c + 1, r + 1), 0.5); link(id(c + 1, r), id(c, r + 1), 0.5); }
        if (across2) link(id(c, r), id(c + 2, r), bend);
        if (r + 2 < R) link(id(c, r), id(c, r + 2), bend);
      }
    this.links = new Float32Array(links);

    const idx = [];
    for (let r = 0; r + 1 < R; r++)
      for (let c = 0; c < (closed ? C : C - 1); c++) {
        const p = id(c, r), q = id(c + 1, r), s = id(c, r + 1), t = id(c + 1, r + 1);
        idx.push(p, s, q, q, s, t);    // the winding of januwu.js loft: the outside faces out
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.rest.flatMap((v) => [v.x, v.y, v.z]), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    this.geo = g;
    const out = front.clone(); out.side = THREE.FrontSide;
    const lin = (back ?? front).clone(); lin.side = THREE.BackSide;
    this.meshes = [new THREE.Mesh(g, out), new THREE.Mesh(g, lin)];
    for (const m of this.meshes) { m.frustumCulled = false; parent.add(m); }
    this.ready = false; this.acc = 0;
    // collider end points in world space, refreshed each frame
    this.caps = colliders.map(() => [new THREE.Vector3(), new THREE.Vector3()]);
  }

  /** Lay the sheet out at rest on the joint, with no motion. */
  reset() {
    const M = this.parent.matrixWorld;
    for (let i = 0; i < this.n; i++) {
      _v.copy(this.rest[i]).applyMatrix4(M);
      _v.toArray(this.p, i * 3); _v.toArray(this.q, i * 3);
    }
    this.pinPrev.set(this.p.subarray(0, this.C * 3)); this.pin.set(this.pinPrev);
    this.ready = true; this.acc = 0;
  }

  /**
   * Advance by dt. Call after the figure's joints are posed and its matrices updated. draw writes
   * the mesh (the figure's pose tick); sleep skips the simulation (a body that has lain still).
   */
  step(dt, draw, sleep = false) {
    const M = this.parent.matrixWorld, C = this.C, p = this.p, q = this.q, pin = this.pin, prev = this.pinPrev;
    for (let c = 0; c < C; c++) _v.copy(this.rest[c]).applyMatrix4(M).toArray(pin, c * 3);
    if (!this.ready || Math.hypot(pin[0] - prev[0], pin[1] - prev[1], pin[2] - prev[2]) > TELEPORT) this.reset();

    if (!sleep) {
      this.acc = Math.min(this.acc + dt, STEP * MAX_STEPS);
      const steps = Math.floor(this.acc / STEP);
      this.acc -= steps * STEP;
      if (steps) this.colliders.forEach((k, i) => { k.j1.localToWorld(this.caps[i][0].fromArray(k.o1)); k.j2.localToWorld(this.caps[i][1].fromArray(k.o2)); });
      for (let s = 1; s <= steps; s++) {
        // the sewn row follows the joint smoothly across the frame's steps
        const t = s / steps;
        for (let i = 0; i < C * 3; i++) p[i] = q[i] = prev[i] + (pin[i] - prev[i]) * t;
        for (let i = C * 3; i < this.n * 3; i += 3) {
          // displacement per step d = v * STEP, so AIR * v^2 * STEP^2 = AIR * |d| * d: solved
          // implicitly as d / (1 + AIR * |d|), which stays stable at any speed
          let vx = p[i] - q[i], vy = p[i + 1] - q[i + 1], vz = p[i + 2] - q[i + 2];
          const drag = DAMP / (1 + AIR * Math.sqrt(vx * vx + vy * vy + vz * vz));
          vx *= drag; vy *= drag; vz *= drag;
          q[i] = p[i]; q[i + 1] = p[i + 1]; q[i + 2] = p[i + 2];
          p[i] += vx; p[i + 1] += vy + GRAVITY * STEP * STEP; p[i + 2] += vz;
        }
        for (let it = 0; it < ITER; it++) { this.solve(); this.collide(); }
      }
    }
    p.set(pin, 0);
    prev.set(pin);

    if (draw) {
      _inv.copy(M).invert();
      const pos = this.geo.attributes.position;
      for (let i = 0; i < this.n; i++) {
        _v.fromArray(p, i * 3).applyMatrix4(_inv);
        pos.setXYZ(i, _v.x, _v.y, _v.z);
      }
      pos.needsUpdate = true;
      this.geo.computeVertexNormals();
    }
  }

  /** Distance constraints, each pulled toward its rest length by its stiffness. Row 0 is pinned. */
  solve() {
    const p = this.p, L = this.links, pinned = this.C;
    for (let k = 0; k < L.length; k += 4) {
      const a = L[k], b = L[k + 1], len = L[k + 2], stiff = L[k + 3];
      const wa = a < pinned ? 0 : 1, wb = b < pinned ? 0 : 1;
      if (!wa && !wb) continue;
      const ax = a * 3, bx = b * 3;
      const dx = p[bx] - p[ax], dy = p[bx + 1] - p[ax + 1], dz = p[bx + 2] - p[ax + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      const f = ((d - len) / d) * stiff / (wa + wb);
      p[ax] += dx * f * wa; p[ax + 1] += dy * f * wa; p[ax + 2] += dz * f * wa;
      p[bx] -= dx * f * wb; p[bx + 1] -= dy * f * wb; p[bx + 2] -= dz * f * wb;
    }
  }

  /** Push points out of the body's capsules and up out of the street. */
  collide() {
    const p = this.p, q = this.q;
    for (let i = this.C * 3; i < this.n * 3; i += 3) {
      for (let k = 0; k < this.caps.length; k++) {
        const [A, B] = this.caps[k], r = this.colliders[k].r;
        _a.subVectors(B, A); _b.set(p[i] - A.x, p[i + 1] - A.y, p[i + 2] - A.z);
        const t = Math.min(1, Math.max(0, _b.dot(_a) / (_a.lengthSq() || 1e-6)));
        _v.copy(A).addScaledVector(_a, t);                          // nearest point on the bone
        const dx = p[i] - _v.x, dy = p[i + 1] - _v.y, dz = p[i + 2] - _v.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 1e-6, push = (r - d) / d;
        p[i] += dx * push; p[i + 1] += dy * push; p[i + 2] += dz * push;
      }
      if (p[i + 1] < GROUND) {
        p[i + 1] = GROUND;
        q[i] = p[i] - (p[i] - q[i]) * FRICTION; q[i + 2] = p[i + 2] - (p[i + 2] - q[i + 2]) * FRICTION;
      }
    }
  }
}

/** Capsules for both legs and the pelvis, the bodies a skirt hangs around. */
export function legColliders(J, { thigh = 0.1, shin = 0.075, pelvis = 0.1 } = {}) {
  const O = [0, 0, 0], caps = [{ j1: J.thighL, o1: O, j2: J.thighR, o2: O, r: pelvis }];
  for (const k of ['L', 'R']) {
    caps.push({ j1: J['thigh' + k], o1: O, j2: J['shin' + k], o2: O, r: thigh });
    caps.push({ j1: J['shin' + k], o1: O, j2: J['foot' + k], o2: O, r: shin });
  }
  return caps;
}

/**
 * A coat skirt or jacket hem sewn to the hips: an elliptical ring of radius r (depth scales its
 * front to back), len long, and wider at the hem by `flare`. `open` is the half-angle of the gap
 * at the front at the waist (0 closes it); `split` widens that gap toward the hem, the way a coat
 * buttoned to the waist parts below it, so a forward knee goes through the gap instead of
 * pushing the whole skirt ahead of the body. Adds the sheet to J.drape.
 */
export function skirt(J, front, back, { len, r = 0.2, depth = 0.76, open = 0, split = open, y = -0.02, flare = 1, cols = 18, rows } = {}) {
  rows ??= Math.max(2, Math.round(len / 0.085));
  const closed = !open && !split;
  const rest = (c, row) => {
    const t = row / rows, gap = open + (split - open) * t, a = gap + ((Math.PI * 2 - 2 * gap) * c) / cols;
    const w = r * (1 + 0.14 * flare * t);
    return new THREE.Vector3(Math.sin(a) * w, y - len * t, Math.cos(a) * w * depth);
  };
  (J.drape ??= []).push(new Cloth(J.hips, cols, rows, rest, front, back, legColliders(J), { closed }));
}

/**
 * A strip hung from a joint, such as a scarf tail: w wide, len long, starting at `at` in the
 * joint's space and hanging down. colliders keep it outside the torso and whatever is on the back.
 */
export function strip(J, joint, m, { at, w, len, rows = 5, colliders = [] }) {
  const rest = (c, row) => new THREE.Vector3(at[0] + (c - 0.5) * w, at[1] - (len * row) / rows, at[2]);
  (J.drape ??= []).push(new Cloth(joint, 1, rows, rest, m, m, colliders, { bend: 0.15 }));
}
