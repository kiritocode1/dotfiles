// A 3D figure shown as pixel art. Each frame the low-poly model is lit by the scene's own
// lights and rendered from the camera's direction into a tiny target, one pixel per texel
// at the scene's texel density. That image goes on a card at the figure's position, so it
// fogs, reflects, casts a shadow and defocuses like every other surface, but it can show
// its side on a yawed shot and turn around for real.
//
// The render ignores camera roll, so on a dutch shot the figure's pixel grid tilts with the
// walls instead of staying screen-aligned.
import * as THREE from 'three';
import { OUTFITS } from './outfits.js';
import { Ragdoll } from './ragdoll.js';
import { sample, NEUTRAL, WALK, RUN, LIMP, IDLE, IDLE_PERIOD, TIRED, SKID, SKID_LEN, AIM, AIM_CH, HIT, HIT_LEN, DEATH, DEATH_LEN } from './motion.js';

export const FIGURE_LAYER = 1;
const W_TX = 63, H_TX = 68;                 // target size in texels
// Facing angle from the camera axis. A full profile (PI/2) reads as a thin edge; side-scroller
// art shows a three-quarter view, chest turned partly toward the viewer.
const TURN = Math.PI / 2 - 0.5;

// Stride per gait cycle in world units: the cycle advances with distance, so feet do not slide.
const STRIDE = { walk: 1.4, run: 2.7, limp: 1.15 };
// Pose updates per second. Measured from REPLACED reference footage: characters change pose
// on every other 60 fps frame, about 30 drawings a second, while film grain changes every
// frame. 15 read as choppy next to it. 0 samples every frame.
const POSE_FPS = 30;

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: 0, flatShading: true,
  emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide });
const capsule = (r, len, m) => { const g = new THREE.CapsuleGeometry(r, len, 2, 7); g.translate(0, -len / 2 - r * 0.4, 0); return new THREE.Mesh(g, m); };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return new THREE.Mesh(g, m); };
const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; };

/** The courier, built facing +z with feet on y = 0. Returns the root and its joints. */
function buildCourier() {
  const M = {
    jacket: mat(0x8a7448), jacketD: mat(0x5c4c32), trouser: mat(0x34363e), boot: mat(0x1f1c1a, { r: 0.6 }),
    pack: mat(0x464b52, { r: 0.7 }), scarf: mat(0x9c3a30), tape: mat(0xd8d4c4, { r: 0.35 }), glove: mat(0x2a2624),
    skin: mat(0xb07f62), lens: mat(0x111417, { r: 0.15, e: 0x2fe6d2, ei: 0.35 }), led: mat(0x0d1f1c, { e: 0x3cffd0, ei: 2.5 }),
    hood: mat(0x7d6a42, { side: THREE.DoubleSide }),
  };
  const root = new THREE.Group();
  const J = {};
  J.hips = joint(root, 0, 0.98, 0);
  J.hips.add(box(0.34, 0.2, 0.22, M.trouser, 0, -0.02, 0));
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const th = J['thigh' + k] = joint(J.hips, 0.1 * sx, -0.05, 0);
    th.add(capsule(0.085, 0.36, M.trouser));
    const sh = J['shin' + k] = joint(th, 0, -0.46, 0);
    sh.add(capsule(0.07, 0.32, M.trouser));
    const ft = J['foot' + k] = joint(sh, 0, -0.42, 0);
    ft.add(box(0.13, 0.11, 0.27, M.boot, 0, -0.03, 0.045));
  }
  J.spine = joint(J.hips, 0, 0.06, 0);
  // jacket: an eight-sided tapered body, deeper front to back than a cylinder
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.62, 8), M.jacket);
  torso.geometry.translate(0, 0.28, 0); torso.scale.set(1, 1, 0.74); J.spine.add(torso);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.235, 0.2, 8), M.jacketD);
  hem.geometry.translate(0, -0.06, 0); hem.scale.set(1, 1, 0.78); J.spine.add(hem);
  J.pack = joint(J.spine, 0, 0.55, -0.14);                          // hangs from the straps
  J.pack.add(box(0.3, 0.38, 0.15, M.pack, 0, -0.19, -0.06));
  J.pack.add(box(0.04, 0.04, 0.02, M.led, 0.09, -0.08, -0.14));
  J.spine.add(box(0.05, 0.42, 0.04, M.pack, 0.12, 0.38, 0.13));      // shoulder straps
  J.spine.add(box(0.05, 0.42, 0.04, M.pack, -0.12, 0.38, 0.13));
  J.neck = joint(J.spine, 0, 0.6, 0);
  // the scarf wraps up to the jaw and the head sits down into it, so no gap shows between
  // them at 1 texel ~ 0.04 units (a floating head read as a thin stalk of a neck)
  const scarf = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.17, 8), M.scarf); scarf.position.y = 0.045; J.neck.add(scarf);
  J.head = joint(J.neck, 0, 0.045, 0);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.115, 1), M.skin); head.position.set(0, 0.13, 0.01); J.head.add(head);
  // hood: a sphere shell open at the face
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.155, 9, 7, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.78), M.hood);
  hood.position.set(0, 0.15, -0.015); J.head.add(hood);
  J.head.add(box(0.2, 0.045, 0.05, M.lens, 0, 0.165, 0.1));       // goggles
  // scarf tail: three segments that trail with speed
  J.tail = [];
  let par = joint(J.neck, 0.04, 0.0, -0.11);
  for (let i = 0; i < 3; i++) {
    par.add(box(0.07, 0.15, 0.025, M.scarf, 0, -0.07, 0));
    J.tail.push(par);
    par = joint(par, 0, -0.14, 0);
  }
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const ua = J['arm' + k] = joint(J.spine, 0.255 * sx, 0.55, 0);
    ua.add(capsule(0.066, 0.26, M.jacket));
    const fa = J['elbow' + k] = joint(ua, 0, -0.33, 0);
    fa.add(capsule(0.056, 0.22, M.jacket));
    const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.035, 7), M.tape); tape.position.y = -0.25; fa.add(tape);
    const hd = J['hand' + k] = joint(fa, 0, -0.31, 0);
    hd.add(box(0.075, 0.1, 0.085, M.glove, 0, -0.03, 0.005));
  }
  root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return { root, J };
}

/**
 * A pistol in the right hand. In the hand's frame the arm runs along -y and the back of the
 * hand faces +z, so with the arm raised the slide sits on top and the barrel points along the
 * arm; hanging, it points at the ground. Returns the muzzle marker.
 */
function addPistol(J) {
  const steel = mat(0x1d2024, { r: 0.35 }), grip = mat(0x2a2522, { r: 0.7 });
  const gun = new THREE.Group();
  gun.add(box(0.036, 0.19, 0.048, steel, 0, -0.075, 0.045));    // slide and barrel
  gun.add(box(0.03, 0.05, 0.095, grip, 0, -0.02, 0.0));          // grip, inside the fist
  gun.add(box(0.012, 0.03, 0.012, steel, 0, -0.04, -0.035));     // trigger guard
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, -0.175, 0.045); gun.add(muzzle);
  J.handR.add(gun);
  return { gun, muzzle };
}

export class Figure {
  static all = new Set();
  /** o.outfit: 'courier' (the first pass) or a key of OUTFITS. */
  constructor(tpu, o = {}) {
    const { root, J } = o.outfit && OUTFITS[o.outfit] ? OUTFITS[o.outfit]() : buildCourier();
    J.cloth ??= [];
    this.model = root; this.J = J;
    this.model.traverse((o) => o.layers.set(FIGURE_LAYER));

    this.rt = new THREE.WebGLRenderTarget(W_TX, H_TX, { type: THREE.HalfFloatType, samples: 0, depthBuffer: true });
    this.rt.texture.minFilter = this.rt.texture.magFilter = THREE.NearestFilter;
    this.rt.texture.generateMipmaps = false;

    const w = W_TX / tpu, h = H_TX / tpu;
    this.box = { left: -w / 2, right: w / 2, bottom: -0.13, top: h - 0.13 };   // around the feet
    this.cam = new THREE.OrthographicCamera(this.box.left, this.box.right, this.box.top, this.box.bottom, 0.1, 60);
    this.cam.layers.set(FIGURE_LAYER);

    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, (this.box.top + this.box.bottom) / 2, 0);
    const m = new THREE.MeshBasicMaterial({ map: this.rt.texture, alphaTest: 0.5, fog: true });
    // Darken texels on the silhouette edge, the same selective outline the painted sprites use.
    m.onBeforeCompile = (s) => {
      s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', /* glsl */ `
        #include <map_fragment>
        {
          vec2 px = 1.0 / vec2( textureSize( map, 0 ) );
          float n = texture2D( map, vMapUv + vec2( px.x, 0.0 ) ).a * texture2D( map, vMapUv - vec2( px.x, 0.0 ) ).a
                  * texture2D( map, vMapUv + vec2( 0.0, px.y ) ).a * texture2D( map, vMapUv - vec2( 0.0, px.y ) ).a;
          if ( n < 0.5 ) diffuseColor.rgb *= vec3( 0.66, 0.66, 0.72 );
        }`);
    };
    this.mesh = new THREE.Mesh(geo, m);
    this.mesh.castShadow = true;
    // the card's shadow pass needs the same cutout
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.rt.texture, alphaTest: 0.5 });

    // Character lights: seen only by the figure's render, never by the set. A low fill keeps
    // form readable in dark gaps between practicals, and a rim from behind the figure
    // (opposite the camera) cuts the silhouette out of the background.
    this.fill = new THREE.HemisphereLight(0x9ab4c0, 0x40342c, 2.4);
    this.rim = new THREE.DirectionalLight(0xbfe6f2, 7);
    this.rim.target = this.model;
    for (const l of [this.fill, this.rim]) { l.layers.set(FIGURE_LAYER); this.model.add(l); }
    this.rim.position.set(0, 0, 0);
    Figure.all.add(this);

    this.facing = 1; this.yaw = TURN;
    this.condition = 'normal';          // 'injured' swaps walk for the limp and slows the body
    this.t = 0; this.phase = 0; this.idleT = Math.random() * IDLE_PERIOD;
    this.speed = 0; this.prevSpeed = 0; this.peakSpeed = 0; this.fatigue = 0;
    this.skidT = -1; this.tired = false;
    // locomotion weights, eased with their own blend times
    this.w = { idle: 1, tired: 0, move: 0, skid: 0 };
    this.lean = { x: 0, v: 0 };          // acceleration lean, an underdamped spring
    this.pack = { x: 0, v: 0 };          // backpack bounce
    this.scarfS = { x: 0, v: 0 };        // scarf trail
    this.hipYPrev = 0;
    this.poseClock = 0; this.P = {}; this.sampled = {};
    this.pivot = new THREE.Vector3();

    // combat: aim blend, recoil spring, hit flinch and death clocks
    const { gun, muzzle } = addPistol(J);
    gun.traverse((m) => m.layers.set(FIGURE_LAYER));
    this.gun = gun; this.muzzle = muzzle; this.gun.visible = o.armed ?? true;
    this.aiming = false; this.wAim = 0;
    this.recoil = { x: 0, v: 0 };
    this.hitT = -1; this.deadT = -1; this.dead = false;
    this.rag = null;                     // a Ragdoll once killed; it owns the joints from then on
    // hit physics: the chest jolts back fast, the arms and head lag behind it and swing past
    this.jolt = { x: 0, v: 0 }; this.flail = { x: 0, v: 0 };
  }

  /** Fire: kicks the recoil spring. Returns the muzzle's world position. */
  shoot(out = new THREE.Vector3()) {
    this.recoil.v += 16;
    return this.muzzle.getWorldPosition(out);
  }
  /** A bullet landed: flinch on top of whatever the body is doing, arms thrown back. */
  hit(power = 1) {
    if (this.dead) return;
    this.hitT = 0; this.jolt.v -= 7 * power; this.flail.v += 15 * power;
  }
  /** Killed by a shot travelling along x in `dir`: the body goes limp and is thrown. */
  die(dir = -this.facing, power = 1) {
    if (this.dead) return;
    this.dead = true; this.deadT = 0; this.aiming = false; this.wAim = 0;
    this.rag = new Ragdoll(this, dir, power);
  }
  revive() { this.dead = false; this.deadT = -1; this.hitT = -1; this.rag = null; }

  // The game asks for a clip by speed band; the figure decides poses from speed itself.
  play() {}

  /** Advance pose. vx is the world speed along x; it drives stride phase, lean and fatigue. */
  update(dt, vx = 0) {
    this.t += dt;
    if (this.rag) { this.rag.update(dt); return; }
    const speed = Math.abs(vx), accel = (speed - this.prevSpeed) / Math.max(dt, 1e-4);
    this.prevSpeed = speed; this.speed = speed;
    const injured = this.condition === 'injured';

    // fatigue builds while running and drains while not; a long run ends out of breath
    this.fatigue = Math.min(1, Math.max(0, this.fatigue + dt * (speed > 3 ? 0.22 : -0.1)));
    this.peakSpeed = speed > 0.2 ? Math.max(this.peakSpeed * Math.exp(-dt * 0.5), speed) : this.peakSpeed;

    // a run that stops hard skids; then idle, or hands on knees if spent
    if (speed < 0.25 && this.prevMoving && this.peakSpeed > 3.2 && !injured) this.skidT = 0;
    this.prevMoving = speed >= 0.25;
    if (speed >= 0.25) this.skidT = -1, this.peakSpeed = Math.max(this.peakSpeed, speed);
    if (this.skidT >= 0) { this.skidT += dt; if (this.skidT > SKID_LEN) { this.skidT = -1; this.peakSpeed = 0; } }
    if (this.fatigue > 0.55 && speed < 0.25) this.tired = true;
    if (this.fatigue < 0.15 || speed >= 0.25) this.tired = false;

    const moving = speed >= 0.25, skidding = this.skidT >= 0;
    const target = { idle: !moving && !skidding && !this.tired ? 1 : 0, tired: !moving && !skidding && this.tired ? 1 : 0, move: moving ? 1 : 0, skid: skidding ? 1 : 0 };
    const rate = { idle: 2.2, tired: 2.5, move: 7, skid: 14 };   // per second; moving starts fast, settling is slow
    for (const k in this.w) this.w[k] += (target[k] - this.w[k]) * (1 - Math.exp(-dt * rate[k]));

    // gait: one shared phase, so walk and run blend with feet in step
    const runK = injured ? 0 : smooth(2.3, 3.8, speed);
    const stride = injured ? STRIDE.limp : STRIDE.walk + (STRIDE.run - STRIDE.walk) * runK;
    const back = vx * this.facing < -0.05 ? -1 : 1;              // back-pedalling plays the gait in reverse
    this.phase = (this.phase + back * speed * dt / stride + 1) % 1;
    this.wAim += ((this.aiming && !this.dead ? 1 : 0) - this.wAim) * (1 - Math.exp(-dt * (this.aiming ? 16 : 7)));
    if (this.hitT >= 0) { this.hitT += dt; if (this.hitT > HIT_LEN) this.hitT = -1; }
    if (this.deadT >= 0) this.deadT += dt;
    this.idleT += dt;

    // sample poses at POSE_FPS, so limbs hold like drawn frames while the body glides
    this.poseClock += dt;
    const step = POSE_FPS ? 1 / POSE_FPS : 0;
    if (!step || this.poseClock >= step || !this.P.thighL) {
      this.poseClock = step ? this.poseClock % step : 0;
      const S = this.sampled, P = this.P;
      for (const k in P) P[k] = 0;
      let sum = 0;
      const add = (pose, w) => { if (w < 1e-3) return; sum += w; for (const c in pose) P[c] = (P[c] || 0) + pose[c] * w; };
      if (this.w.move > 1e-3) {
        const gait = injured ? sample(LIMP, this.phase, true, S.limp ??= {}) : blendInto(S.gait ??= {}, sample(WALK, this.phase, true, S.walk ??= {}), sample(RUN, this.phase, true, S.run ??= {}), runK);
        add(gait, this.w.move);
      }
      add(sample(IDLE, this.idleT / IDLE_PERIOD, true, S.idle ??= {}), this.w.idle);
      add(sample(TIRED, this.t / 0.9, true, S.tired ??= {}), this.w.tired);
      if (this.skidT >= 0 || this.w.skid > 1e-3) add(sample(SKID, Math.max(0, this.skidT) / SKID_LEN, false, S.skid ??= {}), this.w.skid);
      for (const k in P) P[k] /= sum || 1;
      // upper body raises the gun over the gait; a flinch adds on top of everything
      if (this.wAim > 1e-3) for (const c of AIM_CH) P[c] += (AIM[c] - P[c]) * this.wAim;
      if (this.hitT >= 0) { const H = sample(HIT, this.hitT / HIT_LEN, false, S.hit ??= {}); for (const c in H) P[c] += H[c] - NEUTRAL[c]; }
      // dead: the fall replaces everything and holds its last pose
      if (this.deadT >= 0) sample(DEATH, this.deadT / DEATH_LEN, false, P);
      P.pitch ??= 0;
    }
    const P = this.P;

    // springs: lean overshoots on start and stop, the pack bounces with the hips, the scarf trails
    spring(this.lean, THREE.MathUtils.clamp(accel * 0.035, -0.3, 0.3), 60, 7, dt);
    const hipV = (P.hipY - this.hipYPrev) / Math.max(dt, 1e-4); this.hipYPrev = P.hipY;
    spring(this.pack, THREE.MathUtils.clamp(-hipV * 0.25 + speed * 0.04, -0.4, 0.4), 140, 9, dt);
    spring(this.scarfS, 0.15 + speed * 0.28, 30, 5, dt);
    const breath = Math.sin(this.t * (2.1 + this.fatigue * 5)) * (0.012 + this.fatigue * 0.03);

    const J = this.J;
    J.hips.position.set(P.hipX, 0.98 + P.hipY, 0);
    J.hips.rotation.set(P.pitch, P.hipRotY, P.hipRoll);
    J.spine.rotation.set(P.lean + this.lean.x, P.twist, P.spineRoll);
    J.spine.scale.set(1, 1 + breath * 0.5, 1 + breath);
    J.neck.rotation.set(P.neckX - this.lean.x * 0.5 - breath * 0.6, 0, 0);
    J.head.rotation.set(P.headX, P.headY, 0);
    J.thighL.rotation.x = -P.thighL; J.thighR.rotation.x = -P.thighR;
    J.shinL.rotation.x = P.kneeL; J.shinR.rotation.x = P.kneeR;
    J.footL.rotation.x = -P.footL; J.footR.rotation.x = -P.footR;
    J.armL.rotation.set(-P.armL, 0, P.outL); J.armR.rotation.set(-P.armR, 0, -P.outR);
    J.elbowL.rotation.x = -P.elbowL; J.elbowR.rotation.x = -P.elbowR;
    // recoil: the gun arm kicks up from the shoulder and wrist, the chest and head rock back
    spring(this.recoil, 0, 320, 17, dt);
    const rc = this.recoil.x * this.wAim;
    J.armR.rotation.x -= rc * 0.32; J.elbowR.rotation.x -= rc * 0.25; J.armL.rotation.x -= rc * 0.22;
    J.spine.rotation.x -= rc * 0.05; J.head.rotation.x -= rc * 0.08;
    // hit: chest snaps back; arms swing back and out and the head whips, a beat later
    spring(this.jolt, 0, 260, 15, dt); spring(this.flail, this.jolt.x * -1.4, 70, 6, dt);
    const jb = this.jolt.x, fl = this.flail.x;
    // jolt peaks near -0.35 rad, flail near 1.8: chest ~0.3 rad back, arms ~45 degrees back
    J.spine.rotation.x += jb * 0.9; J.head.rotation.x += jb * 0.5 - fl * 0.2;
    J.hips.position.z += jb * 0.1;
    J.armL.rotation.x += fl * 0.45; J.armR.rotation.x += fl * 0.45 * (1 - this.wAim * 0.6);
    J.armL.rotation.z += fl * 0.2; J.armR.rotation.z -= fl * 0.2;
    J.elbowL.rotation.x += fl * 0.2; J.elbowR.rotation.x += fl * 0.2;
    if (J.pack) J.pack.rotation.x = -this.pack.x * 0.6;
    if (J.ruff) J.ruff.rotation.x = this.pack.x * 0.15;
    // coat skirt: each panel swings outward by how far the legs, speed and hip sway push cloth
    // in its direction, on its own spring, so the hem flares and settles as one round shape
    if (J.cloth.length) {
      const legL = Math.sin(P.thighL) * 0.46, legR = Math.sin(P.thighR) * 0.46;   // knee travel, forward +
      const drag = speed * 0.07 + this.lean.x * 0.25;                               // air pushes the hem back
      for (const c of J.cloth) {
        const left = (1 + c.sx) / 2;
        const leg = legL * left + legR * (1 - left);
        // forward push from the leg on this side, backward drag, sideways sway from the hips
        const fwd = leg * 0.9 - drag, side = P.hipRoll * 0.5 + P.hipX * 1.5;
        const push = (fwd * c.cz + side * c.sx) / c.len;
        const want = Math.max(-0.02, 0.07 * c.flare + push);
        spring(c.s, want, 110, 8, dt);
        c.j.rotation.x = -c.s.x;
      }
    }
    if (J.tail) J.tail.forEach((s, i) => { s.rotation.x = -(this.scarfS.x * (0.7 + i * 0.3)) + Math.sin(this.t * (7 + i * 2) + i) * 0.06 * (0.3 + speed * 0.3); });

    // turn toward the facing direction as a real rotation, damped; the dead stay as they fell
    this.model.position.copy(this.mesh.position);
    if (this.dead) { this.model.updateMatrixWorld(true); return; }
    const want = this.facing > 0 ? TURN : -TURN;
    let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.yaw += d * (1 - Math.exp(-dt * (speed > 3 ? 14 : 9)));
    this.model.rotation.y = this.yaw;
    this.model.updateMatrixWorld(true);   // so the muzzle's world position is current for shots
  }

  /**
   * Render the model from the camera's direction into the target and orient the card.
   * Call once per frame before the main render.
   */
  render(renderer, scene, camera) {
    this.model.position.copy(this.mesh.position);
    // aim from the body's middle, frame around the feet, so the card and render share an origin
    this.pivot.copy(this.mesh.position); this.pivot.y += 1.0;
    const dir = camera.position.clone().sub(this.pivot).normalize();
    this.cam.position.copy(this.mesh.position).addScaledVector(dir, 20);
    this.cam.up.set(0, 1, 0);
    this.cam.lookAt(this.mesh.position);  // no roll: the card's pixel grid tilts with the world
    this.cam.updateMatrixWorld();
    this.mesh.quaternion.copy(this.cam.quaternion);
    // rim sits behind the figure relative to the camera, raised and off to one side
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    this.rim.position.copy(dir).multiplyScalar(-4).addScaledVector(side, 1.6 * this.facing).add(new THREE.Vector3(0, 3.2, 0));
    this.rim.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.model.rotation.y);   // rim lives in model space

    // only this figure (and its character lights) in its own render: another figure standing
    // within the small ortho frustum would otherwise be drawn into this one's card
    for (const f of Figure.all) f.model.visible = f === this;
    const fog = scene.fog, bg = scene.background, auto = renderer.shadowMap.autoUpdate;
    const prevRT = renderer.getRenderTarget(), prevClear = renderer.getClearAlpha(), prevColor = renderer.getClearColor(new THREE.Color());
    scene.fog = null; scene.background = null; renderer.shadowMap.autoUpdate = false;   // fog is applied by the card
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(scene, this.cam);
    renderer.setRenderTarget(prevRT); renderer.setClearColor(prevColor, prevClear);
    scene.fog = fog; scene.background = bg; renderer.shadowMap.autoUpdate = auto;
  }
}


const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function blendInto(out, a, b, k) { for (const c in a) out[c] = a[c] + (b[c] - a[c]) * k; return out; }
/** Damped spring toward target. k stiffness, c damping; under-damped values overshoot. */
function spring(s, target, k, c, dt) { s.v += ((target - s.x) * k - s.v * c) * dt; s.x += s.v * dt; }
