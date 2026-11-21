# Colour system for hand-drawn character sprites in a lit 2.5D scene

Tags used on every claim: [read] I read it in a file or page this session. [inferred] I reasoned it from what I read. [proposed] A design decision for our pipeline that has not been built or tested.

Paths are under `/Users/blank/dotfiles/skills/skills/`. `iso` means `isometric-pixel-games`. `bbs` means `blank-bit-story-001/assets/underpass`.

Web text below was fetched through a summarising fetch tool, so quotes are as that tool returned them. Treat them as data. Two pages returned HTTP 403 and were not read (Unreal Engine's Octopath spotlight, Retronator's The Last Night article).

## 1. Decision in brief

1. [proposed] Turn each sprite grid into an index image. Every pixel carries a material id (jacket, skin, scarf), an authored ramp step (0 to 4), and a flag byte (emissive, rim slot, outline). The palette lives in a small separate texture, one row per material, five columns per ramp.
2. [proposed] The hand-drawn shading stays. The artist's light and shade chars set the authored step. Scene lamps then shift that step by -2 to +2 along the same material ramp, which is what `relief.js` already does for painted shapes.
3. [proposed] Lamp colour is applied as a hue tint on top of the stepped ramp colour, never as a smooth multiply. Quantise the tint. No dither on the body.
4. [proposed] Normals are derived, not drawn: silhouette bevel plus a tilt inferred from the authored step. No second hand-drawn grid in v1.
5. [proposed] The outline `K` and the rim slot `C` become the rim carriers. A lamp behind or beside the figure lights those pixels because their derived normal faces it.
6. [proposed] Palette swap is a row offset into the palette texture. Enemies and outfits reuse the same frames.
7. [proposed] Emissive keys (`F`, `f`, plus new keys such as neon trim) bypass lighting. A muzzle flash also spawns a short-lived scene lamp at the centroid of the frame's `F` pixels.

## 2. Techniques in the isometric skill, and whether they transfer

Line numbers are from the files as read. Verdict is [inferred] unless the cell says otherwise.

| # | Technique | Where | Transfers to a side-on lit sprite? | How |
|---|---|---|---|---|
| 1 | Hue-shifted ramp. Dark steps mix toward COOL `[46,38,84]`, light steps toward WARM `[255,232,180]`. [read] | `iso/assets/engine.js:21` (constants), `:29-36` (`rampOf`), `iso/references/visual-rules.md:88-96` | Yes | Build every material ramp with the same drift. Our SPEC palette already shows it by hand (`s` #8d5a43 is a warm shade, `h` #4b3a33 a lifted hair). Keep SPEC's hex for steps 1 to 3 and generate steps 0 and 4 from the drift. |
| 2 | Five tones per material, level 3 is the base. [read] | `engine.js:33`, `visual-rules.md:64-76` | Yes, with the base moved | `rampOf` puts the base at index 3. Our authored mid should sit at index 2, so lamps have two steps of headroom each way. |
| 3 | Bayer 4x4 ordered dither on step boundaries. [read] | `engine.js:20`, `:37`, used at `:77`, `:84`, `:119`, `:217`; `visual-rules.md:62-76` | Mostly no | Dither is for terrain and shadows. `iso` itself turns it off for figures (see 4). Use Bayer only on a lamp's pool edge on the ground, and optionally on one-step boundaries of sprite lighting behind a flag, default off. |
| 4 | Characters are flat bands, no dither, stripes at least 3 px. [read] | `engine.js:82-83` (`solid` mode), `engine.js:253` comment, `visual-rules.md:128-136`, `techniques.md:520-522`, `techniques.md:760-761` | Yes, directly | Matches `bbs/sprites/SPEC.md:77` ("no checkerboard dithering on the body"). Lamp steps on sprites must be flat bands with hard edges. |
| 5 | Light from upper left, "forever". [read] | `visual-rules.md:74`, `relief.js:18` (`RELIEF_L`) | Only as the authored key | We have many lamps, so one fixed light cannot be the runtime light. It remains the light the artist shades under. SPEC.md:72 already fixes it at front-left. |
| 6 | "Never swap the sun for a point light or a smooth multiply." [read] | `visual-rules.md:168` | Half applies | Point lamps are unavoidable here. The rule's real content, no smooth multiply, does transfer: lamps choose a ramp step, they do not scale colour. |
| 7 | Close tones on large surfaces, wide ramp only on small important items. [read] | `visual-rules.md:114-126` | Yes | Jacket and trousers get narrow ramps (steps about 8 to 12 apart per channel). Face, gun, boot soles and flash get wide ramps. |
| 8 | Outline relief. Height is distance to the transparent edge through a quarter circle, plus painted detail, then normal, then light, then ramp step shift. [read] | `iso/assets/relief.js:35-99`, `iso/references/outline-relief.md:9-18`, `visual-rules.md:148-170` | Yes, it is the normal derivation | Reuse the method. Our `PixelCanvas.bevelAlpha` (`bbs/lib/pixel.js:120-146`) already implements the bevel and `finishNormals` (`:149-164`) the normals. |
| 9 | Size floor for relief: shapes at least 8x5 px. [read] | `visual-rules.md:163-166`, `outline-relief.md:57` | Constrains us | Arms and legs are 3 to 4 px wide in a 48x64 frame, below the floor. Use bevel 1 on limbs, 2 on torso and head. Do not run relief across the whole sprite with one setting ("a box under a uniform bevel turns into a pillow", `relief.js:14-15`, `outline-relief.md:23`). |
| 10 | Shift along the pixel's own ramp: `shiftTone`, steps -3 to +1 relative to a flat top. [read] | `relief.js:95-98`, `:119-126` | Yes, it is the core mechanism | Same operation at runtime, in a shader, on the index image. Range changes to -2..+2 around authored step 2. |
| 11 | `dither: 0` for flat-banded objects. [read] | `relief.js:34`, `outline-relief.md:65` | Yes | Default for characters. |
| 12 | Stepped light, not a gradient: "an unstepped gradient looks like a filter laid over the art." [read, as paraphrased in our doc] | `outline-relief.md:16` | Yes | Same reason we quantise the lamp's effect to ramp steps. |
| 13 | Depth-buffer edge pass. Dark outline where the object meets ground, warm rim on upper-left edges in front of another object. [read] | `engine.js:136-153`, `visual-rules.md:98-112` | Partly | Our sprite is one card, so there is no depth contrast on the figure. The outline and rim come from the sprite's own `K` and `C` pixels instead (proposal 5). The "nothing halos around a figure" intent (`engine.js:134`) still holds: rim is one pixel, not a glow. |
| 14 | Violet shadows because ambient light is blue; shadows are tinted, never black. [read] | `visual-rules.md:84`, `engine.js:124-133` (`.54,.52,.72`, contact `.36,.34,.56`) | Yes | In shadow, a sprite's lamp sum E is ambient only. Make ambient teal or violet, and the shadowed steps tint toward it. Contact shadow under the feet uses the strength-2 tint (`engine.js:294`, `flushShadows` at `:286`). |
| 15 | Warm bounce from the ground on lower surfaces. [read] | `engine.js:75` (`if (dy > .35) l = Math.max(l, .12 + dy * .24)`) | Yes | A `HemisphereLight` with the street colour as ground colour, or a bounce term in the shader. Lower trousers and boots then catch the nearest street lamp's colour. |
| 16 | Gloss highlight: top lit level becomes a near-white pixel. [read] | `engine.js:81` | Yes for gun, boots, wet jacket | Per-material gloss flag. When the shift would exceed +2, output a lamp-coloured specular pixel instead of ramp step 4. |
| 17 | Contact occlusion by sampling 8 neighbours, tinted, Bayer-thresholded. [read] | `engine.js:202-219` | Not needed | The artist's crease and far-limb shading already stand in for occlusion [inferred]. |
| 18 | Global colour grade after all passes, plus a lightning flash that lerps toward near-white. [read] | `iso/references/techniques.md:155-182` | Yes | Sprites must pass through the same grade, or they will not match the scene. A lightning flash is a global lamp added to E. |
| 19 | Stepped ambient clock, 8 fps, so motion feels hand-animated. [read] | `engine.js` `WIND_FPS` (techniques.md:16), `visual-rules.md:138-146` | Yes, for lamp flicker | Step neon flicker at 8 to 12 fps and keep amplitude under one ramp step, or pixels crawl between steps. |
| 20 | Pitfall: stripes under 3 px read as noise; big tone steps read as checkerboard. [read] | `techniques.md:760-761`, `engine.js:253` | Yes | Ramp adjacent steps must stay close on large areas. |
| 21 | Palette hygiene: keep figure colours off the ground hue; red vanishes into red-brown surfaces. [read] | `techniques.md:522`, `visual-rules.md:186` | Yes, a warning | Our scarf is `#9c3a30` and the scene has red neon. A red lamp will wash the scarf. Test it. |
| 22 | Bake once, small actors may re-run relief per frame at about 0.4 ms. [read] | `outline-relief.md:35` | Yes | Derive normals once per frame image at load and cache them. |
| 23 | Detail scale: "A window is 8 px. A face is 4." [read] | `iso/SKILL.md:14` | Yes | Our head is about 7x8 px (SPEC.md:34). Eye and mouth stay single flat pixels outside the lamp shift (`E` is a fixed material at step 1). |

Not transferable: the 30 degree isometric projection, the white page, `box()` face levels (3.4, 2.3, 1.2), the ragged ground edge, and the software rasteriser itself. We use three.js lights and a DataTexture, not `pix` and `zb` [inferred].

## 3. Web research

### 3.1 Mark Ferrari colour cycling

- Page: https://unsung.aresluna.org/but-as-we-all-know-the-individual-light-bulbs-are-not-moving/ [read]
  - Ferrari's scenes are "all the same piece of art 'shifted' to different palettes."
  - Scenes can go through "the 24 hour light cycle" by "fading the one piece of art through whole sets of palettes," even changing light and shadow angle, "without altering or adding anything at all to the single layer of 8-bit pixel art."
  - Overlays such as rain or lit windows stay in the same layer, "deriving their color and motion from the same palette."
  - The page links to the canvas cycle demo at https://www.effectgames.com/demos/canvascycle/.
- Article: https://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html [read]
  - "the programmer could change this palette at will, and all the onscreen colors would instantly change to match."
  - BlendShift fades colours into each other between steps and "gives the illusion of more colors in the scene." Standard mode shifts "in whole steps."
  - No layers or alpha channels, "just one single flat image with one 256 color palette."
  - The article does not mention time-of-day fades or dithering.
- What I take from it [inferred]: one index image plus swappable palettes is a proven way to re-light and recolour art without redrawing. Time-of-day and weather become palette rows. Standard whole-step mode fits our pixel-clean rule. BlendShift would add in-between colours that are not on the ramp, so I would not use it on characters. His art is static scenery, so none of this speaks to per-lamp, per-pixel lighting. That part is ours.

### 3.2 Dead Cells

- Page: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i- [read]
  - "We export each frame of the animation ... to a .png, along with its normal map," "allowing us to render the volume using a basic toon shader."
  - Rendered "in a very small size and without antialiasing."
  - On a previous game: "I had to draw all the shadows by hand on all the frames", avoided in Dead Cells "by designing a lightning system with that in mind."
  - "we still haven't found any solution for flickering pixels."
  - The article does not cover palettes, colour ramps or outlines.
- What I take from it [inferred]: normal map plus a stepped (toon) shader is the shipped answer for lit pixel characters, and hand-painting lighting on every frame was judged too costly. Their normals come from a 3D model, ours cannot, which is why we derive them. Their flicker admission supports capping lamp flicker amplitude (technique 19).
- Hyper Light Drifter: two searches found art-direction pieces only and nothing on palette ramps, swap shaders or lighting. I record it as not found.

### 3.3 Normal-mapped and palette-driven hand-drawn sprites

- Sprite Lamp: https://www.snakehillgames.com/spritelamp/ [read]
  - Lighting profiles are painted "in greyscale (as though the subject was made of white plaster)," each lit "from a single direction."
  - "You can draw as few as two lighting profiles, and as many as five." A full set "takes about twice as long as drawing a single colour image."
  - It "can act as essentially a beefed up palette swap," so one character suits several environments.
  - Profiles "require shading but not shadowing."
  - Inferred cost: hand-drawing 2 to 5 extra grids per frame roughly doubles drawing work, so v1 derives normals (section 4.2).
- Palette-swap LUT article: https://gist.github.com/Yanrishatum/86794e9e663a7e343f9ef66e8b0f38ae [read]
  - Two-texture method: "first lut just turns your color into an index," then "use a secondary texture to get color out of indexed palette."
  - "Note the 0.5 offset, since you'd want to point at the texel center instead of its edge."
  - Exact matching only: "If you used wrong color in your new sprite ... you're screwed."
  - Lighting there is done by choosing between two LUTs through a mask ("one for unshadowed and second for shadowed"). Shifting along a ramp is not described.
  - Search summaries (pages not opened, so weaker) describe grayscale index plus a palette texture with a vertical offset choosing the row (SpritePalettizer by nezvers, https://nezvers.itch.io/spritepalettizer) and the index hidden in the low bits of RGB (https://thedragonloft.blogspot.com/2015/04/sprite-palette-swapping-with-shaders-in.html).
  - Inferred: ramp shift by index arithmetic is the natural extension, since the palette texture's x axis is the ramp step. I did not find it documented, so it is a proposal here.
- The Last Night and HD-2D: not read. Both pages returned 403. A search summary attributes to Tim Soret (https://x.com/timsoret/status/1283051395600580623, thread not opened) that antialiasing pixel-art normals "creates incorrect data along the antialiased edges." If true, it supports nearest filtering on our normal texture, which `pixel.js:185` already sets [read in our code]. I found no first-hand source for how Octopath or Children of Morta light their character sprites.

### 3.4 REPLACED

- Interview: https://bonus-action.com/feature/replaceds-director-taught-himself-everything-from-scratch-to-make-the-most-beautiful-pixel-art-game-of-the-year-i-just-got-a-keen-eye-on-things/ [read]
  - Director Yura Zhdanovich: "The character is flat. So he wouldn't have any shadows beneath him."
  - "There were a lot of small lights, actually, in this game, like lamps."
  - "The only thing 2D in the game is the characters" and "Everything else is just super stylized 3D."
  - Normal maps are not mentioned. The article's own wording (not his) says lamps sit at deliberate angles to give flat sprites physical weight, and that the game handles up to 60 real-time lights.
- Xbox Wire: https://news.xbox.com/en-us/2026/04/14/replaced-combat/ [read]
  - "we chose frame-by-frame animation instead of easier methods based on 3D models" and "Whenever we tried experimenting with 3D models, the result was sub-par and very noisy."
  - Lighting is only described as "unique lighting shifts" in finishers. How sprites are lit is not covered.
- Conclusion [inferred]: no public source I found says how REPLACED shades its sprites. What is documented is the result we are after (many small lamps, flat sprites grounded by light) and a frame-by-frame hand-drawn method like ours. Do not claim they use normal maps or ramps.

### 3.5 Context inside our own repo

- [read] `bbs/lib/figure.js:1-10` already renders a low-poly 3D model, lit by the scene's lamps, into a 63x68 texel target. Hand-drawn sprites would be a second character path. [inferred] The ramp shader should produce a similar look under the same lamps so the two paths can be compared in `lineup.html`.
- [read] `bbs/lib/figure.js` comments: REPLACED reference footage showed pose changes on every other 60 fps frame, about 30 drawings a second. SPEC.md:88 says 15 drawings a second. That mismatch is outside this question.

## 4. Proposed design

### 4.1 Per-pixel data

[proposed] Keep the text grids as the single drawing format. Add a conversion step (extend `bbs/sprites/render.py`) that turns each grid into an index image.

Index image, nearest filtered, no colour space, no mipmaps (same settings as `pixel.js:183-190`):

| Channel | Meaning |
|---|---|
| R | material id, 0 to 15 |
| G | authored ramp step, 0 to 4 |
| B | flags. Bit 0 emissive. Bit 1 rim slot. Bit 2 outline. Bit 3 gloss |
| A | 255 where drawn, 0 for `.` |

Palette texture: 5 columns (ramp steps) by `materials x variants` rows, RGBA, nearest, sRGB. A lookup lands at `((step + .5) / 5, (row + .5) / rows)`, which is the texel-centre offset the LUT article warns about.

Mapping from current chars. Authored steps use only 1 to 3 so the lamps can move a pixel to 0 or 4.

| Material | Chars (step) |
|---|---|
| ink (id 0) | `K` 2, flags outline |
| hair | `H` 2, `h` 3 |
| skin | `s` 1, `S` 2, `z` 3 |
| eye and mouth | `E` 1 (excluded from the lamp shift, so the face stays a fixed read) |
| scarf (accent) | `r` 1, `R` 2 |
| jacket | `j` 1, `J` 2, `L` 3 |
| shirt | `D` 2 |
| trousers | `p` 1, `P` 2 |
| boots | `B` 2 |
| sole | `b` 2, gloss |
| bag | `g` 1, `G` 2 |
| gun | `M` 1, `m` 3, gloss |
| flash | `F` 3, `f` 2, emissive |
| rim | `C` 1, flags rim slot |

Palette base colours for steps 1 to 3 are the existing hex in `bbs/sprites/render.py:17-21` and SPEC.md:42-68. Steps 0 and 4 are generated with the engine's drift (multiply toward dark and mix toward COOL for 0, lift and mix toward WARM for 4). The exact multipliers need tuning by eye [proposed].

Normals, derived at load and cached per frame image:

1. Mask is `A > 0`.
2. Height is a quarter-circle bevel on distance to transparent (`PixelCanvas.bevelAlpha`, `pixel.js:120-146`), with a per-material bevel (limbs 1, torso and head 2), the SpriteCook form (`outline-relief.md:13`).
3. Add a tilt toward the authored key. The artist shaded under a known front-left light (SPEC.md:72), so step 3 implies a normal leaning toward it and step 1 leaning away. [proposed] `n.xy = bevelDir * edgeWeight + keyDir.xy * (step - 2) * 0.5`, then `n.z = sqrt(1 - |n.xy|^2)`. One number per pixel does not fix a normal, so this is a plausible reconstruction, not a recovery [inferred].
4. Feed `put(..., { n })` into a `PixelCanvas` and call `textures()` for the normal map. Only the normal map is used. The index image replaces `map`.

Optional override, not v1: a sibling `NN.nrm.txt` using 9 direction chars (8 compass plus flat), for the face and gun on model frames where the derived normal reads wrong [proposed]. Hand-drawing this for every frame is the cost Sprite Lamp quotes at roughly 2x.

### 4.2 How a lamp recolours the sprite at runtime

[proposed] Extend `pixelMaterial` (`pixel.js:197-226`). It already snaps the shading point to the texel centre in `onBeforeCompile`, so lamp falloff steps in whole texels.

In the fragment shader, after the map is sampled:

1. Read the index texel. Set `diffuseColor.rgb = vec3(1)` so three's lighting loop accumulates pure irradiance.
2. After `lights_fragment_end`, take `E = (directDiffuse + indirectDiffuse) * PI` as the lamp sum for this texel. Calibrate with one uniform, because three's lights are physically scaled.
3. `lum = dot(E, vec3(.2126, .7152, .0722))`.
4. `shift = clamp(floor((lum - uRef) * uGain + .5), -2., 2.)`. `uRef` is the luminance of the sprite lit by ambient plus the standing key, so an unlit-by-lamps sprite reads exactly as authored. Skip the shift where the `E` material flag is set.
5. `step = clamp(authored + shift, 0., 4.)`, `base = texture2D(uPalette, vec2((step + .5) / 5., (row + .5) / rows)).rgb`.
6. `tint = mix(vec3(1.), E / max(lum, 1e-3), uSat)`, then `tint = floor(tint * 6. + .5) / 6.`. Start `uSat` near .65. Final colour is `base * tint`.
7. Emissive flag, rim and gloss as below, then replace the line that builds `outgoingLight`.

Both numbers (6 levels, .65) are starting guesses [proposed]. The test is that a lit sprite shows a small countable set of colours per material, not a gradient.

Why this satisfies the no-smooth-multiply rule (`visual-rules.md:168`): lamp intensity picks a ramp step. Lamp hue only tints that step, in quantised levels.

Rim from the light side. The pixels that carry it are `K` outline pixels and `C` rim slots. Their derived normal tilts outward (bevel, height near 0), so a lamp beside or behind them gives a large `N dot L` and pushes them up to +2, which lands on a bright step of the ink and rim ramps, then tints to the lamp colour. A lamp in front barely lights them. [inferred] This reproduces a backlit edge with no separate rim code. The `C` slot gives the artist the placement control SPEC.md:74-76 asks for (drop the outline on lit edges and use a rim colour). Its colour is no longer baked cyan, it is whatever lamp is behind the figure. Ink ramp top step should be a mid-light neutral so tinting is visible. The rim must stay one pixel wide, which the bevel of 1 on limbs guarantees [inferred].

Emissive keys. Flagged pixels output the palette colour directly, scaled above 1 for `F` so the scene's bloom threshold catches them (the same intent as the emission split in `bbs/lib/painted.js:49-55`). When a frame shows `F` pixels, take their centroid at load and register it as an anchor. The muzzle event then adds a short-lived warm point lamp there for 2 to 3 frames [proposed]. The shooter and anything nearby then relight automatically.

Lamp count. Use three's own lights first, so sprites see exactly the lamps the environment sees and colours agree [proposed]. If profiling shows the light loop is too heavy with many lamps, switch to a uniform array of the 6 most influential lamps, chosen on the CPU each frame by intensity over squared distance.

Ground bounce. Add a `HemisphereLight` whose ground colour is the street tone (technique 15). Lower legs and boots then take warm or teal bounce.

Contact shadow. Add a small dithered ellipse under the feet in the strength-2 violet tint (`engine.js:286-295`, `:124-133`). This answers the REPLACED remark that a flat character "wouldn't have any shadows beneath him." This is shadow work, outside colour, listed because it affects whether the sprite reads as grounded [inferred].

### 4.3 Palette swaps: enemies and alternate outfits

[proposed]
- One row block per variant in the palette texture. A per-instance uniform sets the row offset. Same frames, no extra textures. Sprite Lamp's own description of this use is "a beefed up palette swap."
- Faction by accent: the scarf (`R`/`r`) is the accent material. Player is dark red, enemies get another hue by changing only that material's row. Skin, hair, jacket stay distinct materials so a swap can change one without the others.
- Outfits: jacket, trousers, bag, shirt are separate materials. A new outfit with the same silhouette is a new palette block. A new silhouette (long coat, hood) needs new drawings. Palette swap cannot change shape [inferred].
- State overrides as palette rows, in the Ferrari manner: a hit flash is a near-white row for 2 frames, an alarm state a red-shifted block, a stealth state a darker block. These need no new art.
- Cycling inside a ramp: a pulsing neon trim is an emissive material whose row rotates its steps over time. Step it, do not blend (BlendShift's in-between colours are off the ramp).
- Constraint for artists: a char belongs to exactly one material, and a material must not be reused for two things that should swap independently (for example hair and scarf).
- Enemies facing left: SPEC.md:29 fixes the character facing right. Mirroring the card flips the authored key light and the tangent-space normal x. Decision needed (section 6).

### 4.4 Keeping the result pixel-clean

[proposed], each item with its source where one exists.
1. Index texture and normal texture both nearest, no mipmaps, linear colour space off (`pixel.js:183-190`). Tim Soret's remark on antialiased normals (search summary only) points the same way.
2. Shading point snapped to the texel centre (`pixel.js:205-224`, [read]).
3. Lamp effect is an integer ramp shift. Tint is quantised.
4. No Bayer on the body (`visual-rules.md:128-136`, `SPEC.md:77`). Optional Bayer only on a lamp's ground pool edge.
5. Flicker control. Dead Cells reports unsolved flickering pixels. A lamp that wobbles across a step threshold makes pixels toggle. Step neon flicker at 8 to 12 fps (`visual-rules.md:138-146`), keep amplitude under one ramp step, and add hysteresis (a pixel changes step only after the value passes the threshold by a small margin).
6. Sprites render at the scene's texel density (`bbs/lib/painted.js:25` `tpuAt`), so one sprite texel is one screen texel. A sprite scaled off that grid would break every item above.
7. Sprites must go through the same global post and grade as the scene (`techniques.md:155-182`).
8. Add a lint check: render each state under three fixed lamps (orange from the left, teal from the right, red from behind) and fail if any material shows more than `5 ramp rows x tint levels` distinct colours.

### 4.5 What the drawing agents must add to each frame

Almost nothing new on the drawing itself. The change is discipline, enforced by `render.py`.

1. Draw with material chars only. A colour is never invented. If a new thing needs its own colour, add a material to the SPEC table first.
2. Authored steps stay inside 1 to 3. Steps 0 and 4 belong to the lamps and never appear in a grid.
3. Form shading stays hand-drawn under the front-left key, as SPEC.md:72 and :83-84 already require. Keep far-side limbs one step darker.
4. Place `C` rim slots where a backlit edge should appear (back of head, shoulder, back, scarf tail), and keep `K` on the shaded edge as today. Do not paint a rim colour any other way.
5. Mark emissive pixels with the existing `F` and `f`. Any new glow (neon trim, eye glint) gets its own emissive char listed in SPEC first.
6. Keep material and step identical for the same body part across frames (SPEC.md:92-93). Frame-to-frame step changes now read as lamp-independent flicker.
7. Keep every shape at least 3 px wide where a rim or step edge falls on it (`techniques.md:760-761`).
8. New outputs from `render.py`, not by hand: the index image, the palette sheet, and the three-lamp lit preview sheet next to the existing `sheet.png`.

No extra hand-drawn normal grid, depth grid or per-lamp painting is required in v1.

## 5. Build order

[proposed], each step verifiable on its own.
1. Add the char to material and step table to SPEC.md and `render.py`. Output the index PNG and verify it round-trips to the original colours with the identity palette (pixel-exact diff against current `sheet.png`).
2. Palette texture and the shader with `shift = 0` and tint off. Must reproduce the current sprite exactly, checked by screenshot diff.
3. Turn on the shift with a single lamp. Check bands and step counts.
4. Turn on tint and quantisation. Run the three-lamp lint.
5. Derived normals and the rim carriers. Compare with a hand-picked backlit reference.
6. Palette variants, hit flash, muzzle lamp.
7. Compare side by side with the 3D `figure.js` render of the same pose under the same lamps in `lineup.html`.

## 6. Open questions and risks

- [inferred] Authored directional shading plus a runtime shift can double-light. A lamp from the left pushes already-lit left pixels to the top of the ramp, and a lamp from the right crushes the authored shade. Test with `uRef` and `uGain` before accepting. The alternative is to flatten authored shading to light-independent form (folds, far limbs, creases) and let lamps supply direction. That also fixes mirroring, but means redrawing the existing frames.
- [inferred] Mirroring for left-facing enemies flips the baked key light and the normal x. Options are separate left-facing frames, a normal x flip uniform with accepted baked-key mismatch, or the flatten option above.
- [inferred] A red lamp will wash the red scarf, and the rule about figure colours staying off the surrounding hue (`techniques.md:522`) applies. The accent might need a different hue than red or a brighter step budget.
- [proposed, unverified] The shader patch points (`diffuseColor`, `lights_fragment_end`, `outgoingLight`) must be checked against three 0.186.1, the version in `bbs/index.html:13-15`. I did not build this.
- [read] I found no first-hand source on how REPLACED, Octopath, The Last Night or Children of Morta shade their sprites. Do not cite them for a technique.
- Quote reliability: web quotes came through a summarising fetch tool and were not checked against raw HTML.

## 7. Sources

Read in full (via fetch tool):
1. https://unsung.aresluna.org/but-as-we-all-know-the-individual-light-bulbs-are-not-moving/
2. https://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html
3. https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-
4. https://www.snakehillgames.com/spritelamp/
5. https://gist.github.com/Yanrishatum/86794e9e663a7e343f9ef66e8b0f38ae
6. https://bonus-action.com/feature/replaceds-director-taught-himself-everything-from-scratch-to-make-the-most-beautiful-pixel-art-game-of-the-year-i-just-got-a-keen-eye-on-things/
7. https://news.xbox.com/en-us/2026/04/14/replaced-combat/

Search summaries only, not opened: nezvers SpritePalettizer, The Dragonloft palette swap post, Tim Soret's X thread, Wikipedia HD-2D, Hyper Light Drifter results.

Fetch failed (HTTP 403): the Unreal Engine Octopath spotlight, the Retronator article on The Last Night.

Files read in the repo: all of `iso/SKILL.md`, `iso/references/visual-rules.md`, `techniques.md` (targeted sections for colour, light, figures, pitfalls, not all 778 lines line by line), `outline-relief.md`, `iso/assets/relief.js`, `iso/assets/engine.js` (colour, light, shadow, edge, figure sections), `bbs/sprites/SPEC.md`, `bbs/sprites/render.py`, `bbs/sprites/model/00.txt`, `bbs/lib/pixel.js`, `bbs/lib/painted.js`, and the first 40 lines of `bbs/lib/outfits.js` and `bbs/lib/figure.js`.
