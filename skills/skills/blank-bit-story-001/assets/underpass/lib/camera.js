// Camera director. The level is split into shots; walking into a shot's range blends the
// camera into its framing. Moments sit on top: each has a trigger read from the game each
// frame, the framing values it sets, an ease in, a minimum hold and an ease out, so the frame
// changes because of what is happening, not only where the hero stands. Beats layer
// short-lived roll, punch-in and shake on top of both. Sprites face the camera each frame.
import * as THREE from 'three';

/**
 * A shot frames a point near the hero.
 *   dist     distance from focus to camera
 *   height   camera height above the floor
 *   focusY   height of the look-at point
 *   yaw      degrees around Y; 0 looks straight down -z, positive swings the camera to +x
 *   roll     degrees, dutch tilt around the view axis
 *   fov      vertical field of view in degrees
 *   lead     world units of look-ahead in the facing direction
 *   blend    seconds to ease in from the previous framing
 */
export const SHOT_DEFAULTS = { dist: 22, height: 3.3, focusY: 2.6, yaw: 0, roll: 0, fov: 26, lead: 1.8, blend: 1.4 };
const KEYS = ['dist', 'height', 'focusY', 'yaw', 'roll', 'fov', 'lead'];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Director {
  constructor(camera, shots) {
    this.camera = camera;
    this.shots = shots.map((s) => ({ ...SHOT_DEFAULTS, ...s }));
    this.cur = { ...SHOT_DEFAULTS };
    this.from = { ...SHOT_DEFAULTS };
    this.to = this.shots[0];
    this.blendT = 1;
    this.followX = 0;
    this.beats = [];
    this.shake = 0;
    this.active = null;
    this.moments = [];
    this.time = 0;
  }

  /**
   * A moment. id, priority (higher wins per value), set (framing values), when(ctx) -> bool,
   * in and out (seconds to ease), minHold (seconds it stays once started).
   */
  addMoment(m) {
    this.moments.push({ priority: 0, in: 1, out: 1, minHold: 0, ...m, w: 0, live: false, t: 0, until: -1 });
    this.moments.sort((a, b) => a.priority - b.priority);
  }

  /** Force a moment on for `hold` seconds, for one-shot events. */
  trigger(id, hold = 0.25) {
    const m = this.moments.find((x) => x.id === id);
    if (m) m.until = this.time + hold;
  }

  /** The moments currently weighing on the frame, for the test hook. */
  live() { return this.moments.filter((m) => m.w > 0).map((m) => `${m.id}:${m.w.toFixed(2)}`); }

  shotFor(x) {
    return this.shots.find((s) => x >= (s.x0 ?? -Infinity) && x < (s.x1 ?? Infinity)) ?? this.shots[0];
  }

  /** Temporary overlay. kind: 'roll' (degrees), 'punch' (fov degrees, negative zooms in), 'shake' (world units). */
  beat(kind, amount, duration = 0.35) { this.beats.push({ kind, amount, duration, t: 0 }); }

  snap(x) {
    const s = this.shotFor(x);
    this.active = s; this.to = s; Object.assign(this.cur, s); Object.assign(this.from, s); this.blendT = 1; this.followX = x;
    for (const m of this.moments) { m.w = 0; m.live = false; m.until = -1; }
  }

  update(dt, heroX, facing, still = false, ctx = {}) {
    this.time += dt;
    const s = this.shotFor(heroX);
    if (s !== this.active) {
      this.active = s; Object.assign(this.from, this.cur); this.to = s; this.blendT = 0;
    }
    this.blendT = Math.min(1, this.blendT + dt / Math.max(0.001, this.to.blend));
    const k = ease(this.blendT);
    for (const key of KEYS) this.cur[key] = this.from[key] + (this.to[key] - this.from[key]) * k;

    // moments, lowest priority first, so a higher one overrides the values it sets
    const v = this.view = { ...this.cur };
    for (const m of this.moments) {
      const on = (m.when ? m.when(ctx) : false) || m.until > this.time;
      if (on && !m.live) { m.live = true; m.t = 0; }
      m.t += dt;
      if (m.live && !on && m.t >= m.minHold) m.live = false;
      const rate = m.live ? 1 / Math.max(0.001, m.in) : -1 / Math.max(0.001, m.out);
      m.w = Math.min(1, Math.max(0, m.w + dt * rate));
      if (m.w > 0) { const e = ease(m.w); for (const key in m.set) v[key] += (m.set[key] - v[key]) * e; }
    }

    // follow with a dead zone, so small steps do not drag the frame
    const target = heroX + v.lead * facing;
    const dz = 0.6, d = target - this.followX;
    if (Math.abs(d) > dz) this.followX += (d - Math.sign(d) * dz) * (1 - Math.exp(-dt * 2.6));

    let roll = v.roll, fov = v.fov, shake = 0;
    this.beats = this.beats.filter((b) => {
      b.t += dt;
      const p = b.t / b.duration;
      if (p >= 1) return false;
      const env = Math.sin(Math.PI * Math.min(1, p * 2.2)) * (1 - p);   // fast attack, slow release
      if (b.kind === 'roll') roll += b.amount * env;
      if (b.kind === 'punch') fov += b.amount * env;
      if (b.kind === 'shake') shake += b.amount * (1 - p);
      return true;
    });
    if (still) shake = 0;

    const F = new THREE.Vector3(this.followX, v.focusY, 0);
    const yaw = THREE.MathUtils.degToRad(v.yaw);
    const cam = this.camera;
    cam.position.set(F.x + Math.sin(yaw) * v.dist, v.height, F.z + Math.cos(yaw) * v.dist);
    if (shake) cam.position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
    cam.up.set(0, 1, 0);
    cam.lookAt(F);
    cam.rotateZ(THREE.MathUtils.degToRad(roll));
    if (Math.abs(cam.fov - fov) > 1e-4) { cam.fov = fov; cam.updateProjectionMatrix(); }
    this.focus = F;
  }
}

/** Turn a quad about Y to face the camera, keeping its feet planted. */
export function faceCamera(mesh, camera) {
  mesh.rotation.y = Math.atan2(camera.position.x - mesh.position.x, camera.position.z - mesh.position.z);
}
