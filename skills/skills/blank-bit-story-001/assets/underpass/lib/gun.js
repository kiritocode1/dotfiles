// Pistols. Every shot is a real light, kept local the way REPLACED keeps it: a short-reach point
// light ahead of the muzzle for about 4 frames lights the gun hand, the wet ground and a nearby
// wall, never the shooter's whole body. A round that lands blooms orange-white at the contact
// point for 5 frames. What the eye follows is a tracer streak
// down the street, brass that bounces on the asphalt, and a puff of smoke that hangs in the rain
// after the flash is gone. createMuzzle is the rig for one shooter or one faction (the
// Collectors share one); createGun is Januwu's trigger on top of it.
import * as THREE from 'three';
import { FIGURE_LAYER } from './figure.js';
import { createGlow } from './atmos.js';

const FIRE_GAP = 0.2;                    // seconds between shots
const RANGE = 30;                        // tracer length along the street
const WAIT_DRAW = 0.45;                  // a shot pressed during the draw waits this long for it
const SNAP_DRAW = 1.6;                   // a hip shot draws this much faster than a held aim

/** Muzzle flash drawn as pixels: three shapes so consecutive shots differ. */
function flashTextures() {
  const shapes = [
    ['....##......', '..#####..#..', '.#########..', '############', '.#########..', '..#####..#..', '....##......'],
    ['......#.....', '..##.###....', '.##########.', '###########.', '.##########.', '..##.###....', '......#.....'],
    ['..#.........', '.####...#...', '#########...', '###########.', '#########...', '.####...#...', '..#.........'],
  ];
  return shapes.map((rows) => {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '#') return;
      const core = x < 4 && Math.abs(y - 3) <= 1;
      g.fillStyle = core ? '#fff6e0' : x < 7 ? '#ffc060' : '#ff7a2a';
      g.fillRect(x, y, 1, 1);
    }));
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}
let FLASH_TEX = null;

/** A fixed pool of square pixel particles with gravity, drag, bounce and ground contact. */
export function particles(cap, { size = 0.012, additive = false } = {}) {
  const pos = new Float32Array(cap * 3).fill(-100), col = new Float32Array(cap * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, vertexColors: true, sizeAttenuation: true, fog: true,
    transparent: additive, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !additive });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = 5;
  const P = Array.from({ length: cap }, () => ({ life: 0 }));
  let next = 0;
  return {
    points,
    /** o: g (gravity, negative rises), bounce (0..1), fade (darken to nothing), drag (per second). */
    emit(x, y, z, vx, vy, vz, c, life, o = {}) {
      const p = P[next]; next = (next + 1) % cap;
      Object.assign(p, { x, y, z, vx, vy, vz, c, life, max: life, g: o.g ?? 9.8, bounce: o.bounce ?? 0, fade: o.fade ?? true, drag: o.drag ?? 0 });
    },
    update(dt) {
      for (let i = 0; i < cap; i++) {
        const p = P[i];
        if (p.life <= 0) { pos[i * 3 + 1] = -100; continue; }
        p.life -= dt;
        p.vy -= p.g * dt;
        const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= p.g < 0 ? d : 1; p.vz *= d;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.01) {
          p.y = 0.01;
          if (Math.abs(p.vy) < 0.6) { p.vx = p.vy = p.vz = 0; p.g = 0; }
          else { p.vy = -p.vy * p.bounce; p.vx *= 0.55; p.vz *= 0.55; }
        }
        const k = p.fade ? Math.max(0, p.life / p.max) : 1;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        col[i * 3] = p.c[0] * k; col[i * 3 + 1] = p.c[1] * k; col[i * 3 + 2] = p.c[2] * k;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
  };
}

/**
 * One muzzle rig: flash light, pixel flash sprite, halo, tracers, brass and smoke. The light
 * always exists and only changes intensity, so the light count never changes (a change
 * recompiles every material). fire(m, end, dir) shoots from muzzle m to end; call update(dt).
 */
export function createMuzzle(scene, o = {}) {
  FLASH_TEX ??= flashTextures();
  const brass = particles(60);
  const smoke = particles(90, { size: 0.03 });
  scene.add(brass.points, smoke.points);
  const light = new THREE.PointLight(0xffb060, 0, 4.5, 2);
  light.layers.enable(FIGURE_LAYER);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: FLASH_TEX[0], color: new THREE.Color(5, 3.6, 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  sprite.center.set(0, 0.5); sprite.renderOrder = 7;
  const halo = createGlow(new THREE.Vector3(), 0xffa050, 1.6, 0);
  const bloom = createGlow(new THREE.Vector3(), 0xffd8a8, 0.8, 0);       // impact, at the contact point
  scene.add(light, sprite, halo, bloom);
  const tint = new THREE.Color(...(o.tracer ?? [4, 3, 1.6]));
  const tracers = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: tint, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    m.renderOrder = 7; scene.add(m);
    return { m, a: new THREE.Vector3(), b: new THREE.Vector3(), t: 1, len: 0 };
  });
  let tracerNext = 0, flashT = 1, hitT = 1;
  const tmp = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);

  return {
    /** hit: the round lands at end (a body), so it blooms there. */
    fire(m, end, dir, hit = false) {
      flashT = 0;
      if (hit) { hitT = 0; bloom.position.copy(end).add(tmp.set(-dir * 0.05, 0, 0.15)); }
      light.position.copy(m).add(tmp.set(dir * 0.55, 0.05, 0.25));
      sprite.position.copy(m);
      sprite.material.map = FLASH_TEX[Math.floor(Math.random() * FLASH_TEX.length)];
      const s = 0.34 + Math.random() * 0.12;
      sprite.scale.set(s * dir, s * 7 / 12, 1);
      halo.position.copy(m).add(tmp.set(dir * 0.12, 0, 0.05));
      const T = tracers[tracerNext]; tracerNext = (tracerNext + 1) % tracers.length;
      T.a.copy(m); T.b.copy(end); T.t = 0; T.len = m.distanceTo(end);
      brass.emit(m.x - dir * 0.12, m.y + 0.02, m.z + 0.05, -dir * (1.2 + Math.random()), 2.2 + Math.random() * 1.2, 0.4 + Math.random() * 0.6, [0.42, 0.32, 0.14], 5, { bounce: 0.4, fade: false });
      // smoke: a few slow grey pixels out of the barrel that rise, spread and thin in the rain
      for (let i = 0; i < 7; i++)
        smoke.emit(m.x + dir * (0.05 + Math.random() * 0.12), m.y + (Math.random() - 0.5) * 0.05, m.z + (Math.random() - 0.5) * 0.06,
          dir * (0.3 + Math.random() * 0.5), 0.1 + Math.random() * 0.15, (Math.random() - 0.5) * 0.2,
          [0.16, 0.17, 0.18].map((v) => v * (0.8 + Math.random() * 0.5)), 0.7 + Math.random() * 0.8, { g: -0.35, drag: 2.2 });
    },
    update(dt) {
      // the flash: a couple of frames of light, then gone
      flashT += dt;
      const k = Math.max(0, 1 - flashT / 0.07);
      light.intensity = 9 * k * k;
      sprite.material.opacity = flashT < 0.045 ? 1 : 0;
      halo.material.color.set(0xffa050).multiplyScalar(1.4 * k);
      hitT += dt;
      const b = hitT < 0.083 ? 1 - hitT / 0.1 : 0;
      bloom.material.color.set(0xffd8a8).multiplyScalar(2.2 * b);
      // tracers travel as a short streak; the tail keeps going after the head stops, so it shrinks
      for (const T of tracers) {
        if (T.t >= 1) { T.m.material.opacity = 0; continue; }
        T.t += dt;
        const front = T.t * 95, head = Math.min(T.len, front), tail = Math.max(0, front - 2.4);
        if (tail >= T.len) { T.t = 1; T.m.material.opacity = 0; continue; }
        const d = tmp.subVectors(T.b, T.a).normalize();
        T.m.position.copy(T.a).addScaledVector(d, (head + tail) / 2);
        T.m.quaternion.setFromUnitVectors(X, d);
        T.m.scale.set(Math.max(0.01, head - tail), 0.02, 0.02);
        T.m.material.opacity = 1;
      }
      brass.update(dt); smoke.update(dt);
    },
  };
}

/**
 * Januwu's trigger. scene, hero (a Figure), director (camera beats), target (optional): called
 * with the muzzle position and direction on each shot, returns the point it hit or null for a
 * miss. Call update(dt, G) each frame after the hero has moved.
 *
 * A press with the gun down is a hip shot: the gun draws fast and the round goes the moment the
 * arm is on the line (hero.onTarget), so the bullet leaves where she points, never from the hip.
 */
export function createGun({ scene, hero, director, target }) {
  const rig = createMuzzle(scene);
  let cooldown = 0, quickAim = 0, buffered = 0;

  function shoot(G) {
    const dir = G.facing;
    const m = hero.shoot(new THREE.Vector3());
    const hit = target?.(m, dir) ?? null;
    const end = hit ?? new THREE.Vector3(m.x + dir * RANGE, m.y + (Math.random() - 0.5) * 0.5, m.z - 0.5);
    rig.fire(m, end, dir, !!hit);
    director.beat('shake', 0.045, 0.1);
    director.beat('punch', -0.7, 0.14);
  }

  return {
    /** G.fire (a press, consumed here), G.aim (held). Sets hero.aiming. */
    update(dt, G) {
      cooldown -= dt; quickAim -= dt; buffered -= dt;
      if (G.fire) {
        G.fire = false;
        if (!hero.dead) { buffered = WAIT_DRAW; quickAim = Math.max(quickAim, WAIT_DRAW + 0.1); }
      }
      hero.aiming = !hero.dead && (G.aim || quickAim > 0);
      hero.drawRate = G.aim ? 1 : SNAP_DRAW;
      if (buffered > 0 && cooldown <= 0 && hero.onTarget) {
        buffered = 0; cooldown = FIRE_GAP; quickAim = 0.9;
        shoot(G);
      }
      rig.update(dt);
    },
  };
}
