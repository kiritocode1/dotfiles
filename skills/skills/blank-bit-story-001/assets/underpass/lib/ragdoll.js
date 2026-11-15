// A ragdoll for the figure rig. On a fatal shot the pose clips stop and the body becomes a set of
// point masses at the joints (Verlet integration), held together by distance constraints, with
// gravity and a floor. The bullet throws the chest and head back while the legs have no speed,
// so the body folds and falls the way it was hit, lands, and slides to a stop.
//
// Each frame the points are turned back into joint rotations: the torso is one rigid body,
// shoulders and hips are ball joints, knees and elbows are hinges that cannot bend backwards.
// After that solve the points are moved onto the joints actually drawn, so the limits feed
// back into the simulation.
import * as THREE from 'three';

const GRAVITY = 12, SUBSTEP = 1 / 120, ITER = 8, SLEEP_AFTER = 4;
const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0);
const HEAD_TIP = new THREE.Vector3(0, 0.24, 0);
const TORSO = ['hips', 'thighL', 'thighR', 'neck', 'armL', 'armR'];

// name, radius against the floor, inverse mass (the torso is heavier than a hand)
const POINTS = [
  ['hips', 0.15, 0.5], ['thighL', 0.11, 0.6], ['thighR', 0.11, 0.6], ['neck', 0.15, 0.6], ['armL', 0.08, 0.7], ['armR', 0.08, 0.7],
  ['head', 0.11, 0.9], ['shinL', 0.07, 1], ['shinR', 0.07, 1], ['footL', 0.06, 1], ['footR', 0.06, 1],
  ['elbowL', 0.06, 1], ['elbowR', 0.06, 1], ['handL', 0.05, 1.2], ['handR', 0.05, 1.2],
];
const LINKS = [['thighL', 'shinL'], ['shinL', 'footL'], ['thighR', 'shinR'], ['shinR', 'footR'],
  ['armL', 'elbowL'], ['elbowL', 'handL'], ['armR', 'elbowR'], ['elbowR', 'handR'], ['neck', 'head']];

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m4 = new THREE.Matrix4();

/** Torso orientation from its points: up the spine, across the shoulders. */
function torsoBasis(P, out) {
  const y = v1.subVectors(P.neck.p, P.hips.p).normalize();
  const x = v2.subVectors(P.armL.p, P.armR.p);
  x.addScaledVector(y, -x.dot(y)).normalize();
  const z = v3.crossVectors(x, y);
  return out.setFromRotationMatrix(m4.makeBasis(x, y, z));
}

export class Ragdoll {
  /**
   * fig: a Figure whose model matrices are current. dir: +1 or -1, the way the bullet travels
   * along x. power scales the throw.
   */
  constructor(fig, dir, power = 1) {
    this.fig = fig; this.J = fig.J; this.t = 0; this.acc = 0;
    const J = this.J;
    fig.model.updateMatrixWorld(true);
    this.P = {};
    for (const [name, r, w] of POINTS) {
      const p = name === 'head' ? J.head.localToWorld(HEAD_TIP.clone()) : J[name].getWorldPosition(new THREE.Vector3());
      this.P[name] = { p, prev: p.clone(), r, w };
    }
    this.links = [];
    for (let i = 0; i < TORSO.length; i++) for (let j = i + 1; j < TORSO.length; j++) this.link(TORSO[i], TORSO[j]);
    for (const [a, b] of LINKS) this.link(a, b);
    // head stays roughly over the shoulders: soft limit by a minimum distance to each shoulder
    this.headMin = Math.min(this.P.head.p.distanceTo(this.P.armL.p), this.P.head.p.distanceTo(this.P.armR.p)) * 0.82;

    // rest state for the solve: torso basis, hips world rotation, each joint's local rotation
    this.basis0 = torsoBasis(this.P, new THREE.Quaternion());
    this.hipsQ0 = J.hips.getWorldQuaternion(new THREE.Quaternion());
    this.q0 = {};
    for (const k of ['thighL', 'thighR', 'armL', 'armR', 'head']) this.q0[k] = J[k].quaternion.clone();

    // the throw, as [along the shot, up]: chest and head take the push; the hands get more than
    // the chest and some lift, so the arms fly back and up past the body; the knees go the
    // other way and down, so the legs buckle instead of falling as one straight plank
    const kick = { neck: [3, 0.9], armL: [3, 0.9], armR: [3, 0.9], head: [3.6, 0.9], hips: [1.6, 0.3],
      elbowL: [3.8, 1.4], elbowR: [3.8, 1.4], handL: [4.6, 2.2], handR: [4.6, 2.2], shinL: [-0.9, -0.4], shinR: [-0.9, -0.4] };
    for (const k in kick) this.push(k, dir * kick[k][0] * power, kick[k][1] * power, (Math.random() - 0.5) * 0.4);
  }

  link(a, b) { this.links.push([this.P[a], this.P[b], this.P[a].p.distanceTo(this.P[b].p)]); }

  /** Add velocity to a point (Verlet keeps velocity as the gap between p and prev). */
  push(name, vx, vy, vz) { this.P[name].prev.sub(v1.set(vx, vy, vz).multiplyScalar(SUBSTEP)); }

  update(dt) {
    this.t += dt;
    if (this.t < SLEEP_AFTER) {
      this.acc += Math.min(dt, 0.05);
      while (this.acc >= SUBSTEP) { this.acc -= SUBSTEP; this.step(SUBSTEP); }
    }
    this.solve();
  }

  step(h) {
    const pts = Object.values(this.P);
    for (const q of pts) {
      const vx = (q.p.x - q.prev.x) * 0.998, vy = (q.p.y - q.prev.y) * 0.998, vz = (q.p.z - q.prev.z) * 0.9;
      q.prev.copy(q.p);
      q.p.x += vx; q.p.y += vy - GRAVITY * h * h; q.p.z += vz;
    }
    for (let it = 0; it < ITER; it++) {
      for (const [a, b, len] of this.links) {
        const d = v1.subVectors(b.p, a.p), l = d.length() || 1e-6, k = (l - len) / l / (a.w + b.w);
        a.p.addScaledVector(d, k * a.w); b.p.addScaledVector(d, -k * b.w);
      }
      const H = this.P.head;
      for (const s of [this.P.armL, this.P.armR]) {
        const d = v1.subVectors(H.p, s.p), l = d.length() || 1e-6;
        if (l < this.headMin) H.p.addScaledVector(d, (this.headMin - l) / l);
      }
      // floor: stop sinking, and grip, so a landing body scrapes to a halt instead of skating
      for (const q of pts) if (q.p.y < q.r) {
        q.p.y = q.r;
        q.prev.x += (q.p.x - q.prev.x) * 0.35; q.prev.z += (q.p.z - q.prev.z) * 0.35;
        if (q.prev.y < q.p.y) q.prev.y = q.p.y - (q.prev.y - q.p.y) * 0.15;   // a small bounce
      }
    }
  }

  /** Points to joint rotations, then points onto the drawn joints. */
  solve() {
    const { fig, J, P } = this;
    // keep the card centred on the body, so a body lying flat stays inside the figure's frame
    let lo = Infinity, hi = -Infinity;
    for (const k in P) { lo = Math.min(lo, P[k].p.x); hi = Math.max(hi, P[k].p.x); }
    fig.mesh.position.x = (lo + hi) / 2;
    fig.model.position.copy(fig.mesh.position);
    fig.model.updateMatrixWorld(true);

    // torso: a rigid body moved by the rotation from its rest basis to the current one
    const R = torsoBasis(P, q1).multiply(q2.copy(this.basis0).invert());
    const hipsW = q2.copy(R).multiply(this.hipsQ0);
    J.hips.quaternion.copy(fig.model.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(hipsW));
    J.hips.position.copy(fig.model.worldToLocal(v3.copy(P.hips.p)));
    J.hips.updateMatrixWorld(true);
    for (const k of TORSO) this.place(P[k], J[k].getWorldPosition(v3));

    this.ball('thighL', 'shinL', DOWN, 1.9); this.hinge('shinL', 'footL', 1);
    this.ball('thighR', 'shinR', DOWN, 1.9); this.hinge('shinR', 'footR', 1);
    this.ball('armL', 'elbowL', DOWN, 3); this.hinge('elbowL', 'handL', -1);
    this.ball('armR', 'elbowR', DOWN, 3); this.hinge('elbowR', 'handR', -1);
    this.ball('head', 'head', UP, 0.9, true);
  }

  /** Ball joint: turn `name` so its bone points at the child point, within maxAngle of rest. */
  ball(name, child, axis, maxAngle, tip = false) {
    const j = this.J[name], parentQ = j.parent.getWorldQuaternion(q2);
    const from = j.getWorldPosition(v1);
    const d = v2.subVectors(this.P[child].p, from).applyQuaternion(parentQ.invert()).normalize();
    const rest = v3.copy(axis).applyQuaternion(this.q0[name]);
    q1.setFromUnitVectors(rest, d);
    const angle = 2 * Math.acos(Math.min(1, Math.abs(q1.w)));
    if (angle > maxAngle) q1.slerp(new THREE.Quaternion(), 1 - maxAngle / angle);
    j.quaternion.copy(q1).multiply(this.q0[name]);
    j.updateMatrixWorld(true);
    this.place(this.P[child], tip ? j.localToWorld(v3.copy(HEAD_TIP)) : this.J[child].getWorldPosition(v3));
  }

  /**
   * Hinge about the joint's x axis. sign 1: a knee (the lower bone swings backward, rotation.x
   * positive). sign -1: an elbow (the forearm swings forward, rotation.x negative).
   */
  hinge(name, child, sign) {
    const j = this.J[name];
    const d = v2.subVectors(this.P[child].p, j.getWorldPosition(v1));
    d.applyQuaternion(j.parent.getWorldQuaternion(q2).invert());
    const bend = THREE.MathUtils.clamp(Math.atan2(-sign * d.z, -d.y), 0.02, sign > 0 ? 2.5 : 2.6);
    j.rotation.set(sign * bend, 0, 0);
    j.updateMatrixWorld(true);
    this.place(this.P[child], this.J[child].getWorldPosition(v3));
  }

  /**
   * Move a point onto its drawn joint. prev moves by the same amount, so a correction from the
   * joint limits changes where the point is but adds no speed (moving p alone would).
   */
  place(q, to) {
    const dx = to.x - q.p.x, dy = Math.max(to.y, q.r * 0.6) - q.p.y, dz = to.z - q.p.z;
    q.p.x += dx; q.p.y += dy; q.p.z += dz; q.prev.x += dx; q.prev.y += dy; q.prev.z += dz;
  }
}
