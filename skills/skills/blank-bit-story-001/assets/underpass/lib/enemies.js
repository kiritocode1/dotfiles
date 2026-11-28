// Enemies: the Collectors, and the damage both ways. See enemies/plan.md.
//
// Collectors walk in from off screen, stop at their own range, raise the gun, hold the aim
// with a white glint at the muzzle for the last moments (the tell), and fire. A hit staggers
// them and cancels the shot; two put them down. Hits and deaths are keyed performances with
// variants picked at random (motion.js HITS and DEATHS), never physics, and bodies stay.
//
// Every bullet that lands jerks the body where it hits (Figure.impact), sprays blood out of the
// far side and leaves a red mist in the air; a body that stops moving bleeds a pool onto the
// street. A body still falling can be hit again and takes each round.
//
// Januwu takes five. At two left she limps, and health comes back after a few seconds without
// a hit. Her death is the keyed front fall; she gets up again after a beat.
import * as THREE from 'three';
import { Figure } from './figure.js';
import { createGlow } from './atmos.js';
import { createMuzzle } from './gun.js';
import { HITS, DEATHS, DEATH_FRONT, DEATH_FRONT_LEN } from './motion.js';

const HERO_HP = 5, LIMP_AT = 2, ENEMY_HP = 2, MAX_BODIES = 6;
const WALK = 1.5, STREET = [-30, 30];
const RESPAWN = 4.5;                     // seconds on the ground before she gets up
const POOL_GROW = 9;                     // seconds for a pool to reach full size
const BLOOD = () => [0.6 + Math.random() * 0.3, 0.02, 0.035];   // bright enough to read on teal and asphalt
const pick = (list, force) => list[force ?? Math.floor(Math.random() * list.length)];

/** A fixed pool of square pixel particles with gravity and ground contact: blood, sparks, grit. */
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
    /** o: g (gravity), bounce (0..1), stick (rest where it lands), fade, drag. */
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
 * scene, hero (Januwu's Figure), director (camera beats), tpu. Call update(dt, G) each frame
 * after the hero moves, render figures() in draw, and give gun.js heroTarget() as its target.
 */
export function createEnemies({ scene, hero, director, tpu }) {
  const sparks = particles(160, { additive: true, size: 0.011 });
  const matter = particles(240, { size: 0.012 });
  const blood = particles(420, { size: 0.022 });          // 2 px drops at the scene's density
  scene.add(sparks.points, matter.points, blood.points);
  const pools = [];

  // one muzzle rig for every Collector shot (gun.js): flash, light, tracer, brass, smoke
  const rig = createMuzzle(scene, { tracer: [4, 2.2, 1.4] });
  const tmp = new THREE.Vector3();

  const S = { forceDeath: null, forceHit: null, hp: HERO_HP, sinceHit: 99, regen: 0, downT: -1, slow: 0, waveT: 2.5, wave: 0, list: [] };

  /**
   * A bullet wound at `at`, the bullet travelling along dir. A fine mist hangs where it went in;
   * the spray leaves the far side in the bullet's direction and lands as drops that stay on the
   * street; a few drops fall straight from the wound.
   */
  function spray(at, dir, n = 18) {
    for (let i = 0; i < 16; i++)       // mist: slow, short-lived, barely falls
      blood.emit(at.x - dir * 0.04, at.y + (Math.random() - 0.5) * 0.1, at.z + 0.05 + (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.8 - dir * 0.3, (Math.random() - 0.3) * 0.7, (Math.random() - 0.5) * 0.6, BLOOD(), 0.25 + Math.random() * 0.3, { g: 0.8, drag: 4 });
    for (let i = 0; i < n; i++) {      // exit spray: out of the far side, arcs to the ground and stays
      const sp = 1.2 + Math.random() * 3.4;
      blood.emit(at.x + dir * 0.12, at.y + (Math.random() - 0.5) * 0.12, at.z + (Math.random() - 0.5) * 0.2, dir * sp, (Math.random() - 0.1) * 2.2, (Math.random() - 0.5) * 1.2,
        BLOOD(), 8 + Math.random() * 4, { stick: true, fade: false, drag: 1.2 });
    }
    for (let i = 0; i < 5; i++)        // drips from the wound
      blood.emit(at.x, at.y - 0.05, at.z + 0.06, (Math.random() - 0.5) * 0.2, -0.2 - Math.random() * 0.5, 0, BLOOD(), 8, { stick: true, fade: false });
  }

  /** A blob of pixels for a pool: overlapping discs on the scene's 24 texel per metre grid. */
  function poolTexture() {
    const N = 24, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'); g.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) {
      const r = 3 + Math.random() * 5, a = Math.random() * Math.PI * 2, d = i ? Math.random() * 5 : 0;
      g.beginPath(); g.arc(N / 2 + Math.cos(a) * d, N / 2 + Math.sin(a) * d * 0.7, r, 0, Math.PI * 2); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }

  /** A pool under fig's chest, starting once the body has landed (after `delay` seconds). */
  function bleed(fig, delay) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({
      color: 0x5c0710, emissive: 0x1c0205, roughness: 0.18, metalness: 0, alphaMap: poolTexture(), alphaTest: 0.5,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * Math.PI; m.scale.setScalar(0.001);
    m.visible = false; scene.add(m);
    pools.push({ fig, m, t: -delay, size: 1.2 + Math.random() * 0.4 });
    // her own pools stay where she fell, three at most
    const hers = pools.filter((p) => p.fig === hero);
    if (hers.length > 3) { const old = hers[0]; scene.remove(old.m); old.m.material.alphaMap.dispose(); old.m.material.dispose(); pools.splice(pools.indexOf(old), 1); }
  }
  function ricochet(at, dir) {
    for (let i = 0; i < 9; i++) sparks.emit(at.x, at.y, at.z, -dir * (1 + Math.random() * 3), 1 + Math.random() * 3.5, (Math.random() - 0.5) * 2, [3.2, 2.2, 1.1], 0.2 + Math.random() * 0.25, { bounce: 0.3 });
    for (let i = 0; i < 4; i++) matter.emit(at.x, at.y, at.z, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5), [0.12, 0.13, 0.13], 1.2, { bounce: 0.2 });
  }

  // ---------------------------------------------------------------- Collectors

  function spawn(x) {
    const fig = new Figure(tpu, { outfit: 'collector' });
    fig.mesh.position.set(x, 0, -0.5 - Math.random() * 0.5);    // a step behind her lane
    scene.add(fig.mesh, fig.model);
    const glint = createGlow(new THREE.Vector3(), 0xffffff, 0.7, 0);
    scene.add(glint);
    const e = { fig, x, hp: ENEMY_HP, state: 'advance', t: 0, stagger: 0, glint, burst: 0,
      range: 4 + Math.random() * 3,      // close, so a fight frames both bodies large
      hold: 0.5 + Math.random() * 0.3, gap: 0.9 + Math.random() * 0.9 };
    S.list.push(e);
    return e;
  }

  function remove(e) {
    for (const p of pools.filter((p) => p.fig === e.fig)) { scene.remove(p.m); p.m.material.alphaMap.dispose(); p.m.material.dispose(); pools.splice(pools.indexOf(p), 1); }
    scene.remove(e.fig.mesh, e.fig.model, e.glint);
    Figure.all.delete(e.fig);
    e.fig.rt.dispose(); e.fig.rt.depthTexture?.dispose();
    S.list.splice(S.list.indexOf(e), 1);
  }

  function nextWave(heroX) {
    S.wave++;
    const dead = S.list.filter((e) => e.fig.dead);
    while (dead.length > MAX_BODIES - 2) remove(dead.shift());
    const n = Math.min(4, S.wave);
    for (let i = 0; i < n; i++) {
      // the first wave comes from ahead; later ones from both sides, so she is caught between
      const side = S.wave === 1 ? hero.facing : i % 2 ? -1 : 1;
      let x = heroX + side * (13 + Math.floor(i / 2) * 3 + Math.random() * 2);
      if (x < STREET[0] + 1 || x > STREET[1] - 1) x = heroX - side * (13 + Math.random() * 2);
      spawn(THREE.MathUtils.clamp(x, STREET[0] + 1, STREET[1] - 1));
    }
  }

  function damageEnemy(e, dir, at) {
    spray(at, dir);
    e.fig.impact(dir, at.y);
    if (e.state === 'dead') return;                       // a body still falling takes the round
    e.hp--;
    e.x += dir * 0.08;
    e.fig.facing = -dir;                                  // he is turned toward the shooter
    if (e.hp <= 0) {
      const [keys, len] = pick(DEATHS, S.forceDeath);
      e.fig.aiming = false; e.fig.perform(keys, len, { hold: true });
      e.state = 'dead'; e.fallLen = len;
      bleed(e.fig, len * 0.9);
      S.slow = 0.1;                                       // a beat of hitstop on the kill
      director.beat('punch', -1.2, 0.3);
    } else {
      const [keys, len] = pick(HITS, S.forceHit);
      e.fig.perform(keys, len);
      e.stagger = len; e.state = 'recover'; e.t = 0;      // a hit cancels the wind-up
    }
  }

  function damageHero(dir, at) {
    spray(at, dir, 12);
    hero.impact(dir, at.y);
    S.hp--; S.sinceHit = 0; S.regen = 0;
    director.beat('punch', -1.5, 0.12);
    director.beat('roll', 3 * dir, 0.4);
    director.beat('shake', 0.12, 0.2);
    if (S.hp <= 0) { hero.aiming = false; hero.perform(DEATH_FRONT, DEATH_FRONT_LEN, { hold: true }); S.downT = 0; bleed(hero, DEATH_FRONT_LEN * 0.9); }
    else hero.hit();             // by what she is doing: aiming, walking or standing
  }

  function enemyShoot(e, G) {
    const dir = Math.sign(G.x - e.x) || 1;
    const m = e.fig.shoot(new THREE.Vector3());
    const moving = Math.abs(G.vx);
    const chance = moving > 3 ? 0.22 : moving > 0.5 ? 0.42 : 0.58;
    const hit = !hero.dead && Math.random() < chance;
    const end = hit
      ? new THREE.Vector3(G.x - dir * 0.1, 0.9 + Math.random() * 0.65, 0.05)
      : new THREE.Vector3(G.x + dir * (1.5 + Math.random() * 3), 0.02, -0.3 - Math.random() * 1.5);   // a miss kicks up the street behind her
    rig.fire(m, end, dir, hit);
    if (hit) damageHero(dir, end); else ricochet(end, dir);
  }

  function updateEnemy(e, dt, G) {
    const f = e.fig;
    if (e.state === 'dead') { e.glint.material.color.setScalar(0); f.update(dt, 0); return; }
    const dx = G.x - e.x, dist = Math.abs(dx), dir = Math.sign(dx) || 1;
    let vx = 0, tell = 0;
    if (e.stagger > 0) { e.stagger -= dt; f.aiming = false; }
    else {
      f.facing = dir;
      if (hero.dead) { f.aiming = false; e.state = 'advance'; }
      else if (e.state === 'advance') {
        f.aiming = false;
        if (dist > e.range + 0.4) vx = dir * WALK; else { e.state = 'aim'; e.t = 0; }
      } else if (e.state === 'aim') {
        // raise (the aim blend takes about 0.3 s), then hold; the glint lights in the last 0.3 s
        f.aiming = true; e.t += dt;
        const fire = 0.35 + e.hold;
        tell = THREE.MathUtils.smoothstep(e.t, fire - 0.3, fire);
        if (e.t >= fire) {
          enemyShoot(e, G);
          e.burst = e.burst > 0 ? e.burst - 1 : Math.random() < 0.35 ? 1 : 0;
          e.state = 'recover'; e.t = 0;
        }
      } else if (e.state === 'recover') {
        e.t += dt; f.aiming = e.t < 0.35 || e.burst > 0;
        if (e.burst > 0 && e.t >= 0.28) { e.state = 'aim'; e.t = 0.35 + e.hold - 0.05; }   // the pair's second shot has no tell
        else if (e.t >= e.gap) { e.state = dist > e.range + 1.5 ? 'advance' : 'aim'; e.t = 0; }
      }
    }
    // keep a body's width apart from the other Collectors on their feet
    for (const o of S.list) if (o !== e && o.state !== 'dead' && Math.abs(o.x - e.x) < 0.9) e.x += Math.sign(e.x - o.x || 1) * dt * 1.5;
    e.x = THREE.MathUtils.clamp(e.x + vx * dt, STREET[0], STREET[1]);
    f.mesh.position.x = e.x;
    f.update(dt, vx);
    f.muzzle.getWorldPosition(e.glint.position);
    e.glint.material.color.setScalar(tell * 2.4 * (0.85 + 0.15 * Math.sin(G.time * 50)));
  }

  return {
    get hp() { return S.hp; },
    /** Two hits left or fewer: she limps. */
    get limping() { return S.hp <= LIMP_AT && !hero.dead; },
    get down() { return hero.dead; },
    list: S.list,
    figures: () => S.list.map((e) => e.fig),
    /** The x of the nearest Collector on his feet within `reach` of x, or null: the fight framing. */
    foe(x, reach = 11) {
      let best = null, d = reach;
      for (const e of S.list) if (e.state !== 'dead' && Math.abs(e.x - x) < d) { d = Math.abs(e.x - x); best = e.x; }
      return best;
    },

    /** Test hook: always play this variant (an index into motion.js DEATHS / HITS), or null for random. */
    force(death = null, hit = null) { S.forceDeath = death; S.forceHit = hit; },

    /** Time scale for hitstop: call once a frame with the real dt. */
    timeScale(dt) { if (S.slow > 0) { S.slow -= dt; return 0.2; } return 1; },

    /**
     * For gun.js: the hero fired from m along dir. Returns the hit point, or null for a miss.
     * Aimed shots land almost always, hip shots often.
     */
    heroTarget(m, dir) {
      let target = null, best = 26;
      for (const e of S.list) {
        const d = (e.x - m.x) * dir;
        // a body still on its way down can be hit; once it lies still, bullets pass over it
        const falling = e.state === 'dead' && e.fig.act && e.fig.act.t < e.fallLen * 0.75;
        if ((e.state !== 'dead' || falling) && d > 0.3 && d < best) { best = d; target = e; }
      }
      if (!target || Math.random() > (hero.wAim > 0.75 ? 0.95 : 0.6)) return null;
      // where it lands: on a falling body, lower as it goes down
      const fall = target.state === 'dead' ? 1 - Math.min(1, target.fig.act.t / target.fallLen) : 1;
      const at = new THREE.Vector3(target.x - dir * 0.1, (0.95 + Math.random() * 0.75) * (0.35 + 0.65 * fall), target.fig.mesh.position.z);
      damageEnemy(target, dir, at);
      return at;
    },

    update(dt, G) {
      S.sinceHit += dt;
      if (!hero.dead && S.hp < HERO_HP && S.sinceHit > 5) { S.regen += dt; if (S.regen > 2.5) { S.regen = 0; S.hp++; } }
      if (hero.dead) {
        S.downT += dt;
        if (S.downT > RESPAWN) { hero.revive(); S.hp = HERO_HP; S.sinceHit = 99; S.downT = -1; }
      }
      for (const e of [...S.list]) updateEnemy(e, dt, G);
      if (!S.list.some((e) => e.state !== 'dead')) { S.waveT -= dt; if (S.waveT <= 0) { nextWave(G.x); S.waveT = 3; } }

      rig.update(dt);
      sparks.update(dt); matter.update(dt); blood.update(dt);
      for (const p of pools) {
        p.t += dt;
        if (p.t <= 0) continue;
        if (!p.m.visible) {             // the body has landed: the pool starts under the chest
          p.fig.J.spine.getWorldPosition(tmp);
          // a little toward the camera, so the low view sees it spread out from under the body
          p.m.position.set(tmp.x, 0.012, tmp.z + 0.18); p.m.visible = true;
        }
        if (!p.fig.dead) continue;      // she got up: the pool stops growing
        p.m.scale.setScalar(p.size * Math.sqrt(Math.min(1, p.t / POOL_GROW)) + 0.001);
      }
    },
  };
}
