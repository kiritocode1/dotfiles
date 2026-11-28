---
name: blank-bit-story-001
description: BLANK-BIT_STORY_001. The cinematic 2.5D pixel-noir game work, a rainy underpass scene in three.js with Januwu, a courier built as a realistic 3D body and rendered into the scene's pixel grid, lit by the street's own lamps. Covers the scene (pixel-density world, generated city, rain, wet reflections, a blurred foreground layer, director camera with moments and REPLACED-scale fight framing, a rim lit by the set's own lamps), gunfights (a drawn pistol with low ready, keyed shot beats, light-casting muzzle flash and smoke; Collector enemies with keyed hits and deaths, blood), her tech glow (gun cell, wrist band, clasp and bag seams that bloom and light the hand), Verlet cloth for coats and scarves, REPLACED drawn timing (12 to 14 drawings a second), building a realistic character in code from lofted anatomy, arm and hand motion with follow-through, the hand-drawn sprite pipeline with its palette-ramp shader, and the verification tools. Use when continuing this game, building a small noir side-on scene or shooter, making a code-built character look human and move like one, or drawing frame-by-frame sprites with agents.
---

# BLANK-BIT_STORY_001

Story 001 is a playable street scene and a way to put a believable person in it. It is a genre
study of rain, night, sodium and teal light, one courier and quick gunfights. It copies no
existing game's characters, setting or assets.

The bar is REPLACED-level direction: acting, camera and character design. REPLACED draws its
characters as realistic figures inside a pixel world, not as pixel art, and that is the model
here.

The game is in `assets/underpass/`. The measurements behind every number below are in
`research/`, taken from REPLACED gameplay footage and the sprite pipeline work:

| Note | Covers |
| --- | --- |
| `research/density.md` | drawings per second, hold lengths, the ~3 px grid |
| `research/staging.md` | hero height in the frame for explore, dialogue and fight |
| `research/depth-light.md` | parallax bands, fog curve, light events |
| `research/performance.md` | acting beats: draw, shot, hit, death, hands |
| `research/states.md` | every animation state, its holds and variants |
| `research/transitions.md` | the built transitions, their measured holds, the gate |
| `research/colour.md` | the palette-ramp colour system for hand-drawn frames |

Claims in them are tagged `[read]`, `[inferred]` or `[proposed]`. Trust `[read]` measurements;
treat `[proposed]` as a design that may since have changed (this file wins).

## The direction, as decided

- The hero is **Januwu**, a woman, a night courier. Ochre work jacket open over a dark shirt,
  dark red scarf high at the neck, grey courier bag with a strap across the chest, charcoal
  trousers tucked into boots with pale soles. Her face and hair follow the user's reference
  photo: warm medium-brown skin, strong dark brows, full lips, big black curly hair parted near
  the middle and falling past the shoulders, the face left open. She kills people; the pistol
  is hers.
- Her tech glows red (`#ff3b48`), the user's pick. The Tide, the planned police faction, get
  cold white, so in a dark street a light's colour says which side it belongs to.
- Characters look realistic and react to the environment. A hand-drawn 48x64 sprite was tried
  as the hero and rejected: it read as pixelated, the anatomy was off, the arms swung like
  levers, and it did not respond to the lamps. The 3D figure render is the hero path.
- Motion is drawn timing: a new drawing 12 to 14 times a second with varied holds, measured from
  REPLACED footage (see Drawn timing). The camera, rain and grain run at the full frame rate.
- Where two animations are both good, keep both and pick one at random.
- Enemies are back as directed characters: the Collector (`lib/collector.js`), lofted like
  Januwu. Hits and deaths are keyed performances with random variants, never a ragdoll.
- Fights are framed at REPLACED's scale. Measured from its footage (see "Staging a fight"):
  the hero is 12 to 18% of the frame height exploring, about 27% in dialogue, and 32 to 42% in
  a fight.

## Run the scene

Serve `assets/underpass/` at a named portless URL with `scripts/serve.py` (run from the folder
holding `underpass/`: `portless underpass.dotfiles python3 -I <skill>/scripts/serve.py`). Python's default `http.server` drops
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
| `?outfit=januwu` | Januwu (default); also `courier` (the first body), `duster`, `parka`, `shell`, `enforcer` |
| `?glow=red` | her tech colour: `red` (default), `mint`, or `off` |
| `?density=N` | figure texels per scene texel; default 2, `1` matches the walls (see Figure density) |
| `?timing=smooth` | the old interpolated timing, 30 poses a second, to compare against drawn timing |
| `?actor=drawn` | the hand-drawn sprite through the ramp shader (`&frame=death_chest/04` holds one drawing) |
| `?nomoments` | street zones only, no camera moments |
| `?noenemies` | an empty street, no Collectors |
| `?nostreet` | drops the street front behind the viaduct, to compare depth |
| `?norim` | turns the set rim off, to compare |
| `?bars` | 2.39:1 letterbox bars |
| `?train=N` | seconds into the train's 22 s cycle; `train=12` keeps it away while testing |
| `?x=N`, `?limp`, `?seed=N`, `?stage=raw` | start position, start injured, reroll the city, skip post |

`?painted` swaps the city bands for painted PNGs from `assets/bg/`. Those images are not
shipped (the folder is empty), so it hides the bands and logs a load error. Leave it alone
unless you paint the layers.

`lineup.html?outfits=januwu,parka&pose=idle|walk|run|limp` stands designs side by side;
`&densities=1,2,3` stands one design at several figure densities. The lineup has no tech glow.
`rampcheck.html` is the ramp shader's pixel diff. `window.__noir` is the test hook: `step(dt, n)`,
`hold(dir, run)`, `aim(on)`, `fire()`, `enemies.force(death, hit)` to pin a variant,
`enemies.foe(x)` for the nearest standing Collector, `director.live()` for the moments weighing
on the frame, and `G.paused` to step frames by hand.

## Files

| File | Does |
| --- | --- |
| `main.js` | loop, input, street, train, camera moments (including the fight framing), hero wiring |
| `lib/world.js` | texel density: `tpuAt(z)` keeps on-screen pixel size equal at every depth; the street, stall, lamp, and the near layer (`foreground()`) |
| `lib/figure.js` | renders a 3D body each frame into a target lit by the scene's lights, shows it on a card; gait, springs, arm follow-through, the gun layers, the card's pixel pass (outline, depth line, set rim) |
| `lib/enemies.js`, `lib/collector.js` | Collector waves, brain, damage both ways, blood and pools; the Collector's body |
| `lib/januwu.js` | Januwu's body, built from lofted anatomy |
| `lib/cloth.js` | Verlet cloth for skirts, hems and scarf tails; stepped by `Figure.update` after the pose |
| `lib/outfits.js` | the other designs on one skeleton |
| `lib/motion.js` | key-pose clips with Catmull-Rom easing: walk, run, limp, idle, tired; transitions authored as drawings (starts, stops, skid, turns, holster, hits while moving); pistol READY, DRAW, AIM, SHOT, `aimLife`; hits and deaths |
| `lib/tech.js` | her glowing strips: gun cell, rear sight dot, wrist band, chest clasp, bag seams, one weak gun light |
| `lib/gun.js` | `createMuzzle` (flash light, pixel flash, halo, tracer, brass, smoke; one per shooter or faction) and Januwu's trigger, which waits for the draw |
| `lib/camera.js` | director: street zones plus moments (run, still, stall, train, fight, down); a moment value may be a function of the game state |
| `lib/pixel.js` | `PixelCanvas`: pixel art with per-texel normals, so lamps shade each texel |
| `lib/street.js` | the street front behind the viaduct at REPLACED's facade speed: shops, wall lamps, alleys, people, props, bulb strings, breathing glows |
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
  shirt.
- **Anything that hangs is cloth, never rigid panels.** Coat skirts, jacket hems and scarf
  tails are sheets in `lib/cloth.js` (`skirt()`, `strip()`): a grid of points under gravity,
  held by distance constraints, sewn to a joint, pushed out of leg capsules and stopped by the
  street. Rigid panels on springs fanned out into spokes when a body fell on its side (the hips
  rolled 80 degrees and nothing held them). Three settings make it read as fabric:
  - quadratic air drag (`AIR`), so a coat trails about 40 degrees at a run and hangs at a walk;
    a weak linear drag left it swinging like a pendulum, in front of the hips mid-run;
  - a front `split` that widens to the hem, as a coat buttoned to the waist parts below it; a
    closed tube got shoved ahead of the body by every forward knee;
  - the mesh is rewritten only on pose ticks, so cloth holds like drawn frames with the body.
- **Hair carries identity at this size.** It is the largest dark shape on the head. Use a true
  near-black (`0x0b0a0c`), not a dark brown: the scene's warm lamps push brown hair to orange.
  Check this in the street, not in a test rig with one coloured light.
- **The face is one or two texels per feature.** Brows and eyes are dark bars that read as a
  look, the nose a lighter ridge, the lips one darker row. Curly hair is a cap with lumpy
  per-vertex radius, a curtain open at the face (half-angle 1.3 rad) and 28 clumps.
- Joint names match `outfits.js`, so `Figure` and `motion.js` drive every body. A body sets
  `J.hipY0` when its hip height differs from the default 0.98.

## Figure density

The figure renders at its own texel density, a multiple of the world's (`DENSITY` in
`lib/figure.js`, `?density=N`). At 1 she matches the walls: about 42 px tall, a face of 2 or 3
skin pixels, arms 1 to 2 px wide. The default 2 gives her four texels for each one of the set,
so the face and hands resolve while she still reads as pixel art. 3 adds little at game
distance and starts to look like plain 3D. Compare with
`lineup.html?outfits=januwu&densities=1,2,3`.

## Tech glow

`lib/tech.js` adds the few things on her that run on power. Each strip is at least one figure
texel (about 2 cm) wide, or the pixel render drops it.

- Strips: the charge cell along both sides of the slide, a dot at the rear sight, a band round
  the left forearm, the clasp where the bag strap crosses her chest, and a seam down each side
  of the bag.
- The strips are unlit `MeshBasicMaterial` at 2.2x the colour, above the bloom threshold
  (0.9), so the post chain blooms them. The gun cell runs at 1.5x so the bloom never hides the
  gun's shape.
- The card's pixel pass skips any texel brighter than 1.6, so no outline or depth line darkens
  a glowing strip.
- A shot drains the cell to 15% and it refills over 0.45 s (`tech.shot()`, called from
  `Figure.shoot`). Everything pulses 3% at 0.6 Hz, the set lamps' breathing rate.
- One point light rides the gun: intensity 0.05, reach 0.9 m. It lights the hand and the wet
  ground under it. At 0.7 it flooded her whole figure green.
- `Figure` builds it when `o.tech` names a colour in `TECH`; `main.js` passes `?glow`, default
  `red`. Add `hero.tech.light` to the scene, not the model, which is hidden while other figures
  render.

Measured in the skill's copy: the gun light reads 0.049 before a shot, 0.015 three frames after,
0.051 after 40 frames.

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

## Drawn timing

REPLACED's hero changes drawing 12 to 13 times a second. Holds vary: 2, 3, 4 and 6 frames at
60 fps are common, and key poses hold 10 to 14 (measured by frame-stepping gameplay footage,
`research/density.md`). Sampling a curve every frame or every other frame makes
every frame an in-between, and that reads as 3D however good the poses are.

- Keys are extremes. `lib/motion.js` places in-betweens on the same curve at most 7 frames
  apart, so eases survive as spacing, and holds each drawing until the next. A clip carries its
  nominal length in frames (`keys.frames`); `drawings([[holdFrames, pose], ...])` authors a clip
  as drawings directly.
- `Figure.update` makes a new drawing only when a playing clip moves on to its next drawing (at
  least 2 frames apart; at most 12 frames with nothing changing). Springs, breath, bullet jolts,
  the yaw and the cloth step every frame but are written to the body only on a new drawing, so
  nothing moves between drawings while the figure glides across the street. A shot or a hit
  forces a drawing on its frame.
- `drawings()` marks a clip `exact`: each drawing holds exactly its frames, never split by an
  in-between. Only the gait does not count while a transition hides it, and an upper-body layer
  over the legs waits 4 frames between changes (`LAYER_HOLD`), or the two layers' drawings fall
  out of step and the body changes every 2 frames.
- Measured in the game: walk 12.25 redraws/s, run 13.5, idle 9, aim 8.8, against REPLACED's 12
  to 13 at a mean hold of 4.4 to 5.3. `?timing=smooth` restores the old timing (30 interpolated
  poses a second) for comparison.

## Transitions

Every change of state is a short clip of its own drawings, never a blend between loops
(`research/states.md`). Each clip's brief sits above it in `lib/motion.js`: one row per drawing,
what the body does and why, then the hold. The gate record, with measured holds, is
`research/transitions.md`.

| Clip | Plays when | Drawings |
| --- | --- | --- |
| `START_WALK` | moving from rest | shift, lift, reach, then the walk's contact |
| `START_RUN` | moving from rest at run speed | load, drive, flight (sprint propulsion) |
| `RUN_PUSH` | Shift while walking | drive, flight |
| `STOP_WALK` | key released at a walk | plant, gather, settle, rest |
| `SKID` | key released at a run | dig, slide (held 8), absorb, rise, past upright, rest |
| `TURN_LEFT/RIGHT` | facing flips at a walk | brake, pivot, square, step out |
| `TURN_RUN_LEFT/RIGHT` | facing flips at a run | plant, slide, pivot, drive, flight |
| `HOLSTER` | low ready runs out | lower, release, rest; not the draw reversed |
| `HIT_WALK`, `HIT_AIM` | hit while moving or aiming | upper body only (`UPPER`), the legs keep going |

- `Figure.transition(keys, kind)` plays one; it replaces the whole body until it ends. `main.js`
  passes the asked-for speed as `update(dt, vx, goal)`, so a stop starts on the key release while
  the body still slides, not once it halts.
- Starts and stops come for both feet (`feet()` mirrors a clip). Stops and the push pick the foot
  from the gait phase; a start picks one at random.
- A clip that hands over to a gait stops on the drawing before the contact and sets `endPhase`;
  the gait then shows its own contact drawing. A contact drawing in the clip as well was held
  twice.
- `Figure.hit()` picks the hit by what she is doing: aiming (the gun is knocked off the line and
  pulled back), moving (upper body), or standing (whole body). A performance's first drawing
  goes up whole on its frame.
- **Set hipY from the legs.** Januwu's ankle hangs `0.41 cos(thigh) + 0.39 cos(thigh - knee)`
  below the hip, 0.80 standing. Guessed values sank a pivot 11 cm into the street and floated a
  slide 9 cm above it. Upper-body layers leave hipY out: a dropped hip over straight walking legs
  pushes the feet through the street.
- **In profile, a pose must be large to read.** An 8 degree lean back on the skid did not show
  at all; it takes 17 degrees with the free arm thrown forward and the gun arm swung back.
  A hit that dropped the gun 25 degrees did not read either; 55 degrees held 5 frames does.

## Staging a fight

Measured from REPLACED footage (`research/staging.md`): explore at 12 to 18% hero
height, dialogue about 27%, fight 32 to 42%. Our explore framing already sat at about 16%. The
gap was the fight, which framed her at 21% with the Collector off screen.

The `fight` moment in `main.js` turns on while she aims, has the gun drawn, or a Collector on
his feet is within 11 m. Its `dist` and `lead` are functions of the game state, read every frame:

- `dist` is the larger of two numbers: the distance that makes her 36% of the frame height, and
  the distance that fits both bodies inside the middle 72% of the frame width. It is clamped to
  10 to 20 m. This is why Collectors now stop at 4 to 7 m: farther apart, the fit wins and she
  shrinks.
- `lead` centres the frame between her and the Collector.
- `dz`, the follow dead zone, drops from 0.6 to 0.12. A 0.6 m dead zone held the frame 0.6 m
  off centre once the Collector stopped, putting her at x 0.07.
- It sets every framing value, `height` and `focusY` included. A train moment still easing out
  under the aim used to drag `focusY` to 5 and push her feet off the bottom edge.

Measured with `scripts/shot.sh`: hero 0.36 of frame height, feet at 0.79, hero x 0.14,
Collector x 0.82.

## Set rim

A dark coat on a dark wall disappears; REPLACED separates every figure with light from the set.
`Figure.setRim` sums the scene's lamps that stand behind the figure, as seen from the camera,
into one colour and one screen direction each frame. Each lamp counts by its power at the
figure (inverse square, cut at its range) times how far behind the figure it stands. Under the
sodium lamp the edge goes orange; by the stall it goes teal.

The rim is applied in the card's pixel pass, not as a Fresnel term in the materials. A Fresnel
rim lit whole surfaces that merely face up: raised arms and the hair crown went fully orange.
The pass lights a texel when the texel one or two steps toward the lamps is empty, or is farther
back by `EDGE_GAP`. That gives a drawn 1 to 2 texel line on the lamp side of every edge, arms
crossing the body included, and a rim-lit texel drops the outline. Tune it with `RIM_GAIN` and
`RIM_MAX`.

## Depth

`foreground()` in `lib/world.js` is the near layer. It holds pipe railings, a dumpster, crates
and overhead cables at z 7 to 7.6, between the camera and the lane. Depth of field blurs them
into dark silhouettes, so a frame reads in three depths. Keep the layer low, or mostly holes.
At z 4.2 the railing crossed her legs in the low fight camera; at z 7, 1 m tall, it projects
below her feet line. Moving the posts to z 5 for REPLACED's measured 1.2 to 1.5x near speed put
a black column across the fight: our camera runs 10 to 25 m from the lane, REPLACED's is fixed,
so one depth cannot match its ratio in every shot. The near layer stays at 7.

REPLACED's depth is not many layers. It is a densely dressed band moving at 0.65 to 0.9 of the
play plane, a fog-and-bulbs band at 0.3 to 0.5, and a background that holds still except for
lamps breathing (`research/depth-light.md`). Speed at depth z is `D / (D - z)` for a camera D
from the lane.

- **The street front** (`lib/street.js`) is that first band: frontage at z -10 (0.63 to 0.69x),
  props at z -8.4, alley recesses at z -13 between some buildings. It is what stands behind
  every fight. People are painted silhouettes with a dim self-lit fill, a rim on one side and a
  rain sheen on top edges. Rim-only figures read as stencilled outlines.
- **Fog curve, measured.** The city bands get haze 0.4 to 0.76, a self-light of `haze * LIFT`
  and windows dimmed by `haze * DIM` (`lib/city.js`). With grain off, the far bands measure
  1.6x the play plane's mean luma at 0.6x its edge contrast, against REPLACED's about 1.7x and
  0.5x. Measure with grain off: the grain sets an edge floor that hides the difference.
- **Haze cards** run at half strength. At full strength they turned every gap near the ground
  into one flat blue sheet.
- **Breathing.** Every lamp glow and the sodium light pulse at 0.5 to 0.7 Hz by 1.5%.

## The pistol, beat by beat

These are the layers over the gait, upper body only. Each one is from `research/performance.md`
and `research/states.md`.

The gun has to read first. At game scale a texel is about 2 cm, and a matte near-black pistol held
at the three-quarter turn was two dark texels lost in the hand. Three things fixed it: aiming turns
the body to near profile (`AIM_TURN`), so the arms and gun cross the background instead of pointing
at the camera; the steel is worn gunmetal one value step above the coats, with a polished one-texel
top edge that catches the nearest lamp; and the pistol is about 1.2x real size.

1. **Low ready** (`READY`). After the last aim the gun stays out for 2.2 s, muzzle at the street
   a step ahead, support hand on it. Running puts it away. Collectors carry it like this between
   shots.
2. **Draw** (`DRAW`, 0.27 s). It comes up close to the chest with the elbow bent, punches out,
   overshoots past the sights by a hair, then settles. From low ready it skips the lift. A hip
   shot (fire with no aim held) draws 1.6x faster, and the round waits for `hero.onTarget`, so
   it leaves where she points, about 0.16 s after the press. It never fires from the hip.
3. **Aim held, not frozen** (`aimLife`). A slow sway runs under the aim, and every 3.7 s the
   barrel sags and is pulled back up.
4. **Shot** (`SHOT`, 0.22 s, offsets added on top of the aim). `Figure.shoot` forces a pose
   tick, so the flash frame is the next pose drawn. Beat 1: the shoulders drive back and the
   wrist flips. Beat 2: the recoil peak, and the head turns away from her own shot (the
   character). Then a dip under the line and a settle. Muzzle rise at the peak is about 22
   degrees. The first pass had 43 degrees, which threw the hand over her head. The slide racks
   back for two frames.
5. **Muzzle** (`createMuzzle`). Each shot gives a pixel flash, a tracer, brass and smoke that
   rises and thins, plus a local light for about 4 frames: intensity 9, reach 4.5 m, 0.55 m
   ahead of the muzzle. It lights the gun arm, the jacket front and the wet ground. The old 60
   with 14 m reach, 0.3 m from her body, lit her whole figure flat orange for a frame, which
   REPLACED never does. A round that lands blooms orange-white at the contact point for 5
   frames (`fire(m, end, dir, hit)`).

The wrist is a pose channel now (`wristL`, `wristR` in `CHANNELS`), so keyed clips can flip it.

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
- **`agent-browser wait --fn 'window.__noir'` fails** with "Object reference chain is too long",
  because it serialises the hook. Wait on `'!!window.__noir'`.
- **The agent-browser error buffer survives page loads.** Run `agent-browser errors --clear`
  before a check, or an old shader error reads as a new one.
- **Use a named session** (`AGENT_BROWSER_SESSION=underpass`). The default session is shared
  with other work and was found on another app's page.
- **Count redraws, not drawing signatures.** `hero.sinceTick === 0` after a step means the body
  was rewritten that frame. A `!P.thighL` check once redrew the idle every frame, because a
  standing pose has thighL exactly 0, and the signature counts hid it.

## Verifying

The scripts need `agent-browser` and `portless`, and the scene served as above. They default to
`BASE=https://underpass.dotfiles.localhost:1355/underpass` and write to `OUT=/tmp/underpass-strip`;
set either to point elsewhere. Do not pipe their output through `head`: a closed pipe kills the
script before the Python crop step writes the zoom image.

- `scripts/strip.sh <label> "<query>"` captures ten frames of the hero walking (`RUN=1` to
  run), cropped and joined, through `agent-browser` and the test hook. Compare before and after
  strips, then zoom in on alternate frames.
- `scripts/shot.sh <name> "<query>" "<js>"` runs js against the paused hook (`n` is `__noir`),
  then prints the live moments, the hero's share of frame height, feet and x, and the nearest
  Collector. It writes the frame plus `<name>-zoom.png`, both figures enlarged 3x. Use it for
  framing and rim checks.
- `scripts/seq.sh <name> "<query>" "<setup js>" "<step js>" <n>` writes a grid of n crops, 3x,
  one per step. Set `window.__T="foe"` in setup to follow the nearest Collector. This is how
  the draw, the shot beats and low ready were checked. A shot strip: setup
  `n.aim(true);n.step(1/60,30)`, step `if(!window.__k){window.__k=1;n.fire();n.step(1/60,1)} else n.step(1/60,2)`.
- Shell quoting: the js goes inside a double-quoted `eval`, so use single quotes in it.
- Measure joints through `__noir.hero` while stepping: `arms.R.elbow`, `P.armR`. Numbers caught
  the straight-elbow bug that the strip hid.
- A still is not motion. Watch the live scene or record it before calling motion done:
  `agent-browser record start <file>.webm`, drive the hook with timed `setTimeout`s, then
  `record stop`.

## Open

- Her clothes. The reference photo shows a light denim jacket and no scarf; the game still has
  the ochre canvas jacket and the high red scarf. The user likes how the cloth moves but not the
  garments. Planned: Tidewall clothing.
- The transitions gate needs the user's sign-off on the look before melee. `START_RUN` (mean
  hold 3.7) and the walk turn (3.8) sit just under the gate's 4 to 6.
- The Tide, a police faction with a cold white glow. Not built.
- Against REPLACED, still open: finishers and melee, hand-authored performance (ours is keys plus
  springs on drawn timing), and dialogue framing at 27%.
- A heavy Collector and a knife Collector.
- Camera roll: keep the 7 degrees in the last zone, or roll only as a pulse on a hit.
- Sound is not a priority.
