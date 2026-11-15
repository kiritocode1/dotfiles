// Painted layers: a generated or hand-painted image becomes a lit 2.5D layer.
//   1. Resample to the scene's texel grid for its depth (tpuAt), so painted pixels are the
//      same size on screen as every other surface. Downscaling averages, so a painting that is
//      only roughly on a grid still lands on a clean one.
//   2. Split emission: bright, saturated texels (lit windows, neon, lamps) go to the emissive
//      map at full strength and are dimmed in the albedo, so they glow through fog and bloom.
//   3. Derive relief: luminance becomes a height field, the alpha edge gets a bevel, and
//      PixelCanvas turns that into normals, so scene lights graze ledges and cables.
import * as THREE from 'three';
import { PixelCanvas, pixelMaterial } from './pixel.js';
import { tpuAt } from './world.js';

const loadImage = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

/**
 * url: image path. o.z: depth of the layer; o.width: world width (height follows the aspect);
 * o.y: world y of the bottom edge; o.x: centre x. o.emit: luminance threshold for emission
 * (0..1, default 0.62). o.relief: height per unit luminance (default 1.4). o.tint: multiply
 * albedo (Color hex). o.haze: 0..1 mix toward o.hazeColor. Painted layers skip the scene's
 * distance fog, which at these depths would turn them solid fog colour, and take a fixed haze
 * per layer instead, so far layers stay readable but recede.
 */
export async function paintedLayer(url, o = {}) {
  const img = await loadImage(url);
  const z = o.z ?? -30, t = tpuAt(z) * (o.density ?? 1);
  // size by width, or by height (o.height wins), keeping the painting's aspect
  const aspect = img.width / img.height;
  const width = o.height ? o.height * aspect : (o.width ?? 100), height = width / aspect;
  const W = Math.max(2, Math.round(width * t)), H = Math.max(2, Math.round(height * t));

  // average down to the texel grid
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;

  const pc = new PixelCanvas(W, H);
  const emitT = o.emit ?? 0.62, relief = o.relief ?? 1.4;
  const tint = new THREE.Color(o.tint ?? 0xffffff);
  const haze = o.haze ?? 0, hz = new THREE.Color(o.hazeColor ?? 0x1b2c33);
  const hazeRGB = [hz.r * 255, hz.g * 255, hz.b * 255];   // sRGB bytes, like the painting
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, a = px[i + 3];
    if (a < 128) continue;
    const r = px[i], gg = px[i + 1], b = px[i + 2];
    const lum = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
    // a texel glows when it is bright, or fairly bright and strongly coloured (neon)
    const glow = lum > emitT || (lum > emitT * 0.7 && sat > 0.55);
    const col = [r * tint.r, gg * tint.g, b * tint.b].map((v, k) => v + (hazeRGB[k] - v) * haze);
    pc.put(x, y, glow ? col.map((v) => v * 0.55) : col, {
      h: lum * relief, r: glow ? 0.3 : 0.75,
      e: glow ? [r * (1 - haze * 0.6), gg * (1 - haze * 0.6), b * (1 - haze * 0.6)] : null,
    });
  }
  pc.bevelAlpha(1.5, 1.2);

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    pixelMaterial(pc.textures(), { emissiveIntensity: o.emissiveIntensity ?? 1.6 }));
  mesh.material.fog = o.fog ?? false;
  mesh.position.set(o.x ?? 0, (o.y ?? 0) + height / 2, z);
  mesh.receiveShadow = o.receiveShadow ?? false;
  mesh.userData.painted = { url, W, H, t };
  return mesh;
}
