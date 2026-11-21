// Key-pose animation for the figure. A clip is a list of key poses at times; between keys the
// channels follow a Catmull-Rom curve, so motion eases through poses instead of swinging on a
// sine. Gait clips are one stride long with left heel contact at 0. Symmetric gaits author
// half a stride and mirror it; a limp authors the whole stride because its halves differ.
//
// Channels are radians unless noted. Positive limb angles swing forward; positive knee and
// elbow angles bend; foot positive lifts the toe; hipY and hipX are world units. pitch tips the
// whole body about the hips.

export const CHANNELS = ['hipX', 'hipY', 'hipRotY', 'hipRoll', 'lean', 'twist', 'spineRoll', 'neckX', 'headX', 'headY',
  'thighL', 'thighR', 'kneeL', 'kneeR', 'footL', 'footR', 'armL', 'armR', 'outL', 'outR', 'elbowL', 'elbowR', 'pitch',
  'wristL', 'wristR', 'yaw'];   // yaw: how far a turn has come, 0 to 1 (TURN clips only)

export const NEUTRAL = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
Object.assign(NEUTRAL, { kneeL: 0.06, kneeR: 0.06, armL: 0.04, armR: 0.04, outL: 0.07, outR: 0.07, elbowL: 0.25, elbowR: 0.25, lean: 0.03 });
const pose = (o) => ({ ...NEUTRAL, ...o });

const SWAP = { thighL: 'thighR', kneeL: 'kneeR', footL: 'footR', armL: 'armR', outL: 'outR', elbowL: 'elbowR', wristL: 'wristR' };
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

// Drawn timing. REPLACED's hero changes drawing 12 to 13 times a second, with holds of 2 to 6
// frames and 10 to 14 on key poses (research/density.md). Interpolating every frame makes every
// frame an in-between, which reads as 3D. So keys are extremes; in-betweens are placed between
// them at most GAP (7) frames apart, along the same curve, so the spacing keeps the ease; and each
// drawing is held until the next. keys.frames is a clip's nominal length in 60 fps frames; a
// clip without it, or ?timing=smooth (setSmooth), samples every frame as before.
const GAP = 7;
let SMOOTH = false;
export function setSmooth(v) { SMOOTH = !!v; }
const framed = (keys, frames) => Object.assign(keys, { frames });

function drawingTimes(keys, cyclic) {
  const cache = cyclic ? '_dtc' : '_dt';
  if (keys[cache]) return keys[cache];
  const n = keys.length, out = [];
  for (let i = 0; i < n; i++) {
    const t0 = keys[i][0], t1 = i + 1 < n ? keys[i + 1][0] : cyclic ? keys[0][0] + 1 : t0;
    const m = Math.max(1, Math.ceil(((t1 - t0) * keys.frames) / GAP - 1e-6));
    for (let k = 0; k < m; k++) out.push(t0 + ((t1 - t0) * k) / m);
  }
  return (keys[cache] = out);
}

/** The drawing showing at normalised time t: [index, the time it was drawn at]. */
export function drawingAt(keys, t, cyclic = true) {
  if (cyclic) t = ((t % 1) + 1) % 1; else t = Math.min(Math.max(t, keys[0][0]), keys[keys.length - 1][0]);
  if (!keys.frames || SMOOTH) return [0, t];
  const D = drawingTimes(keys, cyclic);
  let i = 0;
  while (i + 1 < D.length && D[i + 1] <= t + 1e-9) i++;
  return [i, D[i]];
}

/** Sample keys at normalised time t. cyclic wraps; otherwise clamps at the ends. */
export function sample(keys, t, cyclic = true, out = {}) {
  const n = keys.length;
  if (keys.frames && !SMOOTH) t = drawingAt(keys, t, cyclic)[1];
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
framed(IDLE, IDLE_PERIOD * 60);

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
framed(SKID, SKID_LEN * 60);

// Nominal cycle lengths for the drawn timing, in frames at the speeds the game moves at: a walk
// stride of 1.4 m at 1.7 m/s, a run stride of 2.7 m at 4.6 m/s, the limp's 1.15 m at 1.05 m/s.
// The walk then shows about 10 drawings a stride and the run about 8, each held 4 to 8 frames.
framed(WALK, 49); framed(RUN, 35); framed(LIMP, 66); framed(TIRED, 54);

/**
 * A clip authored as drawings: [[holdFrames, pose], ...], each pose held for its frames. Returns
 * keys in the usual [t, pose] form with keys.frames set, so in-betweens are only added where a
 * hold is longer than GAP.
 */
function drawings(list) {
  const total = list.reduce((a, [f]) => a + f, 0);
  let at = 0;
  const keys = list.map(([f, p]) => { const k = [at / total, pose(p)]; at += f; return k; });
  keys.push([1, keys[keys.length - 1][1]]);
  return framed(keys, total);
}

// Walk turnaround, facing right to facing left, 19 frames. She turns toward the camera, so we see
// her front as she comes round; the head leads, then the shoulders, then the hips, and the feet
// re-plant. yaw is how far round the body is, 0 to 1. The last drawing is the walk's contact pose
// at phase 0.5, so the walk picks up from it with no pop (TURN_LEFT.endPhase).
//   1  brake      3 f  the lead foot plants, the body checks back over it, the head turns first
//   2  pivot      4 f  weight on the planted foot, shoulders come round ahead of the hips, the
//                      trailing foot leaves the ground, arms float out for balance
//   3  square     4 f  chest to the camera, lowest point of the turn, the free foot swings through
//   4  step out   4 f  the new lead leg reaches out the other way, the body leans into it
//   5  contact    4 f  back in the walk, opposite foot forward
export const TURN_LEFT = drawings([
  [3, { thighL: 0.3, kneeL: 0.1, footL: 0.15, thighR: -0.28, kneeR: 0.3, footR: -0.2, lean: -0.05, hipY: -0.02, headY: -0.55, neckX: 0.02, twist: -0.05, armL: -0.15, armR: 0.2, elbowL: 0.3, elbowR: 0.4, yaw: 0 }],
  [4, { thighL: 0.12, kneeL: 0.35, thighR: 0.05, kneeR: 0.6, footR: 0.1, lean: 0.02, hipY: -0.06, twist: -0.22, hipRotY: -0.1, headY: -0.45, armL: 0.05, armR: -0.05, elbowL: 0.5, elbowR: 0.5, outL: 0.16, outR: 0.16, yaw: 0.3 }],
  [4, { thighL: -0.05, kneeL: 0.3, thighR: 0.25, kneeR: 0.55, footR: 0.15, lean: 0.04, hipY: -0.07, hipRoll: 0.04, twist: -0.15, headY: -0.25, outL: 0.2, outR: 0.2, elbowL: 0.6, elbowR: 0.6, yaw: 0.55 }],
  [4, { thighR: 0.38, kneeR: 0.15, footR: 0.25, thighL: -0.25, kneeL: 0.3, footL: -0.1, lean: 0.08, hipY: -0.03, twist: 0.05, armL: 0.25, armR: -0.25, elbowL: 0.35, elbowR: 0.3, yaw: 0.85 }],
  [4, { ...mirror(WALK[0][1]), yaw: 1 }],
]);
TURN_LEFT.endPhase = 0.5;
/** The same turn the other way, facing left to facing right; it ends on the walk at phase 0. */
export const TURN_RIGHT = framed(TURN_LEFT.map(([t, p]) => [t, { ...mirror(p), yaw: p.yaw }]), TURN_LEFT.frames);
TURN_RIGHT.endPhase = 0;

// ---------------------------------------------------------------- pistol

// Two-handed pistol aim, upper body only: the gun arm straight out at shoulder height, the
// support hand cupping it across the chest, chin down to the sights. Blended over whatever the
// legs are doing, so the figure can walk or back-pedal while aiming.
export const AIM_CH = ['armL', 'armR', 'outL', 'outR', 'elbowL', 'elbowR', 'twist', 'neckX', 'headX', 'headY', 'spineRoll', 'wristL', 'wristR'];
export const AIM = pose({ armR: 1.5, elbowR: 0.04, outR: -0.08, armL: 1.3, elbowL: 0.62, outL: -0.5, twist: -0.22, headX: 0.08, headY: -0.12, neckX: 0.04, spineRoll: 0.02 });

// Low ready: after the shooting stops she keeps the gun out, muzzle at the street a step ahead,
// support hand still on it, for a couple of seconds before it goes back down. Upper body only,
// like AIM. The muzzle points only at what she means to hit or at the ground (performance.md W2).
export const READY = pose({ armR: 0.62, elbowR: 0.3, outR: -0.04, armL: 0.42, elbowL: 1.05, outL: -0.36, twist: -0.12, headX: 0.06, headY: -0.05, spineRoll: 0.01, wristR: -0.1 });

// Draw, 0.27 s (states.md: 7 drawings over 16 frames). Absolute AIM_CH targets, sampled by the
// time since the aim started. The gun comes up close to the body with the elbow bent, punches out,
// overshoots past the sights by a hair and settles. No flourish. Anticipation is one drawing,
// because the player is waiting on it (Cooper, states.md).
export const DRAW_LEN = 0.27;
export const DRAW = secs(DRAW_LEN, [
  [0, { ...READY, armR: 0.3, elbowR: 0.95, armL: 0.2, elbowL: 0.7, outL: -0.1 }],
  [0.07, { armR: 0.78, elbowR: 1.45, outR: -0.14, armL: 0.62, elbowL: 1.35, outL: -0.4, twist: -0.16, headX: 0.04, headY: -0.1, wristR: 0.2 }],
  [0.15, { armR: 1.36, elbowR: 0.42, outR: -0.1, armL: 1.12, elbowL: 0.95, outL: -0.48, twist: -0.22, headX: 0.08, headY: -0.12, neckX: 0.03, wristR: 0.05 }],
  [0.21, { armR: 1.58, elbowR: 0.0, outR: -0.08, armL: 1.36, elbowL: 0.56, outL: -0.5, twist: -0.25, headX: 0.1, headY: -0.12, neckX: 0.04, spineRoll: 0.02, wristR: -0.04 }],
  [0.27, AIM],
]);

// One shot, 0.22 s, added on top of the aim (performance.md, shoot: holds 1,2,2,3,3,3). Values
// are offsets from the aim pose. Beat 1 is the flash frame: the shoulders drive back and the
// wrist flips. Beat 2 is the recoil peak and the flinch, the head turning away from her own shot,
// which is the character. Then the barrel dips under the line, recovers and settles. No rock
// back like an action hero.
const ZERO = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
const delta = (len, keys) => framed(keys.map(([s, p]) => [s / len, { ...ZERO, ...p }]), len * 60);
export const SHOT_LEN = 0.22;
export const SHOT = delta(SHOT_LEN, [
  // muzzle rise at the peak is arm + elbow + wrist, about 0.38 rad (22 degrees): a pistol flips,
  // it does not throw the hand over the head
  [0, { armR: 0.07, wristR: 0.15, lean: -0.035, headX: -0.05, twist: 0.03, armL: 0.05, wristL: 0.06 }],
  [0.035, { armR: 0.12, elbowR: 0.06, wristR: 0.2, lean: -0.06, headX: -0.09, headY: 0.09, neckX: -0.03, twist: 0.05, spineRoll: 0.02, armL: 0.09, elbowL: 0.06, wristL: 0.09 }],
  [0.085, { armR: -0.04, elbowR: 0.02, wristR: -0.05, lean: -0.02, headX: -0.03, headY: 0.04, armL: -0.03 }],
  [0.14, { armR: 0.02, wristR: 0.015, lean: 0.005, headY: 0.01 }],
  [0.22, {}],
]);

/**
 * The aim held, not frozen (performance.md, aim_idle): a slow sway from breathing and the weight
 * of the arm, and every few seconds the barrel sags under the line and is pulled back up, the
 * effort of holding it. Offsets for AIM_CH at time t.
 */
export function aimLife(t, out) {
  const ph = (t % 3.7) / 0.7, dip = ph < 1 ? Math.sin(Math.PI * ph) : 0;
  out.armR = 0.016 * Math.sin(t * 1.3) + 0.008 * Math.sin(t * 3.1 + 1) - 0.07 * dip;
  out.armL = 0.012 * Math.sin(t * 1.3 + 0.4) - 0.05 * dip;
  out.twist = 0.01 * Math.sin(t * 0.9);
  out.headX = 0.01 * Math.sin(t * 1.3 + 0.8) + 0.025 * dip;
  out.wristR = -0.03 * dip;
  return out;
}

// ---------------------------------------------------------------- hits and deaths
//
// Keyed performances played through Figure.perform(keys, len). Times are seconds, normalised
// by the clip length. They follow the direction rules in plan.md: a hit gets no anticipation;
// a shot person does not fly back, reacts late, tries to stay up, and falls the way the weight
// goes. hipY for a body on the ground is measured from the 0.925 m hip height Januwu stands at.

// a declaration, so the pistol clips above can use it too
function secs(len, keys) { return framed(keys.map(([s, p]) => [s / len, pose(p)]), len * 60); }

// Hit in the chest, not fatal, 0.5 s: the shoulders jolt back, the head snaps, the gun hand
// pulls in to the hip, then the body comes forward again over the feet.
export const HIT_LEN = 0.5;
export const HIT = secs(HIT_LEN, [
  [0, { lean: -0.12, headX: -0.22, twist: 0.22, armR: 0.25, elbowR: 0.9, armL: 0.3, elbowL: 0.7, outL: 0.15, hipY: -0.01 }],
  [0.1, { lean: -0.06, headX: -0.1, twist: 0.16, armR: 0.2, elbowR: 0.8, armL: 0.25, elbowL: 0.9, hipY: -0.03, kneeL: 0.2, kneeR: 0.2 }],
  [0.3, { lean: 0.12, headX: 0.1, twist: 0.04, hipY: -0.05, kneeL: 0.3, kneeR: 0.25, armR: 0.1, elbowR: 0.5 }],
  [0.5, {}],
]);

// Shot in the front and killed, 2.3 s. She does not know at first: a small jolt, a look down at
// the wound with a hand to it, a step to stay up, then the knees go. A held beat on the knees,
// the near hand reaching for the ground, and she falls forward onto her face. Ends lying still.
export const DEATH_FRONT_LEN = 2.3;
const kneel = { thighL: 0.05, thighR: 0.12, kneeL: 1.55, kneeR: 1.5, footL: -0.6, footR: -0.6, hipY: -0.45 };
export const DEATH_FRONT = secs(DEATH_FRONT_LEN, [
  [0, { lean: -0.08, headX: -0.18, armR: 0.3, elbowR: 0.7, armL: 0.2, elbowL: 0.5 }],
  [0.15, { lean: 0.08, headX: 0.3, armL: 0.55, outL: -0.35, elbowL: 2.0, armR: 0.15, elbowR: 0.6, hipY: -0.02 }],
  [0.4, { lean: 0.2, headX: 0.25, thighR: 0.32, kneeR: 0.35, thighL: -0.1, kneeL: 0.25, armL: 0.55, outL: -0.35, elbowL: 2.0, armR: 0.05, hipY: -0.06 }],
  [0.62, { lean: 0.3, headX: 0.3, thighL: 0.5, thighR: 0.45, kneeL: 1.1, kneeR: 1.15, hipY: -0.3, armL: 0.5, outL: -0.3, elbowL: 1.9, armR: 0.1, elbowR: 0.4 }],
  [0.85, { ...kneel, lean: 0.32, headX: 0.38, armL: 0.45, outL: -0.3, elbowL: 1.8, armR: 0.0, elbowR: 0.3 }],
  [1.25, { ...kneel, hipY: -0.46, lean: 0.4, headX: 0.42, armL: 0.4, outL: -0.25, elbowL: 1.6, armR: 0.05, elbowR: 0.35 }],
  [1.6, { thighL: 0.0, thighR: 0.05, kneeL: 1.0, kneeR: 0.9, footL: -0.5, footR: -0.5, pitch: 0.8, hipY: -0.6, lean: 0.35, headX: -0.1, armL: 1.3, elbowL: 0.4, armR: 1.1, elbowR: 0.5 }],
  [1.9, { thighL: 0.0, thighR: 0.08, kneeL: 0.15, kneeR: 0.3, footL: -0.6, footR: -0.6, pitch: 1.5, hipY: -0.8, lean: 0.02, headX: -0.35, headY: 0.8, armL: 0.6, outL: 0.3, elbowL: 0.9, armR: 0.2, outR: 0.4, elbowR: 0.3 }],
  [2.05, { thighL: 0.0, thighR: 0.08, kneeL: 0.12, kneeR: 0.28, footL: -0.6, footR: -0.6, pitch: 1.52, hipY: -0.79, lean: 0.03, headX: -0.3, headY: 0.85, armL: 0.6, outL: 0.32, elbowL: 0.95, armR: 0.2, outR: 0.42, elbowR: 0.3 }],
  [2.3, { thighL: 0.0, thighR: 0.08, kneeL: 0.12, kneeR: 0.28, footL: -0.6, footR: -0.6, pitch: 1.52, hipY: -0.8, lean: 0.03, headX: -0.3, headY: 0.85, armL: 0.6, outL: 0.32, elbowL: 0.95, armR: 0.2, outR: 0.42, elbowR: 0.3 }],
]);

// Hit high on the gun-side shoulder, 0.55 s: the shot turns the shoulders away, the gun arm
// swings out and down, a half step back on the near foot to catch the turn, then square up.
export const HIT_SPIN_LEN = 0.55;
export const HIT_SPIN = secs(HIT_SPIN_LEN, [
  [0, { twist: 0.45, spineRoll: 0.08, headY: 0.3, headX: -0.12, armR: -0.15, outR: 0.45, elbowR: 0.4, armL: 0.25, elbowL: 0.8 }],
  [0.12, { twist: 0.38, spineRoll: 0.06, headY: 0.2, thighR: -0.25, kneeR: 0.3, thighL: 0.1, hipY: -0.04, armR: -0.05, outR: 0.3, elbowR: 0.6, armL: 0.35, elbowL: 1.1 }],
  [0.32, { twist: 0.12, headY: 0.05, thighR: -0.12, kneeR: 0.2, hipY: -0.03, armR: 0.1, elbowR: 0.5 }],
  [0.55, {}],
]);

// Killed by a shot that turns the body, 2.0 s: the twist carries on, the far knee folds, he
// turns down into it and drops onto his side. Ends on the side, the top arm across the body.
export const DEATH_SIDE_LEN = 2.0;
const onSide = { hipRoll: 1.42, hipY: -0.76, thighL: 0.45, kneeL: 0.6, thighR: 0.25, kneeR: 0.9, footL: -0.3, footR: -0.3, lean: 0.15, twist: 0.1, headX: 0.15, headY: 0.2, spineRoll: -0.1, armL: 0.8, outL: -0.2, elbowL: 0.6, armR: 0.3, outR: 0.6, elbowR: 0.5 };
export const DEATH_SIDE = secs(DEATH_SIDE_LEN, [
  [0, { twist: 0.4, headY: 0.35, headX: -0.15, armR: -0.1, outR: 0.4, elbowR: 0.5, armL: 0.3, elbowL: 0.9 }],
  [0.25, { twist: 0.55, headY: 0.4, spineRoll: 0.12, thighL: 0.1, kneeL: 0.5, hipY: -0.06, armR: 0.05, outR: 0.5, elbowR: 0.4, armL: 0.35, elbowL: 1.2 }],
  [0.6, { twist: 0.5, headY: 0.3, headX: 0.2, spineRoll: 0.2, hipRoll: 0.25, thighL: 0.5, kneeL: 1.3, thighR: 0.2, kneeR: 0.6, hipY: -0.38, lean: 0.3, armR: 0.2, outR: 0.6, elbowR: 0.4, armL: 0.6, elbowL: 1.0 }],
  [0.95, { twist: 0.3, headX: 0.3, hipRoll: 0.9, hipY: -0.62, thighL: 0.5, kneeL: 1.0, thighR: 0.3, kneeR: 0.9, lean: 0.3, spineRoll: 0.05, armR: 0.5, outR: 0.9, elbowR: 0.4, armL: 0.9, elbowL: 0.7 }],
  [1.2, { ...onSide, hipY: -0.78, headX: 0.25 }],
  [1.35, { ...onSide }],
  [2.0, { ...onSide }],
]);

// Killed walking in, 2.2 s: the legs go first, he sits down hard on the street, holds a beat
// upright with the gun hand dropping to the ground, then the torso goes back. Ends on his back,
// knees up a little. Sitting and lying, pitch and thigh trade: thigh minus pitch keeps the legs
// along the ground.
export const DEATH_BACK_LEN = 2.2;
export const DEATH_BACK = secs(DEATH_BACK_LEN, [
  [0, { lean: -0.06, headX: -0.15, armR: 0.3, elbowR: 0.6, armL: 0.2, elbowL: 0.6 }],
  [0.2, { lean: 0.06, headX: 0.2, kneeL: 0.5, kneeR: 0.45, thighL: 0.3, thighR: 0.25, hipY: -0.14, armR: 0.2, elbowR: 0.5, armL: 0.4, outL: -0.3, elbowL: 1.8 }],
  [0.45, { lean: 0.25, headX: 0.25, thighL: 1.0, thighR: 0.95, kneeL: 1.4, kneeR: 1.3, hipY: -0.6, armR: 0.3, outR: 0.2, elbowR: 0.4, armL: 0.5, outL: -0.3, elbowL: 1.7 }],
  [0.62, { lean: 0.15, headX: 0.3, thighL: 1.45, thighR: 1.4, kneeL: 0.6, kneeR: 0.8, footL: 0.3, footR: 0.3, hipY: -0.83, armR: 0.2, outR: 0.35, elbowR: 0.3, armL: 0.45, outL: -0.3, elbowL: 1.6 }],
  [0.7, { lean: 0.22, headX: 0.38, thighL: 1.45, thighR: 1.4, kneeL: 0.6, kneeR: 0.8, footL: 0.3, footR: 0.3, hipY: -0.85, armR: 0.15, outR: 0.4, elbowR: 0.3, armL: 0.45, outL: -0.3, elbowL: 1.6 }],
  [1.2, { lean: 0.12, headX: 0.42, thighL: 1.42, thighR: 1.38, kneeL: 0.65, kneeR: 0.85, footL: 0.3, footR: 0.3, hipY: -0.85, armR: 0.1, outR: 0.45, elbowR: 0.25, armL: 0.4, outL: -0.25, elbowL: 1.5 }],
  // on his back, "forward" points at the sky, so the arms lie along the ground with out, not arm
  [1.55, { pitch: -0.8, lean: -0.1, headX: 0.5, thighL: 0.75, thighR: 0.7, kneeL: 0.7, kneeR: 0.9, footL: 0.2, footR: 0.2, hipY: -0.86, armR: 0.25, outR: 0.6, elbowR: 0.3, armL: 0.3, outL: 0.35, elbowL: 0.7 }],
  [1.8, { pitch: -1.48, lean: 0.0, headX: 0.25, headY: -0.5, thighL: 0.25, thighR: 0.05, kneeL: 0.55, kneeR: 0.2, footL: 0.1, footR: 0.0, hipY: -0.86, armR: -0.05, outR: 0.95, elbowR: 0.25, armL: 0.05, outL: 0.55, elbowL: 0.7 }],
  [1.95, { pitch: -1.45, lean: 0.0, headX: 0.2, headY: -0.55, thighL: 0.25, thighR: 0.05, kneeL: 0.55, kneeR: 0.2, footL: 0.1, hipY: -0.85, armR: -0.05, outR: 0.98, elbowR: 0.22, armL: 0.05, outL: 0.58, elbowL: 0.68 }],
  [2.2, { pitch: -1.45, lean: 0.0, headX: 0.2, headY: -0.55, thighL: 0.25, thighR: 0.05, kneeL: 0.55, kneeR: 0.2, footL: 0.1, hipY: -0.85, armR: -0.05, outR: 0.98, elbowR: 0.22, armL: 0.05, outL: 0.58, elbowL: 0.68 }],
]);

/** Variants per performance, picked at random each time one plays. [keys, seconds]. */
export const HITS = [[HIT, HIT_LEN], [HIT_SPIN, HIT_SPIN_LEN]];
export const DEATHS = [[DEATH_FRONT, DEATH_FRONT_LEN], [DEATH_SIDE, DEATH_SIDE_LEN], [DEATH_BACK, DEATH_BACK_LEN]];
