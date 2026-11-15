// Key-pose animation for the figure. A clip is a list of key poses at times; between keys the
// channels follow a Catmull-Rom curve, so motion eases through poses instead of swinging on a
// sine. Gait clips are one stride long with left heel contact at 0. Symmetric gaits author
// half a stride and mirror it; a limp authors the whole stride because its halves differ.
//
// Channels are radians unless noted. Positive limb angles swing forward; positive knee and
// elbow angles bend; foot positive lifts the toe; hipY and hipX are world units. pitch tips the
// whole body about the hips (negative falls backward), for falls.

export const CHANNELS = ['hipX', 'hipY', 'hipRotY', 'hipRoll', 'lean', 'twist', 'spineRoll', 'neckX', 'headX', 'headY',
  'thighL', 'thighR', 'kneeL', 'kneeR', 'footL', 'footR', 'armL', 'armR', 'outL', 'outR', 'elbowL', 'elbowR', 'pitch'];

export const NEUTRAL = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
Object.assign(NEUTRAL, { kneeL: 0.06, kneeR: 0.06, armL: 0.04, armR: 0.04, outL: 0.07, outR: 0.07, elbowL: 0.25, elbowR: 0.25, lean: 0.03 });
const pose = (o) => ({ ...NEUTRAL, ...o });

const SWAP = { thighL: 'thighR', kneeL: 'kneeR', footL: 'footR', armL: 'armR', outL: 'outR', elbowL: 'elbowR' };
for (const [a, b] of Object.entries(SWAP)) SWAP[b] = a;
const NEGATE = new Set(['hipX', 'hipRotY', 'hipRoll', 'twist', 'spineRoll', 'headY']);
function mirror(p) {
  const m = {};
  for (const c of CHANNELS) m[SWAP[c] ?? c] = NEGATE.has(c) ? -p[c] : p[c];
  return m;
}

/** keys: [[t, pose]] over half a cycle (t in 0..0.5); returns full-cycle keys. */
const mirrored = (keys) => [...keys, ...keys.map(([t, p]) => [t + 0.5, mirror(p)])];

const cr = (a, b, c, d, u) => {
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (3 * b - a - 3 * c + d) * u3);
};

/** Sample keys at normalised time t. cyclic wraps; otherwise clamps at the ends. */
export function sample(keys, t, cyclic = true, out = {}) {
  const n = keys.length;
  if (cyclic) t = ((t % 1) + 1) % 1; else t = Math.min(Math.max(t, keys[0][0]), keys[n - 1][0]);
  let i = n - 1;
  for (let k = 0; k < n; k++) if (keys[k][0] <= t) i = k;
  const at = (k) => (cyclic ? keys[((k % n) + n) % n] : keys[Math.min(Math.max(k, 0), n - 1)]);
  const t0 = at(i)[0], t1raw = at(i + 1)[0], t1 = cyclic && i + 1 >= n ? t1raw + 1 : t1raw;
  const u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
  const p0 = at(i - 1)[1], p1 = at(i)[1], p2 = at(i + 1)[1], p3 = at(i + 2)[1];
  for (const c of CHANNELS) out[c] = cr(p0[c], p1[c], p2[c], p3[c], u);
  return out;
}

// ---------------------------------------------------------------- clips

export const WALK = mirrored([
  [0.0, pose({ thighL: 0.42, kneeL: 0.04, footL: 0.28, thighR: -0.32, kneeR: 0.2, footR: -0.3, hipY: -0.012, armL: -0.32, armR: 0.34, elbowL: 0.2, elbowR: 0.42, twist: 0.1, hipRotY: -0.08, lean: 0.07, headX: -0.02 })],
  [0.09, pose({ thighL: 0.3, kneeL: 0.3, footL: 0.0, thighR: -0.18, kneeR: 0.72, footR: -0.12, hipY: -0.045, hipRoll: 0.04, spineRoll: -0.03, armL: -0.22, armR: 0.26, elbowL: 0.22, elbowR: 0.5, twist: 0.06, hipRotY: -0.05, lean: 0.07, headX: 0.03 })],
  [0.25, pose({ thighL: 0.02, kneeL: 0.08, thighR: 0.12, kneeR: 1.05, footR: 0.1, hipY: 0.0, hipRoll: 0.025, armL: -0.02, armR: 0.04, elbowL: 0.26, elbowR: 0.3, lean: 0.06 })],
  [0.38, pose({ thighL: -0.22, kneeL: 0.06, footL: -0.15, thighR: 0.4, kneeR: 0.45, footR: 0.2, hipY: 0.026, hipRoll: 0.01, armL: 0.22, armR: -0.2, elbowL: 0.4, elbowR: 0.22, twist: -0.06, hipRotY: 0.05, lean: 0.06, headX: -0.01 })],
]);

export const RUN = mirrored([
  [0.0, pose({ thighL: 0.62, kneeL: 0.25, footL: 0.15, thighR: -0.55, kneeR: 0.5, footR: -0.4, hipY: -0.04, lean: 0.32, armL: -0.8, armR: 0.75, elbowL: 1.1, elbowR: 1.5, outL: 0.12, outR: 0.12, twist: 0.18, hipRotY: -0.12, headX: -0.16 })],
  [0.08, pose({ thighL: 0.36, kneeL: 0.75, footL: 0.0, thighR: -0.4, kneeR: 1.0, footR: -0.2, hipY: -0.1, hipRoll: 0.05, lean: 0.34, armL: -0.6, armR: 0.6, elbowL: 1.2, elbowR: 1.4, outL: 0.12, outR: 0.12, twist: 0.12, headX: -0.14 })],
  [0.2, pose({ thighL: -0.35, kneeL: 0.25, footL: -0.45, thighR: 0.38, kneeR: 1.7, footR: 0.1, hipY: 0.0, lean: 0.33, armL: 0.1, armR: -0.1, elbowL: 1.35, elbowR: 1.35, outL: 0.12, outR: 0.12, headX: -0.15 })],
  [0.33, pose({ thighL: -0.62, kneeL: 0.62, footL: -0.3, thighR: 0.85, kneeR: 1.05, footR: 0.2, hipY: 0.07, lean: 0.3, armL: 0.72, armR: -0.7, elbowL: 1.55, elbowR: 1.1, outL: 0.12, outR: 0.12, twist: -0.16, hipRotY: 0.1, headX: -0.13 })],
]);

// Injured right leg. The good leg takes a long, steady step; the bad leg lands short and
// careful, the body dips over it and the head drops as the weight arrives. The right hand
// holds the ribs, so that arm does not swing.
const RIBS = { armR: 0.32, outR: 0.3, elbowR: 1.75 };
export const LIMP = [
  [0.0, pose({ ...RIBS, thighL: 0.38, kneeL: 0.06, footL: 0.25, thighR: -0.2, kneeR: 0.3, footR: -0.12, hipY: -0.01, lean: 0.14, armL: -0.25, elbowL: 0.3, twist: 0.08 })],
  [0.18, pose({ ...RIBS, thighL: 0.2, kneeL: 0.28, thighR: -0.05, kneeR: 0.62, hipY: -0.035, hipRoll: 0.05, lean: 0.13, armL: -0.15 })],
  [0.38, pose({ ...RIBS, thighL: -0.1, kneeL: 0.06, thighR: 0.18, kneeR: 0.42, footR: 0.05, hipY: 0.02, hipRoll: 0.02, lean: 0.12, armL: 0.08 })],
  [0.55, pose({ ...RIBS, thighR: 0.22, kneeR: 0.02, footR: 0.1, thighL: -0.28, kneeL: 0.25, footL: -0.2, hipY: -0.02, lean: 0.2, headX: 0.12, spineRoll: -0.06, hipX: -0.02, armL: 0.18, elbowL: 0.4 })],
  [0.68, pose({ ...RIBS, thighR: 0.05, kneeR: 0.14, thighL: -0.1, kneeL: 0.85, hipY: -0.078, hipRoll: -0.08, spineRoll: -0.1, lean: 0.22, headX: 0.17, hipX: -0.03, armL: 0.12 })],
  [0.82, pose({ ...RIBS, thighR: -0.2, kneeR: 0.05, footR: -0.2, thighL: 0.3, kneeL: 0.5, hipY: 0.0, lean: 0.16, headX: 0.05, armL: -0.1 })],
];

// One long idle take, 14 s: weight shifts, a glance over the shoulder, a strap adjustment.
// Times are seconds; IDLE_PERIOD normalises them.
export const IDLE_PERIOD = 14;
const restL = { hipX: 0.03, hipRoll: 0.03, kneeR: 0.24, thighR: 0.08, footR: 0.05, spineRoll: -0.03 };
const restR = { hipX: -0.026, hipRoll: -0.025, kneeL: 0.2, thighL: 0.06, spineRoll: 0.025 };
export const IDLE = [
  [0, pose({})],
  [2.4, pose(restL)],
  [5.0, pose({ ...restL, armL: 0.0, headX: 0.04 })],
  [6.1, pose({ ...restL, headY: 0.75, twist: 0.1, neckX: -0.05 })],
  [7.4, pose({ ...restL, headY: 0.68, twist: 0.08 })],
  [8.2, pose({ ...restL })],
  [9.0, pose({ ...restL, armR: 0.45, outR: 0.18, elbowR: 2.1, headY: -0.15 })],
  [9.9, pose({ ...restL, armR: 0.5, outR: 0.2, elbowR: 2.2, headY: -0.12 })],
  [10.7, pose({ ...restL })],
  [12.0, pose(restR)],
].map(([s, p]) => [s / IDLE_PERIOD, p]);

// Out of breath after a long run: hands on knees, heaving. Period 0.9 s.
const bent = { lean: 0.58, hipY: -0.13, thighL: 0.32, thighR: 0.26, kneeL: 0.48, kneeR: 0.44, armL: 0.55, armR: 0.5, elbowL: 0.18, elbowR: 0.22, outL: 0.1, outR: 0.1, headX: -0.4 };
export const TIRED = [
  [0, pose(bent)],
  [0.45, pose({ ...bent, lean: 0.52, hipY: -0.115, headX: -0.34, elbowL: 0.24, elbowR: 0.28 })],
];

// Skid stop out of a run, 0.6 s, played once: brace the lead leg, lean back, arms out for
// balance, then settle.
export const SKID_LEN = 0.6;
export const SKID = [
  [0, pose({ lean: 0.3, thighL: 0.4, kneeL: 0.5, thighR: -0.4, kneeR: 0.8, armL: -0.4, armR: 0.4, elbowL: 1.2, elbowR: 1.2, hipY: -0.05 })],
  [0.15, pose({ lean: -0.14, thighL: 0.66, kneeL: 0.14, footL: 0.32, thighR: -0.18, kneeR: 0.95, hipY: -0.13, armL: 0.55, armR: 0.35, outL: 0.35, outR: 0.3, elbowL: 0.6, elbowR: 0.7, headX: 0.12 })],
  [0.33, pose({ lean: 0.1, hipY: -0.07, thighL: 0.32, kneeL: 0.22, thighR: -0.04, kneeR: 0.38, armL: 0.15, armR: 0.1, headX: 0.02 })],
  [0.6, pose({})],
].map(([t, p]) => [t / SKID_LEN, p]);

// ---------------------------------------------------------------- combat

// Two-handed pistol aim, upper body only: the gun arm straight out at shoulder height, the
// support hand cupping it across the chest, chin down to the sights. Blended over whatever the
// legs are doing, so the figure can walk or back-pedal while aiming.
export const AIM_CH = ['armL', 'armR', 'outL', 'outR', 'elbowL', 'elbowR', 'twist', 'neckX', 'headX', 'headY', 'spineRoll'];
export const AIM = pose({ armR: 1.5, elbowR: 0.04, outR: -0.08, armL: 1.3, elbowL: 0.62, outL: -0.5, twist: -0.22, headX: 0.08, headY: -0.12, neckX: 0.04, spineRoll: 0.02 });

// Hit flinch, 0.38 s, added on top of the current pose: the shot snaps the chest and head back,
// the arms jerk, a knee gives, then the body pitches forward and recovers.
export const HIT_LEN = 0.38;
export const HIT = [
  [0, pose({})],
  [0.07, pose({ lean: -0.3, headX: -0.32, pitch: -0.05, hipX: -0.03, armL: 0.32, outL: 0.28, elbowL: 0.7, armR: 0.2, outR: 0.18, kneeR: 0.3, thighR: -0.12 })],
  [0.2, pose({ lean: 0.2, headX: 0.22, hipY: -0.07, kneeL: 0.32, kneeR: 0.38, armL: 0.1, armR: 0.06 })],
  [0.38, pose({})],
].map(([t, p]) => [t / HIT_LEN, p]);

// Death, 1.1 s, played once and held: the shot snaps the body back, the knees buckle, the
// body tips backward and lands on its back, arms thrown out, one knee still raised.
export const DEATH_LEN = 1.1;
export const DEATH = [
  [0, pose({ lean: -0.32, headX: -0.34, armL: 0.6, armR: 0.45, outL: 0.4, outR: 0.4, elbowL: 0.6, elbowR: 0.5 })],
  [0.12, pose({ lean: -0.26, pitch: -0.14, hipY: -0.05, thighL: 0.3, kneeL: 0.42, thighR: -0.2, kneeR: 0.3, headX: -0.2, armL: 0.45, outL: 0.45, armR: 0.3, outR: 0.4, elbowL: 0.5 })],
  [0.36, pose({ lean: 0.3, pitch: -0.24, hipY: -0.46, thighL: 0.92, kneeL: 1.45, thighR: 0.72, kneeR: 1.25, headX: 0.32, armL: 0.2, outL: 0.25, armR: 0.15, outR: 0.2, elbowL: 0.4, elbowR: 0.4 })],
  [0.62, pose({ lean: -0.1, pitch: -1.0, hipY: -0.7, thighL: 0.9, kneeL: 1.0, thighR: 0.5, kneeR: 0.6, headX: -0.2, armL: 0.9, armR: 0.7, outL: 0.6, outR: 0.5, elbowL: 0.4 })],
  [0.84, pose({ pitch: -1.6, hipY: -0.85, thighL: 0.35, kneeL: 0.55, thighR: 0.1, kneeR: 0.2, headX: -0.32, armL: 0.35, armR: 0.3, outL: 1.15, outR: 1.0, elbowL: 0.5, elbowR: 0.4 })],
  [1.1, pose({ pitch: -1.54, hipY: -0.85, thighL: 0.28, kneeL: 0.42, thighR: 0.05, kneeR: 0.12, footL: -0.3, footR: -0.4, headX: -0.15, headY: 0.45, armL: 0.2, armR: 0.4, outL: 1.2, outR: 0.9, elbowL: 0.7, elbowR: 0.3 })],
].map(([t, p]) => [t / DEATH_LEN, p]);
