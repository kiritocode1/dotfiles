# Hand-drawn sprite frames

Every frame is drawn by hand, pixel by pixel, as a text grid. No 3D, no generated images, no
tracing tools. This is the frame-by-frame method: each drawing is a separate decision about
where the body is.

## The character: Wren, a night courier (original design)

A young courier who carries packages through a rainy city at night. Lean, slightly hunched from
the bag strap, moves fast and low. Not a soldier and not a robot: loose clothes, real hair.

- **Hair:** dark, shaggy, chin length, with a few strands falling over the forehead and sticking
  out at the back. It moves: strands lag behind the head on the run and bounce on landings.
- **Face:** three-quarter view facing right. Skin with a lit side and a shaded side; one eye
  (a single dark pixel or two), a nose bump on the profile edge, jaw line. No goggles, no helmet.
- **Scarf:** dark red, wrapped high at the neck, one tail hanging at the back that trails.
- **Jacket:** ochre canvas work jacket, hip length, open at the front over a dark shirt, sleeves
  slightly too long. The hem flares when moving.
- **Bag:** grey-black courier bag on the back, strap diagonal across the chest from the right
  shoulder to the left hip.
- **Trousers:** dark charcoal, loose, tucked into boots.
- **Boots:** near-black with pale soles, so each footstep reads.
- **Gun:** a small black pistol, only drawn in the shoot state (in other states it is holstered
  and not visible).

## Canvas

- 48 columns by 64 rows. Exactly 64 lines of exactly 48 characters. No other lines.
- The character faces **right**, three-quarter view (chest turned partly toward the viewer).
- Ground line: the lowest pixel of a planted foot is on row 61 (0-based, counting from the top).
- Standing height: top of the hair on about row 17, so the figure is about 45 px tall.
- Standing centre (the pelvis) is around column 22. Leave room on the right for arms and the
  gun, and on the left for the trailing scarf and hair.
- Proportions for 45 px: head with hair about 8 px tall and 7 px wide; neck hidden by the scarf;
  shoulders about 11 px wide in three-quarter view; torso (shoulder to hip) about 13 px; legs
  (hip to sole) about 21 px; arms reach to mid-thigh when hanging.

## Palette

Only these characters. One character is one pixel. `.` is transparent.

| char | colour | use |
|------|--------|-----|
| `.` | transparent | background |
| `K` | #0d0c10 | outline and the deepest shadow |
| `H` | #231b1a | hair |
| `h` | #4b3a33 | hair highlight (top and lit edge) |
| `S` | #c58866 | skin |
| `s` | #8d5a43 | skin shade |
| `z` | #e7b590 | skin highlight |
| `E` | #1b1314 | eye, mouth line |
| `R` | #9c3a30 | scarf |
| `r` | #5f2220 | scarf shade |
| `J` | #8a7448 | jacket |
| `j` | #5a4a30 | jacket shade, folds |
| `L` | #b9a066 | jacket lit edge |
| `D` | #2c2a2e | shirt under the jacket |
| `P` | #393b44 | trousers |
| `p` | #24252c | trousers shade |
| `B` | #1c1a19 | boots |
| `b` | #9a968c | boot sole |
| `G` | #474c53 | bag |
| `g` | #2e3238 | bag shade, strap |
| `M` | #18191d | gun |
| `m` | #4a5059 | gun highlight |
| `F` | #fff3c4 | muzzle flash core |
| `f` | #ffae4a | muzzle flash outer |
| `C` | #8fe6e3 | cyan rim light from behind (back edges of hair, shoulder, back) |

## Pixel-art rules

- Light comes from the front-left (warm street light) with a cyan rim from behind on the left
  edges. Lit side uses the highlight colours, the far side uses the shade colours.
- Outline the silhouette with `K` where the figure meets the background, but drop the outline on
  lit edges (use the rim or highlight colour there instead). Interior lines use shade colours,
  not `K`, except where two limbs overlap and need separating.
- No single stray pixels, no checkerboard dithering on the body, no pillow shading (do not shade
  every shape darker at its edges evenly).
- Clusters: shapes are built from clean runs of pixels. Diagonal lines step evenly (1-1, 2-2,
  not 1-3-1).
- Silhouette first: every frame must read as a person doing the action when filled solid black.
  Keep a gap between the arms and the body and between the legs where the pose allows.
- Far-side limbs (the character's left arm and left leg, away from the viewer) are darker and
  partly hidden behind the body.

## Motion rules

- Each frame is a drawing held for two game frames (about 15 drawings per second of action).
- Use real key poses: anticipation before a big action, extremes, then follow-through. Weight
  shifts: the body drops on contact, rises on passing.
- Secondary motion: hair, scarf tail and jacket hem lag behind the body by a frame and overshoot.
- Consecutive frames must keep the same proportions and colours. Compare with the model frame
  before finishing each one.

## Files and tools

- Model frame (the reference every state copies): `model/00.txt`.
- States: `<state>/01.txt` to `<state>/05.txt`.
- Render: `python3 render.py <state>` writes `<state>/sheet.png` (frames side by side at 6x,
  with the model frame at the left for comparison) and `<state>/anim.gif` (looping at 15 fps,
  each frame shown at 6x). It also checks sizes and palette characters and prints errors.
  Look at `sheet.png` with the image viewer after every change.
