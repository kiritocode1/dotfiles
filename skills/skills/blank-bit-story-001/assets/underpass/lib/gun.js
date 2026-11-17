// The hero's pistol. Every shot is a real light: the muzzle flash is a point light for a few
// frames, so it lights walls, puddles and the shooter's own face. What the eye follows is a
// tracer streak down the street and brass that bounces on the asphalt.
import * as THREE from 'three';
import { FIGURE_LAYER } from './figure.js';
import { createGlow } from './atmos.js';

const FIRE_GAP = 0.2;                    // seconds between shots
const RANGE = 30;                        // tracer length along the street

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

/** A fixed pool of square pixel particles with gravity, bounce and ground contact. */
function particles(cap, { size = 0.012 } = {}) {
  const pos = new Float32Array(cap * 3).fill(-100), col = new Float32Array(cap * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, vertexColors: true, sizeAttenuation: true, fog: true });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = 5;
  const P = Array.from({ length: cap }, () => ({ life: 0 }));
  let next = 0;
  return {
    points,
    /** o: g (gravity), bounce (0..1), fade (darken to nothing). */
    emit(x, y, z, vx, vy, vz, c, life, o = {}) {
      const p = P[next]; next = (next + 1) % cap;
      Object.assign(p, { x, y, z, vx, vy, vz, c, life, max: life, g: o.g ?? 9.8, bounce: o.bounce ?? 0, fade: o.fade ?? true });
    },
    update(dt) {
      for (let i = 0; i < cap; i++) {
        const p = P[i];
        if (p.life <= 0) { pos[i * 3 + 1] = -100; continue; }
        p.life -= dt;
        p.vy -= p.g * dt;
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
 * scene, hero (a Figure), director (for the camera shake). Call update(dt, G) each frame after
 * the hero has moved.
 */
export function createGun({ scene, hero, director }) {
  const flashTex = flashTextures();
  const brass = particles(60);
  scene.add(brass.points);

  // the flash light always exists and only changes intensity, so the light count never changes
  // (a change recompiles every material)
  const light = new THREE.PointLight(0xffb060, 0, 14, 2);
  light.layers.enable(FIGURE_LAYER);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex[0], color: new THREE.Color(5, 3.6, 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  sprite.center.set(0, 0.5); sprite.renderOrder = 7;
  const halo = createGlow(new THREE.Vector3(), 0xffa050, 1.6, 0);
  scene.add(light, sprite, halo);
  let flashT = 1;

  const tracers = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    m.renderOrder = 7; scene.add(m);
    return { m, a: new THREE.Vector3(), b: new THREE.Vector3(), t: 1, len: 0 };
  });
  let tracerNext = 0;

  let cooldown = 0, quickAim = 0, buffered = 0;
  const tmp = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);

  function shoot(G) {
    const dir = G.facing;
    const m = hero.shoot(new THREE.Vector3());
    const end = new THREE.Vector3(m.x + dir * RANGE, m.y + (Math.random() - 0.5) * 0.5, m.z - 0.5);
    flashT = 0;
    light.position.copy(m).add(tmp.set(dir * 0.25, 0.05, 0.3));
    sprite.position.copy(m);
    sprite.material.map = flashTex[Math.floor(Math.random() * flashTex.length)];
    const s = 0.34 + Math.random() * 0.12;
    sprite.scale.set(s * dir, s * 7 / 12, 1);
    halo.position.copy(m).add(tmp.set(dir * 0.12, 0, 0.05));
    const T = tracers[tracerNext]; tracerNext = (tracerNext + 1) % tracers.length;
    T.a.copy(m); T.b.copy(end); T.t = 0; T.len = m.distanceTo(end);
    brass.emit(m.x - dir * 0.12, m.y + 0.02, m.z + 0.05, -dir * (1.2 + Math.random()), 2.2 + Math.random() * 1.2, 0.4 + Math.random() * 0.6, [0.42, 0.32, 0.14], 5, { bounce: 0.4, fade: false });
    director.beat('shake', 0.045, 0.1);
  }

  return {
    /** G.fire (a press, consumed here), G.aim (held). Sets hero.aiming. */
    update(dt, G) {
      cooldown -= dt; quickAim -= dt; buffered -= dt;
      if (G.fire) { buffered = 0.12; G.fire = false; }
      if (buffered > 0 && cooldown <= 0) {
        buffered = 0; cooldown = FIRE_GAP; quickAim = 0.9;
        shoot(G);
      }
      hero.aiming = G.aim || quickAim > 0;

      // the flash: a couple of frames of light, then gone
      flashT += dt;
      const k = Math.max(0, 1 - flashT / 0.06);
      light.intensity = 110 * k * k;
      sprite.material.opacity = flashT < 0.045 ? 1 : 0;
      halo.material.color.set(0xffa050).multiplyScalar(1.4 * k);
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
      brass.update(dt);
    },
  };
}
