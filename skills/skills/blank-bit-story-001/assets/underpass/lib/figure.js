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
import { addTech, TECH } from './tech.js';
import { sample, drawingAt, setSmooth, WALK, RUN, LIMP, IDLE, IDLE_PERIOD, TIRED, AIM_CH, READY, DRAW, DRAW_LEN, SHOT, SHOT_LEN, TURN_LEFT, TURN_RIGHT, aimLife,
  TURN_RUN_LEFT, TURN_RUN_RIGHT, START_WALK, START_RUN, RUN_PUSH, STOP_WALK, SKID, HOLSTER, HOLSTER_LEN, HIT, HIT_LEN, HIT_WALK, HIT_WALK_LEN, HIT_AIM, HIT_AIM_LEN, UPPER } from './motion.js';

export const FIGURE_LAYER = 1;
const W_TX = 63, H_TX = 68;                 // target size in texels at the scene's density
const DENSITY = 2;                          // figure texels per scene texel, along each axis
// Facing angle from the camera axis. A full profile (PI/2) reads as a thin edge; side-scroller
// art shows a three-quarter view, chest turned partly toward the viewer.
const TURN = Math.PI / 2 - 0.5;
const AIM_TURN = Math.PI / 2 - 0.12;        // aiming: nearly full profile, as REPLACED aims

// Stride per gait cycle in world units: the cycle advances with distance, so feet do not slide.
const STRIDE = { walk: 1.4, run: 2.7, limp: 1.15 };
// Drawn timing (research/density.md): the body changes only when a clip's drawing changes,
// about 12 to 14 times a second with varied holds, and everything that moves the body (springs,
// breath, bullet jolts, the turn, the cloth) is written on those changes too. Between them the
// figure holds still while it glides across the street, as a sprite does. A drawing holds at
// least MIN_HOLD; with nothing changing (a slow weight shift, the aim's sway) a new drawing comes
// at most MAX_HOLD later. ?timing=smooth restores the old timing for comparison: poses sampled
// 30 times a second on a curve, springs every frame, the turn as a damped spin.
// LAYER_HOLD: while an upper-body layer (a hit while moving, the gun going down) plays over the
// legs, the two layers' drawings fall out of step and together changed the body every 2 to 3
// frames; a change then waits until the drawing has held this long, so near changes merge.
const POSE_FPS = 30;
const MIN_HOLD = 1.9 / 60, MAX_HOLD = 12 / 60, LAYER_HOLD = 3.9 / 60;
// Inner outline threshold in metres of depth between neighbouring texels (a texel is ~0.04 m).
const EDGE_GAP = 0.07;
// Arm follow-through. The forearm hangs from the elbow and the hand from the wrist, each a
// damped spring chasing the keyed angle, so they trail the shoulder's swing and overshoot when
// it turns back, instead of swinging locked to the upper arm like a lever. Under-damped:
// zeta = c / (2 sqrt k) is about 0.6. The lag is a layer over the keyed elbow, which already
// bends most at the front of the swing as a real walk does; a softer forearm spring (k 95)
// lagged so far it locked the elbow straight for half the cycle.
const FORE = { k: 240, c: 19 }, HAND = { k: 170, c: 14 };
const ELBOW_MIN = 0.16;         // about 9 degrees: a hanging arm is never locked straight
const WRIST_REST = 0.18;        // a relaxed hand flexes a little forward of the forearm
// After the last aim the gun stays out at low ready this long, unless she runs.
const READY_HOLD = 2.2;
// A body that has lain still this long stops simulating its cloth: it has settled on the street.
const CLOTH_SLEEP = 2.5;

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
// The gun has to read at game scale, where a texel is about 2 cm. Near-black matte steel was the
// value of her hair, the coats and the shadows, so the gun vanished into the hand. Worn gunmetal
// one step lighter, a polished top edge one texel thick that catches whatever lamp is near, and
// a size about 1.2x real (a pixel artist exaggerates the prop the scene is about).
function addPistol(J) {
  const steel = mat(0x3c424a, { r: 0.4 }), edge = mat(0x9aa3ad, { r: 0.2 }), grip = mat(0x2a2522, { r: 0.7 });
  const gun = new THREE.Group();
  const slide = box(0.042, 0.23, 0.056, steel, 0, -0.09, 0.05);      // slide and barrel
  slide.add(box(0.03, 0.22, 0.012, edge, 0, -0.09, 0.083));         // the polished top of the slide
  gun.add(slide);
  gun.add(box(0.034, 0.06, 0.11, grip, 0, -0.02, 0.0));          // grip, inside the fist
  gun.add(box(0.014, 0.036, 0.014, steel, 0, -0.045, -0.04));    // trigger guard
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, -0.205, 0.05); gun.add(muzzle);
  J.handR.add(gun);
  return { gun, muzzle, slide };
}

export class Figure {
  static all = new Set();
  static rimOff = false;     // ?norim, to compare against the set rim
  static smooth = false;     // ?timing=smooth; set with Figure.setTiming
  static setTiming(smooth) { Figure.smooth = !!smooth; setSmooth(smooth); }
  /**
   * o.outfit: 'courier' (the first pass) or a key of OUTFITS. o.density multiplies the scene's
   * texel density for the figure alone: 1 matches the walls; the default 2 gives her four texels
   * for each one of the set, so the face and hands resolve while she stays pixel art. 3 adds
   * little at game distance and starts to read as plain 3D.
   */
  constructor(tpu, o = {}) {
    const d = o.density ?? DENSITY;
    tpu *= d;
    const W = Math.round(W_TX * d), H = Math.round(H_TX * d);
    const { root, J } = o.outfit && OUTFITS[o.outfit] ? OUTFITS[o.outfit]() : buildCourier();
    J.drape ??= [];   // cloth sheets (cloth.js), stepped after the pose each frame
    this.model = root; this.J = J;
    this.model.traverse((o) => o.layers.set(FIGURE_LAYER));

    this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 0, depthBuffer: true });
    this.rt.texture.minFilter = this.rt.texture.magFilter = THREE.NearestFilter;
    this.rt.texture.generateMipmaps = false;
    // depth of the figure's own render, for the inner outline where a near part overlaps a far one
    this.rt.depthTexture = new THREE.DepthTexture(W, H);

    const w = W / tpu, h = H / tpu;
    this.box = { left: -w / 2, right: w / 2, bottom: -0.13, top: h - 0.13 };   // around the feet
    this.cam = new THREE.OrthographicCamera(this.box.left, this.box.right, this.box.top, this.box.bottom, 0.1, 60);
    this.cam.layers.set(FIGURE_LAYER);

    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, (this.box.top + this.box.bottom) / 2, 0);
    const m = new THREE.MeshBasicMaterial({ map: this.rt.texture, alphaTest: 0.5, fog: true });
    // Set rim: the lamps of the set that stand behind the figure, summed each frame into one edge
    // colour and one screen direction (see setRim). A body under the sodium lamp gets an orange
    // edge on the lamp's side, one in front of the stall a teal one, so dark coats separate from
    // dark walls.
    this.rimU = { uRimCol: { value: new THREE.Color(0, 0, 0) }, uRimDir: { value: new THREE.Vector2(0, 1) } };
    // The card's pixel pass, three rules a pixel artist follows:
    //   outline  darken texels on the silhouette edge, the selective outline the painted sprites use
    //   depth    inside the silhouette, darken a texel when a neighbour is nearer by more than
    //            EDGE_GAP: the line drawn where an arm crosses the body (Pixel Plays' depth-edge rule)
    //   rim      light a texel when the texel one or two steps toward the lamps is empty or farther
    //            back by EDGE_GAP, so the rim is a drawn 1 to 2 texel line on the lamp side of every
    //            edge, never a glow across a surface that merely faces up; a rim-lit texel drops the
    //            outline, as an artist drops it on a lit edge
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, this.rimU);
      s.uniforms.tDepth = { value: this.rt.depthTexture };
      s.uniforms.uRange = { value: this.cam.far - this.cam.near };
      const gap = EDGE_GAP.toFixed(3);
      s.fragmentShader = 'uniform sampler2D tDepth;\nuniform float uRange;\nuniform vec3 uRimCol;\nuniform vec2 uRimDir;\n' + s.fragmentShader.replace('#include <map_fragment>', /* glsl */ `
        #include <map_fragment>
        {
          vec2 px = 1.0 / vec2( textureSize( map, 0 ) );
          float n = texture2D( map, vMapUv + vec2( px.x, 0.0 ) ).a * texture2D( map, vMapUv - vec2( px.x, 0.0 ) ).a
                  * texture2D( map, vMapUv + vec2( 0.0, px.y ) ).a * texture2D( map, vMapUv - vec2( 0.0, px.y ) ).a;
          float dc = texture2D( tDepth, vMapUv ).x;
          float rim = 0.0;
          vec2 rs = sign( uRimDir ), ra = abs( uRimDir ) / max( max( abs( uRimDir.x ), abs( uRimDir.y ) ), 1e-4 );
          for ( int k = 1; k <= 2; k++ ) {
            float wk = k == 1 ? 1.0 : 0.45;
            vec2 ux = vMapUv + vec2( rs.x * px.x * float( k ), 0.0 ), uy = vMapUv + vec2( 0.0, rs.y * px.y * float( k ) );
            float ex = texture2D( map, ux ).a < 0.5 || ( texture2D( tDepth, ux ).x - dc ) * uRange > ${gap} ? 1.0 : 0.0;
            float ey = texture2D( map, uy ).a < 0.5 || ( texture2D( tDepth, uy ).x - dc ) * uRange > ${gap} ? 1.0 : 0.0;
            rim = max( rim, wk * max( ex * ra.x * step( 0.5, abs( rs.x ) ), ey * ra.y * step( 0.5, abs( rs.y ) ) ) );
          }
          // a glowing strip (tech.js) is a light source: no outline or depth line darkens it
          bool hot = max( diffuseColor.r, max( diffuseColor.g, diffuseColor.b ) ) > 1.6;
          if ( hot ) {}
          else if ( n < 0.5 ) diffuseColor.rgb *= mix( vec3( 0.66, 0.66, 0.72 ), vec3( 1.0 ), rim );
          else {
            float dn = min( min( texture2D( tDepth, vMapUv + vec2( px.x, 0.0 ) ).x, texture2D( tDepth, vMapUv - vec2( px.x, 0.0 ) ).x ),
                            min( texture2D( tDepth, vMapUv + vec2( 0.0, px.y ) ).x, texture2D( tDepth, vMapUv - vec2( 0.0, px.y ) ).x ) );
            if ( ( dc - dn ) * uRange > ${gap} ) diffuseColor.rgb *= vec3( 0.58, 0.58, 0.66 );
          }
          diffuseColor.rgb += uRimCol * rim;
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
    this.rim = new THREE.DirectionalLight(0xbfe6f2, 2.5);
    this.rim.target = this.model;
    for (const l of [this.fill, this.rim]) { l.layers.set(FIGURE_LAYER); this.model.add(l); }
    this.rim.position.set(0, 0, 0);
    Figure.all.add(this);

    this.facing = 1; this.yaw = TURN;
    this.condition = 'normal';          // 'injured' swaps walk for the limp and slows the body
    this.t = 0; this.phase = 0; this.idleT = Math.random() * IDLE_PERIOD;
    this.speed = 0; this.prevSpeed = 0; this.peakSpeed = 0; this.fatigue = 0;
    this.tired = false; this.prevMoving = false; this.prevWant = 0;
    // locomotion weights, eased with their own blend times
    this.w = { idle: 1, tired: 0, move: 0 };
    this.lean = { x: 0, v: 0 };          // acceleration lean, an underdamped spring
    this.pack = { x: 0, v: 0 };          // backpack bounce
    this.scarfS = { x: 0, v: 0 };        // scarf trail
    this.hipYPrev = 0;
    this.poseClock = 0; this.P = {}; this.sampled = {};
    this.sinceTick = 0; this.sig = ''; this.forceTick = false; this.sinceWrite = 0;
    // the transition playing (a start, stop, push or turn), which replaces the whole body; see update
    this.trans = null; this.lastFacing = null; this.holster = null;
    this.pivot = new THREE.Vector3();

    // the pistol: low ready, the draw into the aim, and the keyed shot (see update)
    const { gun, muzzle, slide } = addPistol(J);
    gun.traverse((m) => m.layers.set(FIGURE_LAYER));
    this.gun = gun; this.muzzle = muzzle; this.slide = slide; this.gun.visible = o.armed ?? true;
    // o.tech: a TECH colour name; lights the gun's cell and the strips on her clothes (tech.js)
    this.tech = o.tech && TECH[o.tech] ? addTech(J, gun, FIGURE_LAYER, TECH[o.tech]) : null;
    this.aiming = false; this.wAim = 0; this.wReady = 0;
    this.drawT = 0; this.drawRate = 1; this.readyT = 99; this.shotT = -1;
    this.act = null; this.wAct = 0; this.dead = false;
    // bullet impacts: springs layered over every pose (see impact)
    this.jolt = Object.fromEntries(['lean', 'twist', 'roll', 'head', 'headY', 'armL', 'armR', 'dip'].map((k) => [k, { x: 0, v: 0 }]));
    // absolute forward angles of each forearm and hand, and the joint values last written
    this.arms = { L: { f: { x: 0.3, v: 0 }, h: { x: 0.45, v: 0 }, elbow: 0.25, wrist: WRIST_REST }, R: { f: { x: 0.3, v: 0 }, h: { x: 0.45, v: 0 }, elbow: 0.25, wrist: WRIST_REST } };
  }

  /**
   * Play a keyed performance over everything else: a hit reaction, a death fall. keys are
   * motion.js keys over 0..1, len is seconds. Hits get no anticipation, so the layer takes over
   * on the frame it starts. o.hold keeps the last pose (a body on the ground) and stops the gait;
   * otherwise the layer hands back to locomotion as it ends. o.only limits the layer to those
   * channels (motion.js UPPER), so the legs keep walking under it.
   */
  perform(keys, len, o = {}) {
    this.act = { keys, len, t: 0, hold: !!o.hold, out: o.out ?? 0.25, only: o.only ? new Set(o.only) : null };
    // the first drawing goes up whole on this frame: easing the layer in over a few frames drew
    // half-blended in-betweens and hid the impact
    this.wAct = 1; this.forceTick = true;
    if (o.hold) this.dead = true;
  }

  /**
   * A hit that does not kill, chosen by what the body is doing: aiming, the gun is knocked off the
   * line and comes back; walking, the upper body takes it and the legs keep going; standing, the
   * whole body reacts.
   */
  hit() {
    if (this.aiming) this.perform(HIT_AIM, HIT_AIM_LEN, { only: UPPER, out: 0.1 });
    else if (this.speed >= 0.25) this.perform(HIT_WALK, HIT_WALK_LEN, { only: UPPER });
    else this.perform(HIT, HIT_LEN);
  }

  /**
   * A bullet lands. dirX is the bullet's travel along world x, y its height above the feet in
   * metres. Kicks a set of stiff, under-damped springs that sit on top of every pose, so each
   * round jerks the body where it lands, stacked over a hit reaction or a fall: the head snaps,
   * the chest is punched back and turned, a gut shot folds the body over the wound.
   */
  impact(dirX, y) {
    this.forceTick = true;          // the hit lands on the frame it happens
    const j = this.jolt, front = dirX * this.facing < 0;      // travelling against her facing: hit from the front
    const back = front ? -1 : 1;                              // the torso goes the way the bullet goes
    const side = Math.random() < 0.5 ? -1 : 1, k = 0.8 + Math.random() * 0.4;
    const rel = y / ((this.J.hipY0 ?? 0.98) / 0.925 * 1.7);
    if (rel > 0.86) {                                         // head
      j.head.v += back * 16 * k; j.headY.v += side * 7 * k; j.lean.v += back * 3 * k;
    } else if (rel > 0.6) {                                   // chest and shoulders
      j.lean.v += back * 8 * k; j.twist.v += side * 10 * k; j.roll.v += side * 3 * k;
      j[side > 0 ? 'armL' : 'armR'].v += 10 * k; j.head.v -= back * 5 * k;
    } else {                                                  // gut: fold over the wound
      j.lean.v += 9 * k; j.dip.v -= 1.1 * k; j.twist.v += side * 4 * k; j.head.v += 6 * k;
    }
  }

  /** Back on the feet: clears a held performance. */
  revive() { this.act = null; this.wAct = 0; this.dead = false; this.trans = null; }

  /** Start a transition clip: it replaces the body until it ends. o: kind, and from/to for a turn. */
  transition(keys, kind, o = {}) {
    this.trans = { keys, kind, len: keys.frames / 60, t: 0, ...o };
    this.forceTick = true;
  }

  /**
   * Fire: starts the keyed shot on this very frame (the pose clock is forced to tick, so beat 1,
   * the flash frame, is the next pose drawn) and racks the slide. Returns the muzzle's world
   * position.
   */
  shoot(out = new THREE.Vector3()) {
    this.shotT = 0;
    this.poseClock = POSE_FPS ? 1 / POSE_FPS : 0;
    this.forceTick = true;          // the flash drawing goes up on this frame
    this.tech?.shot();
    return this.muzzle.getWorldPosition(out);
  }

  /** The gun is up and on the line: the draw is far enough along for a shot to go where she looks. */
  get onTarget() { return this.wAim > 0.85 && this.drawT >= DRAW_LEN * 0.75; }

  // The game asks for a clip by speed band; the figure decides poses from speed itself.
  play() {}

  /**
   * Advance pose. vx is the world speed along x; it drives stride phase, lean and fatigue. goal,
   * when the caller knows it, is the speed being asked for (the player's input): a stop then starts
   * on the frame the key is let go, while the body is still sliding, instead of once it has halted.
   */
  update(dt, vx = 0, goal) {
    this.t += dt;
    if (this.dead) vx = 0;
    const speed = Math.abs(vx), accel = (speed - this.prevSpeed) / Math.max(dt, 1e-4);
    this.prevSpeed = speed; this.speed = speed;
    const injured = this.condition === 'injured';

    // fatigue builds while running and drains while not; a long run ends out of breath
    this.fatigue = Math.min(1, Math.max(0, this.fatigue + dt * (speed > 3 ? 0.22 : -0.1)));
    this.peakSpeed = speed > 0.2 ? Math.max(this.peakSpeed * Math.exp(-dt * 0.5), speed) : this.peakSpeed;

    // stopped: idle, or hands on knees if spent
    if (speed >= 0.25) this.peakSpeed = Math.max(this.peakSpeed, speed);
    if (this.fatigue > 0.55 && speed < 0.25) this.tired = true;
    if (this.fatigue < 0.15 || speed >= 0.25) this.tired = false;

    const moving = speed >= 0.25;
    const target = { idle: !moving && !this.tired ? 1 : 0, tired: !moving && this.tired ? 1 : 0, move: moving ? 1 : 0 };
    const rate = { idle: 2.2, tired: 2.5, move: 7 };   // per second; moving starts fast, settling is slow
    for (const k in this.w) this.w[k] += (target[k] - this.w[k]) * (1 - Math.exp(-dt * rate[k]));

    // gait: one shared phase, so walk and run blend with feet in step
    const runK = injured ? 0 : smooth(2.3, 3.8, speed);
    const stride = injured ? STRIDE.limp : STRIDE.walk + (STRIDE.run - STRIDE.walk) * runK;
    const back = vx * this.facing < -0.05 ? -1 : 1;              // back-pedalling plays the gait in reverse
    this.phase = (this.phase + back * speed * dt / stride + 1) % 1;
    // the gun: aiming draws it (from low ready, the draw skips the lift from the hip); after the
    // aim it holds at low ready for READY_HOLD, then goes down. Running puts it away at once.
    const aim = this.aiming && !this.dead;
    if (aim && this.wAim < 0.3 && !this.wasAiming) this.drawT = this.wReady > 0.5 ? DRAW_LEN * 0.3 : 0;
    this.wasAiming = aim;
    this.drawT += dt * (aim ? this.drawRate : 0);
    this.readyT = aim ? 0 : this.readyT + dt;
    this.wAim += ((aim ? 1 : 0) - this.wAim) * (1 - Math.exp(-dt * (aim ? 18 : 6)));
    const ready = !this.dead && speed < 3 && this.readyT < READY_HOLD;
    // the gun goes down as drawings (HOLSTER), twice as fast when she breaks into a run
    if (!ready && !aim && !this.dead && this.wReady > 0.5 && !this.holster) { this.holster = { t: 0, rate: speed >= 3 ? 2 : 1 }; this.forceTick = true; }
    if (this.holster) {
      this.holster.t += dt * this.holster.rate;
      if (aim || this.dead || this.holster.t >= HOLSTER_LEN) { if (!aim && !this.dead) this.wReady = 0; this.holster = null; }
    }
    if (!this.holster) this.wReady += ((ready ? 1 : 0) - this.wReady) * (1 - Math.exp(-dt * (ready ? 8 : 2.6)));
    if (this.shotT >= 0) { this.shotT += dt; if (this.shotT > SHOT_LEN) this.shotT = -1; }
    // the slide racks back on the shot and returns in two frames
    this.slide.position.y = this.shotT >= 0 && this.shotT < 0.035 ? 0.024 : 0;
    if (this.act) {
      const A = this.act;
      A.t += dt;
      const left = A.len - A.t;
      const want = A.hold || left > A.out ? 1 : Math.max(0, left / A.out);
      this.wAct += (want - this.wAct) * (1 - Math.exp(-dt * 40));
      if (!A.hold && left <= 0) { this.act = null; this.wAct = 0; }
    }
    this.idleT += dt;

    // Transitions as drawings (plan step 2). A change of facing plays the turnaround, the run one
    // at run speed (not while aiming, which pivots on the spot, and not on the first frame).
    // Starting from rest, breaking into a run, and stopping play their own clips; a clip that ends
    // on a gait sets the gait's phase to its last drawing. Not while aiming (the aim walk
    // back-pedals) or limping (the limp is its own gait).
    if (this.facing !== this.lastFacing) {
      if (this.lastFacing != null && !this.dead && !this.aiming && !Figure.smooth) {
        const fast = speed > 3 && !injured;
        const keys = this.facing < 0 ? (fast ? TURN_RUN_LEFT : TURN_LEFT) : (fast ? TURN_RUN_RIGHT : TURN_RIGHT);
        this.transition(keys, 'turn', { from: this.yaw, to: (this.facing > 0 ? 1 : -1) * TURN });
      }
      this.lastFacing = this.facing;
    }
    const want = goal == null ? null : Math.abs(goal);
    const T = this.trans, lead = this.phase < 0.5 ? 0 : 1;    // 0: the left foot is in front
    if (!this.dead && !this.aiming && !injured && !(this.act && !this.act.only) && T?.kind !== 'turn') {
      const stopping = want != null ? moving && want < 0.1 : !moving && this.prevMoving;
      if (stopping && T?.kind !== 'stop') {
        const fast = (want != null ? speed : this.peakSpeed) > 3.2;
        this.transition((fast ? SKID : STOP_WALK)[lead], 'stop');
        this.peakSpeed = 0;
      } else if (T?.kind === 'stop' && want > 0.1) this.trans = null;        // moving again: the gait takes over
      else if (moving && !this.prevMoving && !T && this.w.move < 0.5 && vx * this.facing > 0) {
        const r = Math.random() < 0.5 ? 0 : 1;                                // either foot, at random
        this.transition(((want ?? speed) > 3 ? START_RUN : START_WALK)[r], 'start');
      } else if (want > 3 && this.prevWant <= 3 && moving && !T && this.w.move > 0.5) this.transition(RUN_PUSH[1 - lead], 'push');
    }
    this.prevMoving = moving; this.prevWant = want ?? 0;
    if (this.trans) {
      const X = this.trans;
      X.t += dt;
      if (X.t >= X.len || this.dead || (this.aiming && X.kind === 'turn')) {
        if (X.keys.endPhase != null) this.phase = X.keys.endPhase;
        // hand over to the loop the clip ended in, at full weight, so no half-blended pose follows
        for (const k in this.w) this.w[k] = target[k];
        this.trans = null; this.forceTick = true;
      }
    }

    // a new drawing when any playing clip that shows moves on to its next drawing (see MIN_HOLD).
    // Under a transition or a whole-body performance the loops still run but are hidden, so their
    // drawings do not count: counting them redrew a held drawing every 2 frames with new spring
    // values, twice the authored rate.
    let sig = '';
    if (!Figure.smooth) {
      const gk = injured ? LIMP : runK > 0.5 ? RUN : WALK, at = (k, t) => drawingAt(k, Math.min(1, t), false)[0];
      const loops = !this.trans && !(this.act && !this.act.only && this.wAct > 0.5);
      sig = [loops && this.w.move > 0.5 ? (gk === RUN ? 'r' : 'w') + drawingAt(gk, this.phase)[0] : '',
        loops && this.w.idle > 0.5 ? 'i' + drawingAt(IDLE, this.idleT / IDLE_PERIOD)[0] : '',
        loops && this.w.tired > 0.5 ? 't' + drawingAt(TIRED, this.t / 0.9)[0] : '',
        this.wAim > 0.05 ? 'd' + at(DRAW, this.drawT / DRAW_LEN) : '',
        this.shotT >= 0 ? 'k' + at(SHOT, this.shotT / SHOT_LEN) : '',
        this.holster ? 'h' + at(HOLSTER, this.holster.t / HOLSTER_LEN) : '',
        this.trans ? 'u' + at(this.trans.keys, this.trans.t / this.trans.len) : '',
        this.act ? 'a' + at(this.act.keys, this.act.t / this.act.len) : ''].join('|');
    }
    this.poseClock += dt; this.sinceTick += dt; this.sinceWrite += dt;
    const step = POSE_FPS ? 1 / POSE_FPS : 0;
    // the first frame has no pose yet (not !P.thighL: a standing pose has thighL exactly 0, which
    // redrew the idle every frame)
    const tick = this.P.thighL === undefined || this.forceTick || (Figure.smooth
      ? !step || this.poseClock >= step
      : (sig !== this.sig && this.sinceTick >= (this.holster || this.act?.only ? LAYER_HOLD : MIN_HOLD)) || this.sinceTick >= MAX_HOLD);
    if (tick) {
      this.poseClock = step ? this.poseClock % step : 0;
      this.sinceTick = 0; this.sig = sig; this.forceTick = false;
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
      for (const k in P) P[k] /= sum || 1;
      // a transition replaces the whole body while it plays
      if (this.trans) {
        const U = sample(this.trans.keys, Math.min(1, this.trans.t / this.trans.len), false, S.trans ??= {});
        for (const c in U) P[c] = U[c];
      }
      // the gun over the gait, upper body only: low ready (or the gun going down), then the draw
      // into the aim with the aim's breathing and barrel dips once it has settled, then the shot
      // added on top
      if (this.holster) {
        const H = sample(HOLSTER, Math.min(1, this.holster.t / HOLSTER_LEN), false, S.holster ??= {});
        for (const c of AIM_CH) P[c] = H[c];
      } else if (this.wReady > 1e-3) for (const c of AIM_CH) P[c] += (READY[c] - P[c]) * this.wReady;
      if (this.wAim > 1e-3) {
        const D = sample(DRAW, Math.min(1, this.drawT / DRAW_LEN), false, S.draw ??= {});
        const L = aimLife(this.t, S.life ??= {}), settled = smooth(DRAW_LEN, DRAW_LEN + 0.3, this.drawT);
        for (const c of AIM_CH) P[c] += (D[c] + (L[c] ?? 0) * settled - P[c]) * this.wAim;
      }
      if (this.shotT >= 0) {
        const K = sample(SHOT, Math.min(1, this.shotT / SHOT_LEN), false, S.shot ??= {}), g = Math.max(this.wAim, this.wReady);
        for (const c in K) P[c] = (P[c] ?? 0) + K[c] * g;
      }
      P.pitch ??= 0;
      // a performance overrides the whole body
      if (this.act && this.wAct > 1e-3) {
        const A = sample(this.act.keys, Math.min(1, this.act.t / this.act.len), false, S.act ??= {});
        A.hipY *= (this.J.hipY0 ?? 0.98) / 0.925;   // keys are authored on Januwu's 0.925 m hips
        const only = this.act.only;
        for (const c in A) if (!only || only.has(c)) P[c] = (P[c] ?? 0) + (A[c] - (P[c] ?? 0)) * this.wAct;
      }
    }
    const P = this.P;
    // joints are written on a new drawing only (every frame with ?timing=smooth)
    const write = tick || Figure.smooth;

    // springs: lean overshoots on start and stop, the pack bounces with the hips, the scarf trails
    spring(this.lean, THREE.MathUtils.clamp(accel * 0.035, -0.3, 0.3), 60, 7, dt);
    const hipV = (P.hipY - this.hipYPrev) / Math.max(dt, 1e-4); this.hipYPrev = P.hipY;
    spring(this.pack, THREE.MathUtils.clamp(-hipV * 0.25 + speed * 0.04, -0.4, 0.4), 140, 9, dt);
    spring(this.scarfS, 0.15 + speed * 0.28, 30, 5, dt);
    const breath = this.dead ? 0 : Math.sin(this.t * (2.1 + this.fatigue * 5)) * (0.012 + this.fatigue * 0.03);

    const J = this.J;
    // physics every frame; what it shows is written with the drawing
    const loose = 1 - Math.max(this.wAim, this.wReady);
    // a runner holds the arms firm and the hands in loose fists: springs stiffen 3x by full run
    // speed (damping keeps zeta near 0.6), or the hands flap
    const firm = 1 + 2 * smooth(2.3, 3.8, speed), damp = 1 + 0.75 * smooth(2.3, 3.8, speed);
    for (const k of ['L', 'R']) {
      const a = this.arms[k];
      spring(a.f, P['arm' + k] + P['elbow' + k], FORE.k * firm, FORE.c * damp, dt);
      spring(a.h, a.f.x + WRIST_REST, HAND.k * firm, HAND.c * damp, dt);
    }
    const jo = this.jolt;
    for (const k in jo) spring(jo[k], 0, 520, 20, dt);
    if (write) {
    J.hips.position.set(P.hipX, (J.hipY0 ?? 0.98) + P.hipY, 0);
    J.hips.rotation.set(P.pitch, P.hipRotY, P.hipRoll);
    J.spine.rotation.set(P.lean + this.lean.x, P.twist, P.spineRoll);
    J.spine.scale.set(1, 1 + breath * 0.5, 1 + breath);
    J.neck.rotation.set(P.neckX - this.lean.x * 0.5 - breath * 0.6, 0, 0);
    J.head.rotation.set(P.headX, P.headY, 0);
    J.thighL.rotation.x = -P.thighL; J.thighR.rotation.x = -P.thighR;
    J.shinL.rotation.x = P.kneeL; J.shinR.rotation.x = P.kneeR;
    J.footL.rotation.x = -P.footL; J.footR.rotation.x = -P.footR;
    J.armL.rotation.set(-P.armL, 0, P.outL); J.armR.rotation.set(-P.armR, 0, -P.outR);
    // follow-through: the forearm and hand springs (stepped above) are read on each drawing.
    // Aiming hands the arms back to the keyed pose so the gun stays on target.
    for (const k of ['L', 'R']) {
      const a = this.arms[k], arm = P['arm' + k], elbow = P['elbow' + k];
      if (tick) {
        const free = THREE.MathUtils.clamp(a.f.x - arm, ELBOW_MIN, 2.4);   // never straight, never backward
        a.elbow = elbow + (free - elbow) * loose;
        a.wrist = WRIST_REST * (1 - loose) + THREE.MathUtils.clamp(a.h.x - a.f.x, -0.5, 0.9) * loose + (P['wrist' + k] ?? 0);
      }
      J['elbow' + k].rotation.x = -a.elbow;
      if (J['hand' + k]) J['hand' + k].rotation.x = -a.wrist;
    }
    // bullet impacts: impact() forces a drawing, so a hit lands on the frame it happens
    J.spine.rotation.x += jo.lean.x; J.spine.rotation.y += jo.twist.x; J.spine.rotation.z += jo.roll.x;
    J.head.rotation.x += jo.head.x; J.head.rotation.y += jo.headY.x;
    J.armL.rotation.x += jo.armL.x; J.armR.rotation.x += jo.armR.x;
    J.hips.position.y += jo.dip.x;
    if (J.pack) J.pack.rotation.x = -this.pack.x * 0.6;
    if (J.ruff) J.ruff.rotation.x = this.pack.x * 0.15;
    if (J.tail) J.tail.forEach((s, i) => { s.rotation.x = -(this.scarfS.x * (0.7 + i * 0.3)) + Math.sin(this.t * (7 + i * 2) + i) * 0.06 * (0.3 + speed * 0.3); });

    // facing: during the turnaround the drawing says how far round the body is; otherwise a
    // damped turn toward the facing, advanced by the time since the last drawing
    // aiming turns to near profile, so the arms and gun cross the frame instead of pointing at
    // the camera: at the three-quarter turn the arms foreshortened into the body
    if (this.trans?.kind === 'turn') this.yaw = this.trans.from + (this.trans.to - this.trans.from) * THREE.MathUtils.clamp(P.yaw, 0, 1);
    else {
      const turn = TURN + (AIM_TURN - TURN) * this.wAim;
      const want = this.facing > 0 ? turn : -turn;
      let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * (1 - Math.exp(-this.sinceWrite * (speed > 3 ? 14 : 9)));
    }
    this.sinceWrite = 0;
    }
    this.model.position.copy(this.mesh.position);
    this.model.rotation.y = this.yaw;
    this.model.updateMatrixWorld(true);   // so the muzzle's world position is current for shots
    // cloth last, on the posed body: it simulates every frame and redraws on pose ticks
    const still = this.dead && this.act && this.act.t > this.act.len + CLOTH_SLEEP;
    for (const c of J.drape) c.step(dt, tick, still);
    this.tech?.update(dt, this.t);
  }

  /**
   * Sum the set's lamps behind this figure into the rim colour and its screen direction. A lamp
   * counts by its power at the figure (inverse square, cut at its range) times how far behind the
   * figure it stands as seen from the camera; one in front adds nothing, since its light already
   * falls on the visible side. dir points from the figure to the camera.
   */
  setRim(scene, dir) {
    this.sceneLights ??= collectLights(scene);
    const col = this.rimU.uRimCol.value.setRGB(0, 0, 0), d2 = new THREE.Vector2();
    // the figure camera's right and up axes: it looks along -dir with world up
    const L = _v1, right = _v2.set(dir.z, 0, -dir.x).normalize(), up = _v3.crossVectors(dir, right).normalize();
    for (const l of this.sceneLights) {
      if (!l.visible || l.intensity <= 0) continue;
      let power;
      if (l.isDirectionalLight) { L.copy(l.position).sub(l.target.position).normalize(); power = l.intensity * RIM_SUN; }
      else {
        l.getWorldPosition(L).sub(this.pivot);
        const d = L.length();
        if (l.distance > 0 && d > l.distance) continue;
        power = l.intensity / (d * d + 1);
        L.divideScalar(d);
      }
      const behind = THREE.MathUtils.smoothstep(-L.dot(dir), -0.35, 0.55);
      const w = power * behind;
      if (w < 1e-3) continue;
      col.r += l.color.r * w; col.g += l.color.g * w; col.b += l.color.b * w;
      _d.set(L.dot(right), L.dot(up));
      if (_d.lengthSq() > 1e-6) d2.addScaledVector(_d.normalize(), w);
    }
    col.multiplyScalar(Figure.rimOff ? 0 : RIM_GAIN);
    const lum = col.r * 0.2126 + col.g * 0.7152 + col.b * 0.0722;
    if (lum > RIM_MAX) col.multiplyScalar(RIM_MAX / lum);
    if (d2.lengthSq() > 1e-6) this.rimU.uRimDir.value.copy(d2.normalize());
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

    this.setRim(scene, dir);

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


// Rim tuning: gain from summed lamp power to edge colour, the cap on its luminance (bloom
// starts at 1.1), and how much a directional sky light counts against a point lamp.
const RIM_GAIN = 0.05, RIM_MAX = 0.55, RIM_SUN = 2.5;
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _d = new THREE.Vector2();

/** The scene's own lights, not the figures' character lights (those live on FIGURE_LAYER only). */
function collectLights(scene) {
  const out = [];
  scene.traverse((o) => { if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && (o.layers.mask & 1)) out.push(o); });
  return out;
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function blendInto(out, a, b, k) { for (const c in a) out[c] = a[c] + (b[c] - a[c]) * k; return out; }
/** Damped spring toward target. k stiffness, c damping; under-damped values overshoot. */
function spring(s, target, k, c, dt) { s.v += ((target - s.x) * k - s.v * c) * dt; s.x += s.v * dt; }
