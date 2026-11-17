---
name: blank-bit-story-001
description: BLANK-BIT_STORY_001. The cinematic 2.5D pixel-noir game work, a rainy underpass scene in three.js with Januwu, a courier built as a realistic 3D body and rendered into the scene's pixel grid, lit by the street's own lamps. Covers the scene (pixel-density world, generated city, rain, wet reflections, director camera with moments, pistol with light-casting muzzle flash), building a realistic character in code from lofted anatomy, arm and hand motion with follow-through, the hand-drawn sprite pipeline with its palette-ramp shader, and the verification tools. Use when continuing this game, building a small noir side-on scene or shooter, making a code-built character look human and move like one, or drawing frame-by-frame sprites with agents.
---

# BLANK-BIT_STORY_001

Story 001 is a playable street scene and a way to put a believable person in it. It is a genre
study of rain, night, sodium and teal light, one courier and quick gunfights. It copies no
existing game's characters, setting or assets.

The bar is REPLACED-level direction: acting, camera and character design. REPLACED draws its
characters as realistic figures inside a pixel world, not as pixel art, and that is the model
here.

Everything is in `assets/underpass/`.

## The direction, as decided

- The hero is **Januwu**, a woman, a night courier. Ochre work jacket open over a dark shirt,
  dark red scarf high at the neck, grey courier bag with a strap across the chest, charcoal
  trousers tucked into boots with pale soles, black shoulder-length hair.
- Characters look realistic and react to the environment. A hand-drawn 48x64 sprite was tried
  as the hero and rejected: it read as pixelated, the anatomy was off, the arms swung like
  levers, and it did not respond to the lamps. The 3D figure render is the hero path.
- Motion runs at 30 poses a second, measured from REPLACED footage, while the camera, rain and
  grain run at the full frame rate.
- Where two animations are both good, keep both and pick one at random.
- Enemies and the ragdoll are out for now. Enemies return later as directed characters, with
  the same brief method as the hero.

## Run the scene

Serve `assets/underpass/` at a named portless URL. Python's default `http.server` drops
requests: it speaks HTTP/1.0 with a listen queue of 5, so the proxy returns 502 for some of the
13 parallel module loads and the page stays black. Use HTTP/1.1 and a deep queue:

```python
class H(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'          # plus Cache-Control: no-store in end_headers
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 256
```

`index.html` prints any startup error on screen, so a black page always names its cause.

| Input | Action |
| --- | --- |
| A / D or arrow keys | walk |
| Shift | run |
| K or right mouse | aim |
| J or click | fire |
| L | toggle injured leg (limp) |

| URL param | Effect |
| --- | --- |
| `?outfit=januwu` | Januwu; also `duster`, `parka`, `shell`, `enforcer` |
| `?actor=drawn` | the hand-drawn sprite through the ramp shader (`&frame=death_chest/04` holds one drawing) |
| `?nomoments` | street zones only, no camera moments |
| `?x=N`, `?limp`, `?seed=N`, `?stage=raw` | start position, start injured, reroll the city, skip post |

`lineup.html?outfits=januwu,parka&pose=idle|walk|run|limp` stands designs side by side.
`rampcheck.html` is the ramp shader's pixel diff. `window.__noir` is the test hook: `step(dt, n)`,
`hold(dir, run)`, `aim(on)`, `fire()`, and `G.paused` to step frames by hand.

## Files

| File | Does |
| --- | --- |
| `main.js` | loop, input, street, train, camera moments, hero wiring |
| `lib/world.js` | texel density: `tpuAt(z)` keeps on-screen pixel size equal at every depth |
| `lib/figure.js` | renders a 3D body each frame into a 63x68 target lit by the scene's lights, shows it on a card; gait, springs, arm follow-through, outlines |
| `lib/januwu.js` | Januwu's body, built from lofted anatomy |
| `lib/outfits.js` | the other designs on one skeleton |
| `lib/motion.js` | key-pose clips with Catmull-Rom easing: walk, run, limp, idle, tired, skid, aim |
| `lib/gun.js` | aim, muzzle flash that lights the shooter, tracer, brass |
| `lib/camera.js` | director: street zones plus moments (run, still, stall, train, aim) |
| `lib/pixel.js` | `PixelCanvas`: pixel art with per-texel normals, so lamps shade each texel |
| `lib/city.js`, `lib/atmos.js`, `lib/post.js`, `lib/painted.js` | city generator; rain, cones, wet floor; depth of field, bloom, grade; painted layers |
| `lib/ramp.js` | palette-ramp shader for hand-drawn frames |
| `sprites/` | the hand-drawn pipeline (below) |

## Building a realistic body in code

`lib/januwu.js` is the method. Capsules and boxes read as a toy even at 60 pixels tall. Each
part is a smooth tube lofted through elliptical rings, `[y, half-width, half-depth, dz, dx]`,
with smooth normals, so the small render gets soft light gradients and a human outline.

- **Shape the rings after the anatomy under the cloth.** Thigh widest just below the hip; calf
  bulging behind the shin (negative dz); waist narrower than hips and chest; chest pushed
  forward. A woman's build: hips wider than the shoulder joints.
- **Proportions for 1.68 m:** about 7.6 heads; legs about half the height; shoulder joints
  0.33 m apart; upper arm 0.28, forearm 0.245, hand 0.145, so hanging fingertips reach
  mid-thigh. The forearm is never longer than the upper arm.
- **Garments are open lofts.** An arc `a0..a1` leaves the jacket open at the front over the
  shirt. A jacket hem is a ring of panels on springs (`hem()`), so it flares with the legs.
- **Hair carries identity at this size.** It is the largest dark shape on the head. Use a true
  near-black (`0x0b0a0c`), not a dark brown: the scene's warm lamps push brown hair to orange.
  Check this in the street, not in a test rig with one coloured light.
- Joint names match `outfits.js`, so `Figure` and `motion.js` drive every body. A body sets
  `J.hipY0` when its hip height differs from the default 0.98.

## Arms and hands

Arms were the worst failure: upper arms that read as stapled to the torso, and forearms that
swing with the upper arm as one rigid lever. Three fixes, all in `lib/figure.js`.

1. **Follow-through.** The forearm and hand each chase their keyed angle on a damped spring
   (zeta about 0.6). They trail the shoulder by about 0.1 s and overshoot when the swing turns
   back. The lag is a layer over the keyed elbow, which already bends most at the front of the
   swing, as a real walk does.
2. **Ranges, measured on the running figure.** Walk: elbow 0.16 to 0.60 rad (9 to 34
   degrees), never locked straight (`ELBOW_MIN`). Run: elbow 0.84 to 1.78 (48 to 102), the
   springs stiffened 3x so the hands stay in loose fists. Wrist within -0.3 to 0.6. A softer
   spring lagged so far it locked the elbow straight for half the cycle; a straight arm reads
   as a stick.
3. **Separation.** The card darkens a texel when a neighbour in the figure's own depth render
   is nearer by more than 7 cm: the line a pixel artist draws where an arm crosses the body.
   The silhouette edge gets its own outline.

Aiming hands the arms back to the keyed pose, so the gun stays on target. When directing any
state, give each hand its own column: what it does, where it is, and whether it reacts.

## The hand-drawn pipeline

Kept for drawn moments and as a direction tool. In `assets/underpass/sprites/`.

- `SPEC.md`: the brief every drawing agent reads (character, 48x64 canvas, materials, hand
  rules, motion, direction). `states.json`: every state's holds, loops and variants.
- `python3 render.py <state>|all` lints (format, ground row 61, no copied frames, palette round
  trip) and writes sheets, APNGs at real holds, lit previews and `materials.json`.
- One agent per state, keys first then in-betweens, every pixel placed by hand, a review of
  silhouette, head and hands first.
- `lib/ramp.js` relights frames: each pixel moves along its material's five-step ramp in
  whole steps, and the lamp hue tints it in six levels. `rampcheck.html` diffs the shader
  against Python's `colour.py`: 0 pixels over 2/255 on four rigs, and the reference rig gives
  back the drawing exactly.
- Limit found in the street: whole-step ramp shifts quantise away the difference between lamps,
  so a sprite looks the same everywhere. That is why the hero moved to the 3D figure render.

## Gotchas that cost a session

- **Canvas readback is not data.** Brave and private Safari add noise to `getImageData`, which
  scrambled material ids into speckles. Load sprite data as text or JSON, never through a canvas.
- **The first `requestAnimationFrame` timestamp can precede `performance.now()`.** Clamp the
  first step to 0 or more, or a frame index goes to -1.
- **Judge colour in the real scene.** A lineup lit by one orange spot made black hair look
  orange and hid the problem.

## Verifying

- `scripts/strip.sh <label> "<query>"` captures ten frames of the hero walking (`RUN=1` to
  run), cropped and joined, through `agent-browser` and the test hook. Compare before and after
  strips, then zoom in on alternate frames.
- Measure joints through `__noir.hero` while stepping: `arms.R.elbow`, `P.armR`. Numbers caught
  the straight-elbow bug that the strip hid.
- A still is not motion. Watch the live scene or record it before calling motion done.

## Open

- Januwu's face is 2 or 3 skin pixels and the arms 2 to 3 pixels wide at scene density. Decide
  whether she gets a finer grid than the world.
- Camera roll: keep the 7 degrees in the last zone, or roll only as a pulse on a hit.
- Enemies, hits and deaths need directed bodies and triggers.
