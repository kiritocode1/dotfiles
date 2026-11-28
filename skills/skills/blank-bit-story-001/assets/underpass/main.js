// Underpass: a representative scene for the noir pixel games skill. One rainy street under
// a rail viaduct, a noodle stall, a courier who walks and runs, a passing train, and a
// camera that changes framing as the courier moves through the street.
import * as THREE from 'three';
import { buildUnderpass, TPU } from './lib/world.js';
import { bakeAtlas, drawCourier, drawVendor, Actor } from './lib/rig.js';
import { createRain, createSplashes, createCone, createGlow, createWetReflection } from './lib/atmos.js';
import { createPost } from './lib/post.js';
import { Director, faceCamera } from './lib/camera.js';
import { PixelCanvas, pixelMaterial, hex } from './lib/pixel.js';
import { Figure, FIGURE_LAYER } from './lib/figure.js';
import { paintedLayer } from './lib/painted.js';
import { createGun } from './lib/gun.js';
import { RampActor, loadFrame, loadMaterials } from './lib/ramp.js';
import * as MOTION from './lib/motion.js';
import { createEnemies } from './lib/enemies.js';

const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Underpass. Walk with A and D or the arrow keys, hold Shift to run, press L to toggle an injured leg. Hold K or the right mouse button to aim, press J or click to fire.');

const scene = new THREE.Scene();
const FOG = { color: 0x1b2c33, density: 0.019 };
scene.fog = new THREE.FogExp2(FOG.color, FOG.density);
scene.background = new THREE.Color(FOG.color);

const camera = new THREE.PerspectiveCamera(26, innerWidth / innerHeight, 0.5, 420);
const world = buildUnderpass(scene);
const { lights, anchors } = world;

// shots across the street: approach on a low yawed angle, side-on under the arches,
// a closer high angle at the stall, and a tilted low angle past it
const director = new Director(camera, [
  { x1: -13, dist: 17, height: 1.5, focusY: 2.3, yaw: 24, fov: 30, lead: 2.6, blend: 1.6 },
  { x0: -13, x1: 2.5 },
  { x0: 2.5, x1: 12.5, dist: 15, height: 5.2, focusY: 2.2, yaw: -6, fov: 25, lead: 0.8, blend: 1.3 },
  { x0: 12.5, dist: 16, height: 1.2, focusY: 2.6, yaw: -16, roll: 7, fov: 29, lead: 2.2, blend: 1.8 },
]);

// moments: the frame changes because of what is happening. Higher priority wins per value.
// ?nomoments turns them off, to compare against the street zones alone.
const VENDOR_X = anchors.STALL_X + 1.3;
if (!params.has('nomoments')) {
  director.addMoment({ id: 'injured', priority: 1, in: 2, out: 2, set: { dist: 19.5, height: 3.0, lead: 1.0 }, when: (c) => c.injured });
  director.addMoment({ id: 'run', priority: 2, in: 0.8, out: 1.2, minHold: 0.4, set: { dist: 25, lead: 4.0 }, when: (c) => c.runT > 0.3 });
  director.addMoment({ id: 'still', priority: 2, in: 6, out: 0.7, set: { dist: 18.5, height: 3.0, focusY: 2.4, lead: 0.4 }, when: (c) => c.stillT > 6 });
  director.addMoment({ id: 'stall', priority: 2, in: 1.8, out: 1.2, set: { dist: 12.5, height: 3.8, focusY: 2.2, lead: 0 }, when: (c) => c.atStall });
  // the train runs above the street framing; tilt up to show it, Januwu small under the deck
  director.addMoment({ id: 'train', priority: 3, in: 1.2, out: 1.6, minHold: 2, set: { dist: 26, height: 4.8, focusY: 5.0, lead: 0 }, when: (c) => c.trainNear && !c.aim });
  // Fight: REPLACED frames a fight with the hero at 32 to 42% of the frame height (research/
  // staging.md, rule 4), so the camera comes in low to put Januwu at about 36% and widens only
  // as far as it must to keep the nearest Collector in frame, centred between the two. It sets
  // every framing value, so a train or stall moment easing out cannot drag the floor off frame.
  const HERO_H = 1.7, FIGHT_PCT = 0.36, FIGHT_FOV = 26;
  const tanV = Math.tan(THREE.MathUtils.degToRad(FIGHT_FOV) / 2);
  director.addMoment({ id: 'fight', priority: 4, in: 0.5, out: 0.9, minHold: 0.6, when: (c) => c.aim || c.foe != null, set: {
    fov: FIGHT_FOV, height: 1.75, focusY: 1.3, dz: 0.12,
    dist: (c) => {
      const near = HERO_H / (FIGHT_PCT * 2 * tanV);
      // the two bodies span the middle 72% of the frame, about a seventh in from each edge
      const fit = c.foe == null ? 0 : Math.abs(c.foe - c.x) / 0.72 / (2 * tanV * camera.aspect);
      return THREE.MathUtils.clamp(Math.max(near, fit), 10, 20);
    },
    lead: (c) => (c.foe == null ? 2.0 : (c.foe - c.x) * 0.5 * c.facing),
  } });
  // Januwu down: low and close on the body until she gets up
  director.addMoment({ id: 'down', priority: 7, in: 2, out: 1.2, set: { dist: 10, height: 1.0, focusY: 0.7, yaw: 8, lead: 0 }, when: (c) => c.down });
}

// actors
const courier = bakeAtlas(drawCourier, {
  idle: { frames: 6, fps: 5, pose: (i) => ({ breath: [0, 0, 0.6, 1, 1, 0.5][i], arm: [0.08, -0.06], elbow: [0.25, 0.3], scarf: i * 0.5 }) },
  walk: {
    frames: 8, fps: 10, pose: (i, n) => {
      const p = (i / n) * Math.PI * 2, s = Math.sin(p), c = Math.cos(p);
      return {
        lean: 0.06, bob: Math.abs(s) * 1.0, thigh: [0.42 * s, -0.42 * s], knee: [0.8 * Math.max(0, c), 0.8 * Math.max(0, -c)],
        arm: [-0.36 * s, 0.36 * s], elbow: [0.3 + 0.25 * Math.max(0, -s), 0.3 + 0.25 * Math.max(0, s)], scarf: p * 1.5,
      };
    },
  },
  run: {
    frames: 8, fps: 15, pose: (i, n) => {
      const p = (i / n) * Math.PI * 2, s = Math.sin(p), c = Math.cos(p);
      return {
        lean: 0.26, bob: Math.abs(s) * 1.6 - 0.6, hipX: 1, thigh: [0.78 * s, -0.78 * s], knee: [1.35 * Math.max(0, c) + 0.2, 1.35 * Math.max(0, -c) + 0.2],
        arm: [-0.85 * s, 0.85 * s], elbow: [1.25, 1.25], fist: [true, true], scarf: p * 2.4,
      };
    },
  },
});
// The hero is Januwu, a 3D body rendered into the scene's pixel grid. ?outfit=duster|parka|shell|
// enforcer|courier swaps the body. ?actor=drawn is the hand-drawn sprite through the ramp shader, playing the v1
// frames (?frame=death_chest/04 holds one drawing); ?actor=sprite the old painted capsule sprite.
const ACTOR = params.get('actor') ?? 'figure';
const SPRITE = ACTOR === 'sprite';
const DRAWN = ACTOR === 'drawn';
Figure.rimOff = params.has('norim');
Figure.setTiming(params.get('timing') === 'smooth');   // ?timing=smooth: the old interpolated timing, for comparison
let hero;
if (DRAWN) {
  const palette = await loadMaterials('sprites/materials.json');
  const frame = (path) => loadFrame(`sprites/${path}.txt`, palette);
  const set = (dir, ns) => Promise.all(ns.map((n) => frame(`${dir}/0${n}`)));
  let clips;
  if (params.has('frame')) {
    const still = { frames: [await frame(params.get('frame'))], fps: 1, loop: true };
    clips = { idle: still, walk: still, run: still, aim: still, shoot: still };
  } else {
    const [idle, walk, run, aim, shoot] = await Promise.all([
      set('v1/idle', [1, 2, 3, 4, 5]), set('v1/walk', [1, 2, 3, 4, 5]), set('v1/run', [1, 2, 3, 4, 5]),
      set('v1/shoot', [1]), set('v1/shoot', [2, 3, 4, 5]),
    ]);
    clips = {
      idle: { frames: idle, fps: 4, loop: true }, walk: { frames: walk, fps: 8, loop: true },
      run: { frames: run, fps: 12, loop: true }, aim: { frames: aim, fps: 1, loop: true },
      shoot: { frames: shoot, fps: 20, loop: false },
    };
  }
  hero = new RampActor(clips, palette, TPU);
} else hero = SPRITE ? new Actor(courier, TPU) : new Figure(TPU, { outfit: params.get('outfit') ?? 'januwu', density: params.has('density') ? Number(params.get('density')) : undefined,
  tech: params.get('glow') || 'red' });   // her tech strips (lib/tech.js): red by default, ?glow=mint, ?glow=off
hero.play('idle');
scene.add(hero.mesh);
if (!SPRITE && !DRAWN) scene.add(hero.model);
if (hero.tech) scene.add(hero.tech.light);

const vendorBake = bakeAtlas(drawVendor, {
  idle: { frames: 8, fps: 4, pose: (i) => ({ breath: [0, 0, 1, 1, 1, 0, 0, 0][i], arm: [0.9 + (i > 4 ? 0.25 : 0), 0.4], elbow: [1.5 - (i > 4 ? 0.4 : 0), 1.1] }) },
});
const vendor = new Actor(vendorBake, TPU);
vendor.play('idle'); vendor.facing = -1;
vendor.mesh.position.set(anchors.STALL_X + 1.3, 0, -4.6);
scene.add(vendor.mesh);

// train on the viaduct: three lit cars, a light that rides with it, sparks at the pantograph
const TRAIN_Y = anchors.DECK_Y + anchors.DECK_H + 0.5;
const train = new THREE.Group();
{
  const car = (seed) => {
    const W = Math.round(16 * 21), H = Math.round(2.2 * 21);
    const pc = new PixelCanvas(W, H);
    pc.rect(0, 0, W, H, (x, y) => (y < 3 ? hex(0x24292b) : hex(0x3a4246)), (x, y) => ({ h: y === 3 || y === H - 4 ? 1.5 : 0, r: 0.4 }));
    for (let x = 10; x < W - 20; x += 22) {
      const lit = ((x * 7 + seed) % 11) > 2;
      pc.rect(x, 9, x + 15, 26, (xx, yy) => (lit ? [240, 226, 196] : [20, 24, 28]), (xx, yy) => ({ h: -1, r: 0.2, e: lit ? [255, 226, 180] : null }));
      if (lit && (x * 13 + seed) % 5 === 0) pc.capsule(x + 7, 26, x + 7, 17, 3, 2.4, [30, 26, 24], { z: 3 }); // a standing passenger
    }
    pc.rect(0, H - 6, W, H - 5, [255, 120, 60], { e: [255, 90, 40] });
    pc.bevelAlpha(2, 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.2), pixelMaterial(pc.textures(), { emissiveIntensity: 2.6 }));
    return m;
  };
  for (let i = 0; i < 3; i++) { const m = car(i * 31); m.position.set(i * 16.4, 1.1, 0); train.add(m); }
  train.position.set(-200, TRAIN_Y, anchors.DECK_Z + 2.3);
  scene.add(train);
}
const trainLight = new THREE.PointLight(0xffe2b8, 0, 20, 2);
scene.add(trainLight);
const spark = new THREE.PointLight(0xbfe6ff, 0, 30, 2);
scene.add(spark);
const sparkGlow = createGlow(new THREE.Vector3(), 0xcfe9ff, 3, 0);
scene.add(sparkGlow);

// atmosphere
const rainLights = [
  { pos: lights.sodium.position, color: new THREE.Color(0xff8f3a), power: 30 },
  { pos: lights.neon.position, color: new THREE.Color(0x2fe6d2), power: 14 },
  { pos: lights.stall.position, color: new THREE.Color(0xffb36b), power: 8 },
  { pos: lights.lanternL.position, color: new THREE.Color(0xff4a2a), power: 2 },
  { pos: lights.lanternR.position, color: new THREE.Color(0xff4a2a), power: 2 },
  { pos: trainLight.position, color: new THREE.Color(0xffe2b8), power: 0 },
  { pos: spark.position, color: new THREE.Color(0xbfe6ff), power: 0 },
];
const rain = createRain(rainLights, { fogDensity: FOG.density });
scene.add(rain.mesh);
const splashes = createSplashes(rainLights);
scene.add(splashes.mesh);
const cone = createCone(new THREE.Vector3(anchors.LAMP.x, anchors.LAMP.y - 0.1, anchors.LAMP.z), 0xff9a4a, { angle: 0.5, intensity: 0.42, height: anchors.LAMP.y - 0.1 });
cone.mesh.rotation.z = -0.07; cone.mesh.rotation.x = 0.1;
scene.add(cone.mesh);
// lamp halos breathe at 0.5 to 0.7 Hz by 1 to 2%, as REPLACED's do; the street's glows join them
const breathers = [...world.breathers];
const breathe = (s) => { scene.add(s); breathers.push({ sprite: s, color: s.material.color.clone(), f: 0.5 + Math.random() * 0.2, ph: Math.random() * 6.28 }); };
breathe(createGlow(anchors.LAMP.clone().add(new THREE.Vector3(0, -0.2, 0)), 0xff9a4a, 5, 0.9));
breathe(createGlow(anchors.SIGN.clone().add(new THREE.Vector3(0, 0, 0.3)), 0x2fe6d2, 5, 0.22));
for (const l of world.lanterns) breathe(createGlow(l.position.clone().add(new THREE.Vector3(0, 0, 0.2)), 0xff5030, 1.8, 0.6));
const SODIUM = lights.sodium.intensity;
const wet = createWetReflection(new THREE.Vector2(120, 40), { fogDensity: FOG.density });
wet.position.z = -6;
scene.add(wet);

// ?painted swaps the procedural tower bands for painted layers from assets/bg
const PAINTED = params.has('painted');
if (PAINTED) {
  scene.traverse((o) => { if (o.userData.band) o.visible = false; });
  const bg = 'assets/bg/';
  Promise.all([
    paintedLayer(bg + 'far_skyline.png', { z: -120, height: 70, y: -8, haze: 0.5, emit: 0.55, relief: 0.6 }),
    paintedLayer(bg + 'mid_tenements.png', { z: -48, height: 30, y: 0, haze: 0.3, emit: 0.6 }),
    paintedLayer(bg + 'near_backstreet.png', { z: -18, height: 12, y: 0, haze: 0.12, emit: 0.62 }),
  ]).then((layers) => { for (const l of layers) scene.add(l); }).catch((e) => console.error('painted layers', e));
}

// the hero's pistol: flash, tracer, brass
// the Collectors, the first enemy; ?noenemies keeps the street empty
const enemies = SPRITE || DRAWN || params.has('noenemies') ? null : createEnemies({ scene, hero, director, tpu: TPU });
const gun = SPRITE || DRAWN ? null : createGun({ scene, hero, director, target: enemies?.heroTarget });

// every light also lights the figure's own render
scene.traverse((o) => { if (o.isLight) o.layers.enable(FIGURE_LAYER); });

const post = createPost(renderer, scene, camera, { focus: 22, aperture: 7, maxFar: 3.5, maxNear: 26, bloom: 0.42, bloomRadius: 0.35, bloomThreshold: 1.1 });
if (params.has('bars')) post.grade.uniforms.bars.value = 2.39;

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  post.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);
resize();

// input
const keys = new Set();
const down = (e) => { keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); };
addEventListener('keydown', down);
addEventListener('keydown', (e) => { if (e.code === 'KeyL' && !e.repeat) G.injured = !G.injured; });
addEventListener('keydown', (e) => { if (e.code === 'KeyJ' && !e.repeat) G.fire = true; });
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); G.mouseAim = false; });
// mouse: left fires, right held aims toward the pointer
const cv = renderer.domElement;
cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => { cv.focus(); if (e.button === 0) G.fire = true; if (e.button === 2) G.mouseAim = true; G.pointerX = e.clientX; });
addEventListener('pointerup', (e) => { if (e.button === 2) G.mouseAim = false; });
addEventListener('pointermove', (e) => { G.pointerX = e.clientX; });

const G = { time: 0, x: Number(params.get('x') ?? -4), vx: 0, facing: 1, trainT: Number(params.get('train') ?? 6), input: 0, run: false, injured: params.has('limp'), stillT: 0, runT: 0, stallT: 0, trainMid: -999 };
hero.mesh.position.set(G.x, 0, 0);
director.snap(G.x);

const WALK = 1.7, RUN = 4.6, LIMP = 1.05;
function update(dt) {
  G.time += dt;
  const down = !!enemies?.down;
  const ax = down ? 0 : G.input || ((keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0));
  G.aim = (G.holdAim || G.mouseAim || keys.has('KeyK'));
  const run = !G.aim && (G.run || keys.has('ShiftLeft') || keys.has('ShiftRight'));
  const limping = G.injured || !!enemies?.limping;
  // aiming slows to a careful walk and holds the facing, so moving away back-pedals
  const target = ax * (limping ? LIMP : run ? RUN : WALK) * (G.aim ? 0.55 : 1);
  G.vx += (target - G.vx) * (1 - Math.exp(-dt * (ax ? 9 : 14)));
  if (Math.abs(G.vx) < 0.02 && !ax) G.vx = 0;
  if (down) { /* she keeps the facing she fell with */ }
  else if (G.mouseAim && G.pointerX != null) {
    const p = hero.mesh.position.clone().setY(1.2).project(camera);
    G.facing = G.pointerX > (p.x * 0.5 + 0.5) * innerWidth ? 1 : -1;
  } else if (ax && !G.aim) G.facing = ax;
  G.x = THREE.MathUtils.clamp(G.x + G.vx * dt, -30, 30);
  hero.facing = G.facing;
  hero.condition = limping ? 'injured' : 'normal';
  const move = Math.abs(G.vx) > 3 ? 'run' : Math.abs(G.vx) > 0.15 ? 'walk' : 'idle';
  if (DRAWN) {
    // no gun prop yet: a shot plays the drawn flash frames, then back to aim or moving
    if (G.fire) { hero.play('shoot', true); G.fire = false; }
    if (hero.clip !== 'shoot' || hero.done) hero.play(G.aim ? 'aim' : move);
  } else hero.play(move);
  hero.mesh.position.x = G.x;
  hero.update(dt, G.vx, target);   // target: the asked-for speed, so a stop starts on the key release
  if (gun) gun.update(dt, G);
  if (enemies) enemies.update(dt, G);
  vendor.update(dt);

  // what is happening, for the camera moments
  G.stillT = ax || G.aim || Math.abs(G.vx) > 0.05 ? 0 : G.stillT + dt;
  G.runT = Math.abs(G.vx) > 3 ? G.runT + dt : Math.abs(G.vx) < 2.5 ? 0 : G.runT;
  G.stallT = Math.abs(G.x - VENDOR_X) < 2.5 && Math.abs(G.vx) < 0.05 ? G.stallT + dt : 0;
  director.update(dt, G.x, G.facing, STILL, {
    aim: (G.aim || !!hero.aiming) && !down, injured: limping, down, runT: G.runT, stillT: G.stillT,
    x: G.x, facing: G.facing, foe: down ? null : enemies?.foe(G.x) ?? null,
    atStall: G.stallT > 0.5 || (director.live().some((m) => m.startsWith('stall')) && Math.abs(G.x - VENDOR_X) < 3),
    trainNear: Math.abs(G.trainMid - G.x) < 32,
  });
  if (SPRITE || DRAWN) faceCamera(hero.mesh, camera);
  if (DRAWN) hero.light(scene);
  faceCamera(vendor.mesh, camera);
  post.dof.uniforms.focus.value = camera.position.distanceTo(hero.mesh.position.clone().setY(1.2));

  // train every 22 s, 17 m/s, right to left
  G.trainT += dt;
  const period = 22, tt = G.trainT % period;
  const tx = 150 - tt * 17;
  train.position.x = tx - 24;
  G.trainMid = tx - 7.6;   // middle car centre, for the train moment next frame
  const tc = tx;  // middle car
  trainLight.position.set(tc, TRAIN_Y + 0.8, anchors.DECK_Z + 3.2);
  trainLight.intensity = Math.abs(tc - camera.position.x) < 60 ? 40 : 0;
  rainLights[5].power = trainLight.intensity * 0.3;
  const sp = Math.abs(tx - 24 + 20 - camera.position.x) < 30 && hashTime(G.time) > 0.86 ? 1 : 0;
  spark.position.set(tx + 4, TRAIN_Y + 2.6, anchors.DECK_Z + 2.3);
  spark.intensity = sp * 220;
  sparkGlow.position.copy(spark.position);
  sparkGlow.material.color.setHex(0xcfe9ff).multiplyScalar(sp * 2.5);
  rainLights[6].power = sp * 40;
  rain.uniforms.lCol.value[5].copy(rainLights[5].color).multiplyScalar(rainLights[5].power);
  rain.uniforms.lCol.value[6].copy(rainLights[6].color).multiplyScalar(rainLights[6].power);
  splashes.uniforms.lCol.value[5].copy(rain.uniforms.lCol.value[5]);
  splashes.uniforms.lCol.value[6].copy(rain.uniforms.lCol.value[6]);

  // neon flicker: a rare double blink, never a constant strobe
  const fl = neonFlicker(G.time);
  lights.neon.intensity = 26 * fl;
  rain.uniforms.lCol.value[1].set(0x2fe6d2).multiplyScalar(14 * fl);

  const t = STILL ? 0 : G.time;
  for (const b of breathers) b.sprite.material.color.copy(b.color).multiplyScalar(1 + 0.015 * Math.sin(6.2832 * b.f * t + b.ph));
  lights.sodium.intensity = SODIUM * (1 + 0.015 * Math.sin(6.2832 * 0.6 * t));
  rain.uniforms.time.value = t; splashes.uniforms.time.value = t; cone.uniforms.time.value = t; wet.material.uniforms.time.value = t;
  rain.uniforms.origin.value.set(camera.position.x, 0, 0);
  splashes.uniforms.origin.value.set(camera.position.x, 0, -2);
  post.grade.uniforms.time.value = STILL ? 0 : G.time;
  scene.traverse((o) => { if (o.userData.blink !== undefined && !(PAINTED && o.userData.band)) o.visible = ((G.time + o.userData.blink) % 3) < 0.25; });
}
const hashTime = (t) => { const v = Math.sin(Math.floor(t * 18) * 91.17) * 43758.55; return v - Math.floor(v); };
function neonFlicker(t) {
  const c = t % 9.5;
  return c > 6.0 && c < 6.08 ? 0.15 : c > 6.16 && c < 6.21 ? 0.3 : 1;
}

function draw() {
  if (!SPRITE && !DRAWN) hero.render(renderer, scene, camera);
  if (enemies) for (const f of enemies.figures()) f.render(renderer, scene, camera);
  if (params.get('stage') === 'raw') { renderer.setRenderTarget(null); renderer.render(scene, camera); }
  else post.composer.render();
}

let last = performance.now();
function frame(now) {
  // the rAF timestamp is the frame's start, which can precede the performance.now() above;
  // a negative first step would run every clock backwards
  const rdt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  if (!G.paused) update(rdt * (enemies ? enemies.timeScale(rdt) : 1));   // the test hook pauses to step frames by hand
  last = now;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook: drive and inspect the scene from a browser automation session.
window.__noir = {
  G, director, camera, hero, renderer, scene, post, gun, MOTION, enemies,
  fire() { G.fire = true; },
  aim(on = true) { G.holdAim = on; },
  // render without post-processing, to isolate the scene from the chain
  raw() { renderer.setRenderTarget(null); renderer.render(scene, camera); return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
  step(dt = 1 / 60, n = 1) { for (let i = 0; i < n; i++) update(dt); draw(); return { x: G.x, shot: director.shots.indexOf(director.active), clip: hero.clip }; },
  hold(dir, run = false) { G.input = dir; G.run = run; },
  beat: (k, a, d) => director.beat(k, a, d),
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, textures: renderer.info.memory.textures }),
};
