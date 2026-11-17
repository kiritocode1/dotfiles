// Ramp shader check: renders drawn frames through lib/ramp.js under render.py's lit rigs and
// diffs every pixel against sprites/<state>/lit.png (the Python colour model), then diffs the
// reference rig against the drawing itself (palette at the authored step). Rim pixels are left
// out of the drawing diff: they stay dark until a lamp sits behind the figure.
//
// ?state=death_chest picks the state. Results are on window.__ramp and printed on the page.
import * as THREE from 'three';
import { W, H, loadBytes, loadFrame, loadMaterials, rampMaterial, setRig } from './lib/ramp.js';

const params = new URLSearchParams(location.search);
const STATE = params.get('state') ?? 'death_chest';
const SP = 'sprites/';
const Z = 6, PY_Z = 6, TOL = 2;          // lit.png is drawn at 6x; TOL absorbs byte truncation
const BG = [18, 22, 28];                 // lit.png's cell background
const RIM = 2;

const out = document.getElementById('out');
const say = (t) => { const p = document.createElement('p'); p.textContent = t; out.append(p); return p; };

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.NoToneMapping;
renderer.setPixelRatio(1);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 10);
cam.position.z = 5;
const rt = new THREE.WebGLRenderTarget(W, H, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter });
rt.texture.colorSpace = THREE.NoColorSpace;

// One frame under one rig, as RGB bytes in image order (row 0 at the top); null where empty.
function shade(mat, frame, rig) {
  mat.uniforms.uIndex.value = frame.index; mat.uniforms.uAux.value = frame.aux;
  setRig(mat, rig);
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(scene, cam);
  const px = new Uint8Array(W * H * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
  renderer.setRenderTarget(null);
  const img = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = ((H - 1 - y) * W + x) * 4;          // GL rows run bottom up
    img.push(px[i + 3] ? [px[i], px[i + 1], px[i + 2]] : null);
  }
  return img;
}

async function main() {
  const [palette, lit, py] = await Promise.all([
    loadMaterials(SP + 'materials.json'),
    fetch(`${SP}${STATE}/lit.json`, { cache: 'no-store' }).then((r) => r.json()),
    loadBytes(`${SP}${STATE}/lit.png`),
  ]);
  const ks = lit.drawings;
  const frames = await Promise.all(ks.map((k) => loadFrame(`${SP}${STATE}/${String(k).padStart(2, '0')}.txt`, palette)));
  const model = await loadFrame(SP + 'model/00.txt', palette);

  const mat = rampMaterial(frames[0], palette, { raw: true });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat));

  // canvas: per rig, the shader cells, the Python cells, then the diff (red = over TOL)
  const cell = (W + 2) * Z, rowH = (H + 2) * Z;
  const cv = document.createElement('canvas');
  cv.width = cell * ks.length * 3 + 2 * Z * 8; cv.height = rowH * lit.rigs.length;
  out.after(cv);
  const g = cv.getContext('2d');
  g.fillStyle = '#08090c'; g.fillRect(0, 0, cv.width, cv.height);
  const put = (ox, oy, x, y, c) => { g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; g.fillRect(ox + x * Z, oy + y * Z, Z, Z); };

  const report = { state: STATE, tol: TOL, rigs: [], drawing: [] };
  lit.rigs.forEach((rig, r) => {
    let bad = 0, exact = 0, total = 0, maxd = 0;
    ks.forEach((k, ci) => {
      const img = shade(mat, frames[ci], rig);
      const ox = ci * cell, oy = r * rowH;
      const pyOx = (ks.length + ci) * cell + Z * 8, dOx = (2 * ks.length + ci) * cell + 2 * Z * 8;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const s = img[y * W + x] ?? BG;
        const j = ((r * (H + 2) * PY_Z + y * PY_Z + 3) * py.w + ci * (W + 2) * PY_Z + x * PY_Z + 3) * 4;
        const p = [py.data[j], py.data[j + 1], py.data[j + 2]];
        const d = Math.max(...s.map((v, c) => Math.abs(v - p[c])));
        const opaque = img[y * W + x] || p.some((v, c) => v !== BG[c]);
        if (opaque) { total++; if (d > TOL) bad++; if (d === 0) exact++; maxd = Math.max(maxd, d); }
        put(ox, oy, x, y, s); put(pyOx, oy, x, y, p);
        put(dOx, oy, x, y, d > TOL ? [255, 40, 40] : opaque ? [40, 46, 52] : [8, 9, 12]);
      }
    });
    report.rigs.push({ rig: rig.name, pixels: total, overTol: bad, exact, maxDiff: maxd });
    say(`${rig.name}: ${bad} of ${total} pixels differ from Python by more than ${TOL}; ${exact} exact; largest difference ${maxd}`);
  });

  // the reference rig must give back the drawing: the palette colour at each authored step
  const ref = lit.rigs[0];
  [...ks.map((k, i) => [`${STATE}/${String(k).padStart(2, '0')}`, frames[i]]), ['model/00', model]].forEach(([name, f]) => {
    const img = shade(mat, f, ref);
    let bad = 0, n = 0;
    for (let i = 0; i < W * H; i++) {
      const a = f.idx[i * 4 + 3], fl = f.idx[i * 4 + 2];
      if (!a || fl & RIM) continue;
      n++;
      const pi = (f.idx[i * 4] * palette.w + f.idx[i * 4 + 1]) * 4;
      const s = img[i];
      if (!s || s.some((v, c) => v !== palette.bytes[pi + c])) bad++;
    }
    report.drawing.push({ frame: name, pixels: n, mismatches: bad });
    say(`${name} under the reference rig: ${bad} of ${n} pixels differ from the drawing`);
  });
  window.__ramp = report;
  document.body.dataset.done = '1';
}

main().catch((e) => { say('error: ' + e.message); console.error(e); window.__ramp = { error: String(e) }; document.body.dataset.done = '1'; });
