// Januwu's tech: the few things on her that run on power, each a strip of light at least one
// figure texel (about 2 cm) wide so it survives the pixel render. The pistol's charge cell along
// the slide, a wrist display on the left cuff, the clasp where the bag strap crosses her chest,
// and the seal on the courier bag that holds the drive. Everything glows one colour, hers; the
// Tide's tell stays cold white, so in a dark street the colour says which side a light is on.
//
// The glow is HDR (above the bloom threshold), so the post chain blooms it, and one small point
// light at the gun lights her hand and the wet ground a metre around it. A shot drains the cell
// and it refills over REFILL seconds.
import * as THREE from 'three';

export const TECH = { mint: 0x4dffd2, red: 0xff3b48 };
const GLOW = 2.2;               // emissive level of a strip at rest (bloom starts at 0.9)
const CELL = 1.5;               // the gun's cell is dimmer, so the bloom never hides the gun's shape
const LAMP = 0.05;              // the gun light: enough for the hand and the ground under it, never her face
const REFILL = 0.45;            // seconds for the gun's cell to refill after a shot
const BREATH = 0.6;             // Hz, the slow pulse the lamps in the set also have

/**
 * Add the strips to a Januwu body. J: her joints, gun: the pistol group from figure.js, layer:
 * the figure render layer. Returns { light, update(dt, t), shot() }; add light to the scene
 * (not the model, which is hidden while other figures render).
 */
export function addTech(J, gun, layer, color = TECH.mint) {
  const base = new THREE.Color(color);
  const mk = () => new THREE.MeshBasicMaterial({ color: base.clone().multiplyScalar(GLOW), toneMapped: true });
  const body = mk(), cell = mk();
  const box = (w, h, d, m, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return new THREE.Mesh(g, m); };
  const parts = [];
  const put = (parent, mesh) => { parent.add(mesh); parts.push(mesh); return mesh; };

  // gun: the cell on both sides of the slide, a dot at the rear sight
  const slide = gun.children[0];
  for (const sx of [1, -1]) put(slide, box(0.006, 0.13, 0.02, cell, 0.022 * sx, -0.11, 0.05));
  put(slide, box(0.02, 0.02, 0.012, cell, 0, 0.012, 0.083));

  // wrist display: a band round the left forearm, just above the cuff
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.051, 0.051, 0.024, 12, 1, true), body);
  band.position.y = -0.185; put(J.elbowL, band);
  // the clasp where the strap crosses her chest
  const strap = J.spine.children.find((o) => o.isMesh && o.rotation.z < -0.5);
  if (strap) put(strap, box(0.05, 0.032, 0.012, body, 0, 0.03, 0.014));
  // the drive's seal: a lit seam down each side of the bag
  if (J.pack) for (const sx of [1, -1]) put(J.pack, box(0.008, 0.2, 0.024, body, 0.141 * sx, -0.15, 0));

  for (const p of parts) p.layers.set(layer);
  const light = new THREE.PointLight(color, LAMP, 0.9, 2);
  light.layers.enable(layer);
  const at = new THREE.Vector3();
  let sinceShot = 9;

  return {
    light,
    shot() { sinceShot = 0; },
    update(dt, t) {
      sinceShot += dt;
      const pulse = 1 + 0.03 * Math.sin(6.2832 * BREATH * t);
      const fill = THREE.MathUtils.smoothstep(sinceShot, 0.05, REFILL);
      body.color.copy(base).multiplyScalar(GLOW * pulse);
      cell.color.copy(base).multiplyScalar(CELL * pulse * (0.15 + 0.85 * fill));
      gun.visible ? slide.getWorldPosition(at) : J.handR.getWorldPosition(at);
      light.position.copy(at); light.position.y -= 0.12;
      light.intensity = gun.visible ? LAMP * pulse * (0.3 + 0.7 * fill) : 0;
    },
  };
}
