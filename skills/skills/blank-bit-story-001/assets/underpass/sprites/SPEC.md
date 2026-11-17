# Hand-drawn sprite frames, v2

Every frame is drawn by hand, pixel by pixel, as a text grid. No 3D, no generated images, no
tracing tools, no generator, mirror or transform code. Each drawing is a separate decision about
where the body is.

## The character: Januwu, a night courier (original design)

A young woman, a courier who carries packages through a rainy city at night. Lean, slightly
hunched from the bag strap, moves fast and low. Not a soldier and not a robot: loose clothes,
real hair. The game's hero is now her realistic 3D body (`lib/januwu.js`); these hand-drawn
frames are the earlier sprite path, kept behind `?actor=drawn`.

- **Hair:** black, shoulder length, a curtain open at the face with locks framing it to the chin.
  It moves: strands lag behind the head on the run and bounce on landings.
- **Face:** three-quarter view facing right. Skin with a lit side and a shaded side; one eye
  (a single dark pixel or two), a nose bump on the profile edge, jaw line. No goggles, no helmet.
- **Scarf:** dark red, wrapped high at the neck, one tail hanging at the back that trails.
- **Jacket:** ochre canvas work jacket, hip length, open at the front over a dark shirt, sleeves
  slightly too long. The hem flares when moving.
- **Bag:** grey-black courier bag on the back, strap diagonal across the chest from the right
  shoulder to the left hip.
- **Trousers:** dark charcoal, loose, tucked into boots.
- **Boots:** near-black with pale soles, so each footstep reads.
- **Gun:** a small black pistol in the near hand. It is holstered and not drawn in idle, walk, run
  and their starts, stops and turns. It is in the hand in the aim, shoot, hit, knockdown and death
  states. A gun that leaves the hand is a separate prop sprite; do not draw it into the body frame.

Who Januwu is, in every state: tired, so never fully upright; careful with the gun, so the muzzle
points at a target or at the ground; looks before moving; flinches and recovers instead of posing.

## Canvas

- 48 columns by 64 rows. Exactly 64 lines of exactly 48 characters. No other lines.
- The character faces **right**, three-quarter view (chest turned partly toward the viewer).
  Left-facing is the same drawing mirrored by the game.
- Ground line: the lowest pixel of a grounded drawing is on row 61 (0-based, from the top).
  Nothing is ever drawn below row 61. A drawing with both feet off the ground is listed under
  `air` in `states.json`.
- Standing height: top of the hair on about row 17, so the figure is about 45 px tall.
- Standing centre (the pelvis) is around column 22. Leave room on the right for arms and the
  gun, and on the left for the trailing scarf and hair.
- Proportions for 45 px: head with hair about 8 px tall and 7 px wide; neck hidden by the scarf;
  shoulders about 11 px wide in three-quarter view; torso (shoulder to hip) about 13 px; legs
  (hip to sole) about 21 px; arms reach to mid-thigh when hanging.

## Materials

One character is one pixel. `.` is transparent. Each char is a material and a ramp step. The
game relights a pixel by moving it along its material's ramp, so the colour you draw is the
colour under the reference light (front-left key, dim ambient).

| char | colour | material | step | flags | use |
|------|--------|----------|------|-------|-----|
| `K` | #0d0c10 | ink | 2 | outline | outline and the deepest shadow |
| `C` | #8fe6e3 | rim | 1 | rim slot | where a backlit edge should glow: back of head, shoulder, back, scarf tail |
| `H` | #231b1a | hair | 2 | | hair |
| `h` | #4b3a33 | hair | 3 | | hair highlight (top and lit edge) |
| `s` | #8d5a43 | skin | 1 | | skin shade |
| `S` | #c58866 | skin | 2 | | skin |
| `z` | #e7b590 | skin | 3 | | skin highlight |
| `E` | #1b1314 | eye | 2 | fixed | eye, mouth line; lamps never change it |
| `r` | #5f2220 | scarf | 1 | | scarf shade |
| `R` | #9c3a30 | scarf | 2 | | scarf |
| `j` | #5a4a30 | jacket | 1 | | jacket shade, folds, sleeve cuff |
| `J` | #8a7448 | jacket | 2 | | jacket |
| `L` | #b9a066 | jacket | 3 | | jacket lit edge |
| `D` | #2c2a2e | shirt | 2 | | shirt under the jacket |
| `p` | #24252c | trousers | 1 | | trousers shade |
| `P` | #393b44 | trousers | 2 | | trousers |
| `B` | #1c1a19 | boots | 2 | | boots |
| `b` | #9a968c | sole | 2 | gloss | boot sole |
| `g` | #2e3238 | bag | 1 | | bag shade, strap |
| `G` | #474c53 | bag | 2 | | bag |
| `M` | #18191d | gun | 1 | gloss | gun |
| `m` | #4a5059 | gun | 3 | gloss | gun highlight |
| `f` | #ffae4a | flash | 2 | emissive | muzzle flash outer |
| `F` | #fff3c4 | flash | 3 | emissive | muzzle flash core; the game puts a short lamp at its centre |

- Draw steps 1 to 3 only. Steps 0 and 4 belong to the lamps and have no char.
- Never invent a colour. A new thing that needs its own colour gets a new material row here first,
  and in `colour.py`.
- Paint a rim only with `C`. It stays dark until a lamp sits behind Januwu, then glows in that
  lamp's colour.
- Keep the same material and step for the same body part across frames. A step that changes from
  frame to frame flickers under every lamp.

## Pixel-art rules

- Light comes from the front-left. Lit side uses the highlight chars, the far side the shade chars.
- Outline the silhouette with `K` where the figure meets the background, but drop the outline on
  lit edges. Interior lines use shade chars, not `K`, except where two limbs overlap.
- No single stray pixels, no checkerboard dithering on the body, no pillow shading.
- Clusters: shapes are built from clean runs of pixels. Diagonal lines step evenly (1-1, 2-2,
  not 1-3-1).
- Every shape where a rim or a step edge falls is at least 3 px wide.
- Silhouette first: every key frame must read as a person doing the action when filled solid
  black, with one line of action. Keep a gap between the arms and the body and between the legs
  where the pose allows.
- Far-side limbs (the character's left arm and left leg) are darker and partly hidden.

## Hands

The hand library is `hands/01.txt`: grip, relaxed hang, press, clutch, startle, limp trailing,
dead palm up, trapped. Near is the hand toward the camera, which is the gun hand; far is the hand
behind the body.

- A hand is never a straight stick. The elbow bends, the wrist bends, the fingers curl.
- Forearms are at least 3 px thick.
- Each sleeve ends in a 1 px `j` cuff, so the hand separates from the sleeve.
- A hand over the jacket gets a 1 px `K` or `s` edge on the jacket side, so skin does not merge
  into ochre.
- While Januwu is conscious the hands react: they startle, protect the wound, reach to catch a
  fall. Once unconscious both arms lag the body and land palm up or trapped. A falling hand
  never plants.

## Motion

- Holds come from `states.json`, in 60 fps game frames. About 30 drawings a second: hold 2 is the
  target, hold 4 is the slowest a moving limb may go. Hold 0 means the drawing is held until the
  state ends (a rest pose).
- A held pose is a longer hold, never a copied drawing.
- Draw keys first, then in-betweens. The state's brief marks each drawing K or i and names its
  contact drawings.
- Anchors: the pivot is the standing foot. The body bobs 1 px on a walk and 2 px on a run.
- The head moves 1 to 2 drawings before the body. The pack arrives 1 drawing late, the scarf and
  hair 2 to 3, and they overshoot by 1 px when the body stops.
- Player actions get 0 to 3 drawings of anticipation. Hits get none.
- Compare every drawing with the model frame for proportions and colours before finishing it.

## Direction

Every state has a performance brief, `<state>/BRIEF.md`, written before any drawing. It has an
objective line, a "Do not" line, and one row per drawing: Intent, Head and eyes, Spine and
weight, Near hand, Far hand, Gun/scarf/pack, Hold. Draw what the brief says. If a drawing needs
to differ from its brief, change the brief first and say why.

The brief rules, in full in the plan's Direction section and `research/performance.md`:
- Each row says what Januwu is doing, as an action ("check the dark end"), not a mood ("nervous").
- Each row says which foot holds the weight and how far the body drops.
- Idles carry one habit: a look toward the dark end of the street, thumb on the pack strap.
- A shot person does not fly back. Januwu reacts late, tries to stay up, and falls the way the
  weight goes.

## Files

- `model/00.txt`: the model frame every state copies.
- `states.json`: every state's holds, `loop`, `air` drawings, `loopRange` for a looping part
  inside a one-shot, and `variants`. It is the source of truth for drawing counts.
- `<state>/NN.txt`: drawings numbered 01 to the state's count. A missing number is a drawing not
  made yet.
- `<state>/<v>/NN.txt`: a variant's own drawings, which replace the same numbers in the main set.
  The game picks one variant at random each time the state starts.
- `<state>/BRIEF.md`: the performance brief.
- `v1/`: the first batch of 25 frames. Reuse a good one as a key by copying it into place and
  redrawing what the brief needs.
- `colour.py`: the materials, ramps and lighting model, shared with `preview/colour/lit.py`.

## Lint and outputs

`python3 render.py <state>` checks a state and writes its outputs. `python3 render.py all` does
every state and writes `all.png`. Both exit 1 on any error. Run it after every change and look at
`sheet.png` at full size.

Errors:
- not 64 lines of 48 chars, or a char that is not in the table
- a drawing number beyond the table, or a variant drawing the table does not list
- a pixel below row 61, or a grounded drawing whose lowest pixel is not on row 61
- a drawing identical to the one before it (use a longer hold)
- a loop whose last drawing equals its first
- a pixel that does not decode back to its colour through the palette

Outputs, inside `<state>/`:
- `sheet.png`: the model, then every drawing slot labelled with its number and hold; variants on
  their own row
- `anim.png`, `anim-<v>.png`: the drawings played at their real holds (APNG)
- `lit.png`: the drawings under the reference light, sodium from the left, teal from the right,
  red from behind
- `index/NN.png`: the index image the game reads (R material, G step, B flags, A coverage)

`palette.png` in this folder is the palette texture: one row per material, five ramp steps.
