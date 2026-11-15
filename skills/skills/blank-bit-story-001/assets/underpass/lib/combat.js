// Gunplay. Every shot is a real light: the muzzle flash is a point light for a few frames, so
// it lights walls, puddles and the shooter's own face. Bullets are instant (hitscan along the
// street); what the eye follows is a tracer streak that travels to the hit, brass that bounces
// on the asphalt, sparks, and a dark spray that falls and stays.
//
// Enemies walk in from off screen, stop at their own range, raise the gun, show a red glint at
// the muzzle for the last moments of the wind-up (the tell), and fire. A hit staggers them and
// cancels their shot; three hits put them down. The hero takes five; at two left the hero
// limps, and health creeps back after a few seconds without being hit.
import * as THREE from 'three';
import { Figure, FIGURE_LAYER } from './figure.js';
import { createGlow } from './atmos.js';

const HERO_HP = 5, ENEMY_HP = 3, MAX_BODIES = 6;
const FIRE_GAP = 0.2;                    // seconds between hero shots
const ENEMY_WALK = 1.5;
const STREET = [-30, 30];

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
function particles(cap, { additive = false, size = 0.012 } = {}) {
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
    /** o: g (gravity), bounce (0..1), stick (rest on the ground), fade (darken to nothing). */
    emit(x, y, z, vx, vy, vz, c, life, o = {}) {
      const p = P[next]; next = (next + 1) % cap;
      Object.assign(p, { x, y, z, vx, vy, vz, c, life, max: life, g: o.g ?? 9.8, bounce: o.bounce ?? 0, stick: o.stick ?? false, fade: o.fade ?? true, drag: o.drag ?? 0 });
    },
    update(dt) {
      for (let i = 0; i < cap; i++) {
        const p = P[i];
        if (p.life <= 0) { pos[i * 3 + 1] = -100; continue; }
        p.life -= dt;
        p.vy -= p.g * dt;
        const d = Math.exp(-p.drag * dt); p.vx *= d; p.vz *= d;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.01) {
          p.y = 0.01;
          if (p.stick || Math.abs(p.vy) < 0.6) { p.vx = p.vy = p.vz = 0; p.g = 0; }
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
 * scene, hero (a Figure), director (for camera beats), tpu. Returns the combat state; call
 * update(dt, G) each frame after the hero has moved, and render the enemy figures in draw.
 */
export function createCombat({ scene, hero, director, tpu }) {
  const flashTex = flashTextures();
  const sparks = particles(160, { additive: true, size: 0.011 });
  const matter = particles(220, { size: 0.012 });       // blood, brass, grit
  scene.add(sparks.points, matter.points);

  // one flash rig per side, so the light count never changes (a change recompiles every material)
  const rig = () => {
    const light = new THREE.PointLight(0xffb060, 0, 14, 2);
    light.layers.enable(FIGURE_LAYER);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex[0], color: new THREE.Color(5, 3.6, 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    sprite.center.set(0, 0.5); sprite.renderOrder = 7;
    const halo = createGlow(new THREE.Vector3(), 0xffa050, 1.6, 0);
    scene.add(light, sprite, halo);
    return { light, sprite, halo, t: 1 };
  };
  const rigs = { hero: rig(), enemy: rig() };

  const tracers = Array.from({ length: 10 }, () => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    m.renderOrder = 7; scene.add(m);
    return { m, a: new THREE.Vector3(), b: new THREE.Vector3(), t: 1, len: 0 };
  });
  let tracerNext = 0;

  const S = {
    hp: HERO_HP, hurt: 0, sinceHit: 99, regen: 0, respawn: -1,
    cooldown: 0, quickAim: 0, buffered: 0, slow: 0, waveT: 1.2, wave: 0,
    enemies: [],
  };
  const tmp = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);

  function flash(side, at, dir) {
    const r = rigs[side];
    r.t = 0;
    r.light.position.copy(at).add(tmp.set(dir * 0.25, 0.05, 0.3));
    r.sprite.position.copy(at);
    r.sprite.material.map = flashTex[Math.floor(Math.random() * flashTex.length)];
    const s = 0.34 + Math.random() * 0.12;
    r.sprite.scale.set(s * dir, s * 7 / 12, 1);
    r.halo.position.copy(at).add(tmp.set(dir * 0.12, 0, 0.05));
  }

  function tracer(a, b, color) {
    const T = tracers[tracerNext]; tracerNext = (tracerNext + 1) % tracers.length;
    T.a.copy(a); T.b.copy(b); T.t = 0; T.len = a.distanceTo(b);
    T.m.material.color.copy(color);
  }

  function casing(at, dir) {
    matter.emit(at.x - dir * 0.12, at.y + 0.02, at.z + 0.05, -dir * (1.2 + Math.random()), 2.2 + Math.random() * 1.2, 0.4 + Math.random() * 0.6, [0.42, 0.32, 0.14], 5, { bounce: 0.4, fade: false });
  }

  function spray(at, dir, n = 14) {
    for (let i = 0; i < n; i++) {
      const sp = 1 + Math.random() * 3.2;
      matter.emit(at.x, at.y + (Math.random() - 0.5) * 0.15, at.z + (Math.random() - 0.5) * 0.2, dir * sp, (Math.random() - 0.2) * 2.4, (Math.random() - 0.5) * 1.2,
        [0.16 + Math.random() * 0.1, 0.012, 0.016], 7 + Math.random() * 3, { stick: true, fade: false, drag: 1.5 });
    }
    for (let i = 0; i < 5; i++) sparks.emit(at.x, at.y, at.z + 0.1, dir * (2 + Math.random() * 3), (Math.random() - 0.3) * 3, (Math.random() - 0.5) * 2, [3, 1.6, 0.6], 0.12 + Math.random() * 0.1, { g: 6 });
  }

  function ricochet(at, dir) {
    for (let i = 0; i < 9; i++) sparks.emit(at.x, at.y, at.z, -dir * (1 + Math.random() * 3), 1 + Math.random() * 3.5, (Math.random() - 0.5) * 2, [3.2, 2.2, 1.1], 0.2 + Math.random() * 0.25, { bounce: 0.3 });
    for (let i = 0; i < 4; i++) matter.emit(at.x, at.y, at.z, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5), [0.12, 0.13, 0.13], 1.2, { bounce: 0.2 });
  }

  // ---------------------------------------------------------------- enemies

  function spawn(x) {
    const fig = new Figure(tpu, { outfit: 'enforcer' });
    fig.mesh.position.set(x, 0, -0.5 - Math.random() * 0.5);
    scene.add(fig.mesh, fig.model);
    const glint = createGlow(new THREE.Vector3(), 0xff2a1a, 0.9, 0);
    scene.add(glint);
    const e = { fig, x, hp: ENEMY_HP, state: 'advance', t: 0, vx: 0, stagger: 0, glint,
      range: 5 + Math.random() * 4, windup: 0.75 + Math.random() * 0.45, gap: 0.9 + Math.random() * 0.9, burst: 0 };
    S.enemies.push(e);
    return e;
  }

  function remove(e) {
    scene.remove(e.fig.mesh, e.fig.model, e.glint);
    Figure.all.delete(e.fig);
    e.fig.rt.dispose();
    S.enemies.splice(S.enemies.indexOf(e), 1);
  }

  function nextWave(heroX) {
    S.wave++;
    // clear the oldest bodies so the street does not fill up
    const dead = S.enemies.filter((e) => e.fig.dead);
    while (dead.length > MAX_BODIES - 2) remove(dead.shift());
    const n = Math.min(4, 1 + S.wave);
    for (let i = 0; i < n; i++) {
      const side = S.wave === 1 ? 1 : Math.random() < 0.5 ? -1 : 1;
      const x = THREE.MathUtils.clamp(heroX + side * (13 + i * 3.2 + Math.random() * 2), STREET[0] + 1, STREET[1] - 1);
      spawn(Math.abs(x - heroX) < 9 ? heroX - side * 13 : x);
    }
  }

  function damageEnemy(e, dir, at) {
    spray(at, dir);
    e.hp--;
    e.x += dir * 0.12;
    if (e.hp <= 0) {
      e.fig.die(dir); e.state = 'dead'; e.vx = 0;
      S.slow = 0.09;                                       // a beat of hitstop on the kill
      director.beat('punch', -1.2, 0.3);
    } else {
      e.fig.hit(); e.stagger = 0.45; e.state = 'recover'; e.t = 0;   // a hit cancels the wind-up
    }
  }

  function damageHero(dir, at) {
    spray(at, dir, 10);
    S.hp--; S.hurt = 1; S.sinceHit = 0;
    director.beat('shake', 0.16, 0.22);
    if (S.hp <= 0) { hero.die(dir); S.respawn = 3.5; }
    else hero.hit();
  }

  /** Hero shot: hits the nearest enemy ahead, surely when aimed, often when fired from the hip. */
  function heroShoot(G) {
    const dir = G.facing;
    const m = hero.shoot(new THREE.Vector3());
    let target = null, best = 26;
    for (const e of S.enemies) {
      const d = (e.x - G.x) * dir;
      if (!e.fig.dead && d > 0.3 && d < best) { best = d; target = e; }
    }
    const aimed = hero.wAim > 0.75;
    const hit = target && Math.random() < (aimed ? 0.96 : 0.6);
    const end = hit
      ? new THREE.Vector3(target.x - dir * 0.1, 1.15 + Math.random() * 0.35, target.fig.mesh.position.z)
      : new THREE.Vector3(m.x + dir * 30, m.y + (Math.random() - 0.5) * 0.5, m.z - 0.5);
    flash('hero', m, dir);
    tracer(m, end, new THREE.Color(4, 3, 1.6));
    casing(m, dir);
    director.beat('shake', 0.045, 0.1);
    if (hit) damageEnemy(target, dir, end);
  }

  function enemyShoot(e, G) {
    const dir = Math.sign(G.x - e.x) || 1;
    const m = e.fig.shoot(new THREE.Vector3());
    const moving = Math.abs(G.vx);
    const chance = moving > 3 ? 0.22 : moving > 0.5 ? 0.42 : 0.58;
    const hit = !hero.dead && Math.random() < chance;
    const end = hit
      ? new THREE.Vector3(G.x - dir * 0.1, 1.1 + Math.random() * 0.4, 0.05)
      : new THREE.Vector3(G.x + dir * (1.5 + Math.random() * 3), 0.02, -0.3 - Math.random() * 1.5);   // misses kick up the street behind
    flash('enemy', m, dir);
    tracer(m, end, new THREE.Color(4, 2.2, 1.4));
    casing(m, dir);
    if (hit) damageHero(dir, end); else ricochet(end, dir);
  }

  function updateEnemy(e, dt, G) {
    const f = e.fig;
    if (e.state === 'dead') { e.glint.material.color.setScalar(0); f.update(dt, 0); return; }
    const dx = G.x - e.x, dist = Math.abs(dx), dir = Math.sign(dx) || 1;
    f.facing = dir;
    let vx = 0, tell = 0;
    if (e.stagger > 0) { e.stagger -= dt; f.aiming = false; }
    else if (hero.dead) { f.aiming = false; e.state = 'advance'; e.t = 0; }
    else if (e.state === 'advance') {
      f.aiming = false;
      if (dist > e.range + 0.4) vx = dir * ENEMY_WALK; else { e.state = 'aim'; e.t = 0; }
    } else if (e.state === 'aim') {
      f.aiming = true; e.t += dt;
      tell = THREE.MathUtils.smoothstep(e.t, e.windup - 0.35, e.windup);
      if (e.t >= e.windup) {
        enemyShoot(e, G);
        e.burst = e.burst > 0 ? e.burst - 1 : Math.random() < 0.35 ? 1 : 0;
        e.state = 'recover'; e.t = e.burst ? e.gap * 0.75 : 0;
      }
    } else if (e.state === 'recover') {
      e.t += dt; f.aiming = e.t < 0.35 || e.burst > 0;
      if (e.t >= e.gap) {
        e.state = dist > e.range + 1.5 ? 'advance' : 'aim';
        e.t = e.burst ? e.windup - 0.25 : 0;          // the second shot of a burst comes fast, no tell
      }
    }
    // keep a body's width apart from the others
    for (const o of S.enemies) if (o !== e && o.state !== 'dead' && Math.abs(o.x - e.x) < 0.9) e.x += Math.sign(e.x - o.x || 1) * dt * 1.5;
    e.x = THREE.MathUtils.clamp(e.x + vx * dt, STREET[0], STREET[1]);
    e.vx = vx;
    f.mesh.position.x = e.x;
    f.update(dt, vx);
    // the tell: a red glint at the muzzle as the wind-up ends
    f.muzzle.getWorldPosition(e.glint.position);
    e.glint.material.color.set(0xff2a1a).multiplyScalar(tell * 2.2 * (0.8 + 0.2 * Math.sin(G.time * 60)));
  }

  return {
    get hp() { return S.hp; },
    get hurt() { return S.hurt; },
    enemies: S.enemies,
    figures: () => S.enemies.map((e) => e.fig),

    /** Real-time scale for hitstop: call once a frame with the real dt. */
    timeScale(dt) { if (S.slow > 0) { S.slow -= dt; return 0.2; } return 1; },

    /** G.fire (a press, consumed here), G.aim (held). Sets hero.aiming. */
    update(dt, G) {
      // hero
      S.cooldown -= dt; S.quickAim -= dt; S.buffered -= dt;
      if (G.fire) { S.buffered = 0.12; G.fire = false; }
      if (S.buffered > 0 && S.cooldown <= 0 && !hero.dead) {
        S.buffered = 0; S.cooldown = FIRE_GAP; S.quickAim = 0.9;
        heroShoot(G);
      }
      hero.aiming = !hero.dead && (G.aim || S.quickAim > 0);
      S.sinceHit += dt; S.hurt = Math.max(0, S.hurt - dt * 1.6);
      if (!hero.dead && S.hp < HERO_HP && S.sinceHit > 5) { S.regen += dt; if (S.regen > 2.5) { S.regen = 0; S.hp++; } }
      if (hero.dead) { G.x = hero.mesh.position.x; S.respawn -= dt;   // the body slides; the camera follows it
        if (S.respawn <= 0) { hero.revive(); S.hp = HERO_HP; S.sinceHit = 99; } }

      // enemies and waves
      for (const e of [...S.enemies]) updateEnemy(e, dt, G);
      if (!S.enemies.some((e) => e.state !== 'dead')) { S.waveT -= dt; if (S.waveT <= 0) { nextWave(G.x); S.waveT = 3; } }

      // flashes: a couple of frames of light, then gone
      for (const r of Object.values(rigs)) {
        r.t += dt;
        const k = Math.max(0, 1 - r.t / 0.06);
        r.light.intensity = 110 * k * k;
        r.sprite.material.opacity = r.t < 0.045 ? 1 : 0;
        r.halo.material.color.set(0xffa050).multiplyScalar(1.4 * k);
      }
      // tracers travel as a short streak from muzzle to hit
      for (const T of tracers) {
        if (T.t >= 1) { T.m.material.opacity = 0; continue; }
        T.t += dt;
        // the tail keeps travelling after the head stops at the hit, so the streak shrinks into it
        const front = T.t * 95, head = Math.min(T.len, front), tail = Math.max(0, front - 2.4);
        if (tail >= T.len) { T.t = 1; T.m.material.opacity = 0; continue; }
        const dir = tmp.subVectors(T.b, T.a).normalize();
        T.m.position.copy(T.a).addScaledVector(dir, (head + tail) / 2);
        T.m.quaternion.setFromUnitVectors(X, dir);
        T.m.scale.set(Math.max(0.01, head - tail), 0.02, 0.02);
        T.m.material.opacity = 1;
      }
      sparks.update(dt); matter.update(dt);
    },
  };
}
