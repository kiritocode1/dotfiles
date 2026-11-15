---
name: blank-bit-story-001
description: BLANK-BIT_STORY_001. Snapshot of the cinematic 2.5D pixel-noir game work: a rainy underpass scene in three.js (pixel-density world, generated city, rain, wet reflections, director camera, hitscan gunplay with light-casting muzzle flashes, Verlet ragdoll deaths) and the hand-drawn sprite pipeline (agents draw 48x64 text-grid frames pixel by pixel, one state per agent, rendered to sheets and GIFs). Use when continuing that game, building a small noir pixel scene or side-on shooter, or drawing frame-by-frame character sprites with agents.
---

# BLANK-BIT_STORY_001

Story 001 is a playable scene and a sprite method. It is a genre study: rain, night, sodium and
teal light, a lone courier, quick gunfights. It does not copy any existing game's characters,
setting or assets.

There are two parts, both in `assets/underpass/`:

1. **The scene.** One street under a rail viaduct, built in three.js r186. Today the figures are
   a low-poly 3D rig rendered into a small pixel target.
2. **The sprites.** Wren, a night courier, drawn by hand as text grids. These are meant to
   replace the 3D rig, so each pose is a drawing rather than a rendered model.

## Run the scene

Serve `assets/underpass/` with any static server. Use a named portless URL, per the portless
rule. Then open `index.html`.

| Input | Action |
| --- | --- |
| A / D or arrow keys | walk |
| Shift | run |
| K or right mouse | aim |
| J or click | fire |
| L | toggle injured leg (limp) |

| URL param | Effect |
| --- | --- |
| `?seed=N` | reroll the city |
| `?outfit=` | pick a figure outfit |
| `?limp` | start injured |
| `?x=N` | start position |
| `?stage=raw` | skip post-processing |

`lineup.html?pose=idle|walk|run|limp` shows the outfits side by side. `buildings.html` is a
contact sheet of the city generator.

## Scene files

| File | Does |
| --- | --- |
| `main.js` | the loop, input, the street, the train, wiring |
| `lib/world.js` | texel density: `tpuAt(z)` keeps on-screen pixel size equal at every depth |
| `lib/pixel.js` | `PixelCanvas`: paints pixel art with per-texel normals, height and emission, so scene lights shade each texel |
| `lib/city.js` | seeded city: districts, building types, lit floors, cables, five haze bands |
| `lib/painted.js` | turns a painted image into a lit 2.5D layer (resample, split emission, derive relief) |
| `lib/atmos.js` | rain lit by nearby lights, lamp cones, glow cards, wet floor reflection |
| `lib/camera.js` | director: shots by x range, beats for roll, punch-in and shake |
| `lib/post.js` | depth of field from real depth, bloom, tone map, film grade |
| `lib/figure.js` | 3D rig rendered to a 63x68 card at 30 pose fps, hit flail springs |
| `lib/motion.js` | key-pose clips with Catmull-Rom easing (walk, run, limp, skid, aim, hit) |
| `lib/outfits.js` | three outfit designs on one skeleton |
| `lib/ragdoll.js` | Verlet ragdoll: 15 points, ball and hinge joint limits, floor friction |
| `lib/combat.js` | hitscan shots, flash point lights, tracers that shrink into the hit, enemy AI with a red glint tell |
| `lib/rig.js` | older capsule rig baked to an atlas (`?actor=sprite`) |

## Sprite pipeline

All of this lives in `assets/underpass/sprites/`.

- `SPEC.md` is the shared brief every drawing agent reads. It covers the character, the
  48x64 canvas, the 25-colour palette, and the pixel-art and motion rules.
- `model/00.txt` is the reference frame. Every state copies its proportions and positions.
- `<state>/01.txt` to `05.txt` are the frames. One character is one pixel.
- `python3 render.py <state>|all` checks each frame for size and palette errors. It writes
  `<state>/sheet.png`, with the model frame first at 6x, and `<state>/anim.gif`. `all` also
  writes `all.png`, with one row per state.

States drawn so far: idle, walk, run, shoot and death, 5 frames each, all with 0 errors.

### How to draw a state with agents

1. Give one agent one state. It owns only `<state>/`, so parallel agents never collide.
2. The brief points at `SPEC.md` and `model/00.txt`. It then gives the key model positions,
   the beats frame by frame, and the forbidden shortcuts. Agents may not write generator code,
   transform code or code mirroring; every pixel is placed by hand.
3. The agent renders, reads `sheet.png`, and iterates at least twice. It checks the
   silhouette, that the frames loop, and that nothing is cropped.
4. It reports the files, the error count and the weaknesses it left in.
5. If a rate limit cuts an agent off, it may leave a partial state behind. A finisher agent
   reads the existing frames and completes the cycle.

### Known gaps at this snapshot

- Five drawings per state is too few. A run cycle wants about 8, and the frames should be
  held for 2 game frames each.
- Death 03-04 has stiff, straight limbs. The legs swap between 04 and 05.
- Run 05 is too close to 02. The near and far trousers are two close greys.
- Missing states: hit, stagger, knockdown, get-up, turn, skid, reload, jump, land and crouch.
- The game still uses the 3D rig. The sprites are not wired in yet.
- Colour on the sprites is fixed. There is no palette ramp or light response yet.
- Enemies are too dark to read against the street.

## Rules that held

- Hand-drawn characters, stylized 3D environments. Many small lamps give the flat figures
  weight.
- A hit must stop where it lands. The tracer's tail keeps moving after its head clamps at the
  hit, so the streak shrinks into the impact point.
- A shot body is thrown flat and slides; it should not crumple in place.
- Pixel size is the same on screen at every depth.
