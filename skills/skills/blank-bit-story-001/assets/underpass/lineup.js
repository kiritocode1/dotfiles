// Outfit lineup: the three character designs side by side, same lights, same pixel density as
// the game. ?pose=idle|walk|run|limp sets the motion; the figures move in place.
import * as THREE from 'three';
import { Figure } from './lib/figure.js';
import { TPU } from './lib/world.js';

const params = new URLSearchParams(location.search);
const POSE = params.get('pose') ?? 'walk';
const SPEED = { idle: 0, walk: 1.7, run: 4.6, limp: 1.05 }[POSE] ?? 1.7;

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1a1f);
scene.fog = new THREE.FogExp2(0x16252b, 0.012);
const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 200);

// a back wall and a wet-dark floor, so the silhouettes sit against something
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ color: 0x24333a, roughness: 0.9 }));
wall.position.set(0, 6, -3); scene.add(wall);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ color: 0x15191b, roughness: 0.35 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);

scene.add(new THREE.HemisphereLight(0x284450, 0x0a0b0c, 0.55));
const sodium = new THREE.SpotLight(0xff8f3a, 90, 0, 0.75, 0.6, 2); sodium.position.set(-2.5, 5.5, 1.2); sodium.target.position.set(0, 0, 0);
scene.add(sodium, sodium.target);
const neon = new THREE.PointLight(0x2fe6d2, 14, 12, 2); neon.position.set(4.5, 2.6, -1.5); scene.add(neon);

// ?outfits=januwu,parka picks which designs stand in the row
const OUTFIT_KEYS = (params.get('outfits') ?? 'duster,parka,shell').split(',');
const figs = OUTFIT_KEYS.map((key, i) => {
  const f = new Figure(TPU, { outfit: key });
  f.mesh.position.set((i - 1) * 2.6, 0, 0);
  f.condition = POSE === 'limp' ? 'injured' : 'normal';
  scene.add(f.mesh, f.model);
  return f;
});
scene.traverse((o) => { if (o.isLight) o.layers.enable(1); });

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  camera.position.set(0, 1.6, 11); camera.lookAt(0, 1.05, 0);
}
addEventListener('resize', resize); resize();

const G = { paused: false, t: 0 };
function step(dt) {
  G.t += dt;
  for (const f of figs) { f.facing = 1; f.update(dt, SPEED); }
}
let last = performance.now();
function frame(now) {
  if (!G.paused) step(Math.min(0.05, (now - last) / 1000));
  last = now;
  for (const f of figs) f.render(renderer, scene, camera);
  renderer.setRenderTarget(null); renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__lineup = {
  G, figs, camera,
  step(dt = 1 / 30, n = 1) { for (let i = 0; i < n; i++) step(dt); for (const f of figs) f.render(renderer, scene, camera); renderer.setRenderTarget(null); renderer.render(scene, camera); },
};
