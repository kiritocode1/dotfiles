# Visual rules, and the engine code that enforces them

The look is not a filter applied at the end. Each rule is a decision inside the rasteriser, and it breaks the moment you draw around the engine instead of through it. This file maps each rule in the Pixel Plays README to the function and constant that implements it, so a new game can keep the look while changing the subject. Rule 11 is an addition of ours and lives in `assets/relief.js`.

Read `techniques.md` for how the source games use these mechanisms. Read `assets/engine.js` for the implementation. Line numbers below are from the vendored `assets/engine.js`.

## 1. One small place on pure white

**Rule.** The diorama is the only object on the page. No card, panel, border, gradient, texture or drop shadow behind it. Page chrome is small monospace text at the edges.

**Enforced by.** `bake()` fills the canvas with `rgb(255,255,255)` and never paints a sky (`bake` in the game, `pix.fill`). `zb` stays at `-1e9` where no ground or prop was written, and every later pass skips those pixels: `applyShadows` tests `ground[i]`, `gradeStorm` tests `zb[i] < -1e8`, `clouds` draw only on empty pixels.

**Keep it.** Never fill the canvas background with a colour. If you want a horizon, build it as geometry inside the diorama, not as a backdrop.

**Check.** Screenshot the page at 1280 wide, sample any pixel 40 px outside the ground edge, require 255,255,255.

## 2. 360 by 280, nearest neighbour, integer device-pixel scale

**Rule.** The simulation is 360 by 280 pixels. It is upscaled by a whole number of device pixels, never interpolated, never fractional.

**Enforced by.** `const W = 360, H = 280, S = 10` and `fit()`:

```js
const scale = Math.max(1, Math.floor(fitScale * dpr)) / dpr;
canvas.style.width = W * scale + 'px';
```

`image-rendering: pixelated` and `touch-action: none` are set in CSS on the canvas. `S = 10` px per world unit along screen-horizontal, so the whole engine speaks in pixels.

**Keep it.** All drawing goes into `pix` (a `Uint32Array` over one `ImageData`). Do not add a second canvas at another resolution, and do not scale sprites. If an element is too small at 360 px, redraw it bigger, not sharper.

**Check.** `canvas.width === 360`, `canvas.height === 280`, and `canvas.style.width / 360` is a whole number when `devicePixelRatio` is 1 or 2.

## 3. Fixed 30-degree orthographic camera, ragged edge into white

**Rule.** Never move or rotate the camera. The ground is a rounded rectangle whose border breaks into scattered pixels and then white page.

**Enforced by.** `project()`:

```js
const u = (x - y) / R2, v = (x + y) / R2;
return { sx: OX + u * S, sy: OY + (v * SIN - z * COS) * S, d: v * COS + z * SIN };
```

with `SIN = .5`, `COS = Math.sqrt(3) / 2`. `+x` goes screen right and down, `+y` goes screen left and down, `z` goes up. `unproject()` is its inverse and is how `groundColor` walks every screen pixel.

The edge lives in the game's `groundColor`, not the engine, because the engine has no idea what shape the place is:

```js
const edge = Math.pow(Math.pow(Math.abs(x) / HALF_X, 4) + Math.pow(Math.abs(y) / HALF_Y, 4), .25);
const rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .1;
if (rough > 1.04) return 0;                                       // white page
if (rough > .94 && hash(ix, iy) < (rough - .94) / .1) return 0;  // scattered border
```

The exponent 4 gives a rounded rectangle, low-frequency `noise` makes the border uneven, and a per-pixel `hash` removes pixels at a rate that rises toward the edge. Returning 0 leaves the pixel white and `ground[i]` at 0, so no shadow or edge pass will touch it.

**Keep it.** Pick the half-sizes from the action, not to fill the canvas. Positive `PP_SCENE.originY` moves the world down the canvas and buys headroom above tall structures; negative moves it up for things hanging below ground.

**Check.** The ground boundary should be an irregular scatter of single pixels for about 8 to 12 px, then hard white. A smooth antialiased curve means the hash term was dropped.

## 4. Depth buffer, four shade levels, Bayer dither

**Rule.** Every pixel knows how far away it is. Colour is quantised to five steps per material, and the step boundaries are ordered-dithered so the bands read as texture.

**Enforced by.** `zb = new Float32Array(W * H)` holds depth, larger is nearer. `plot`, `box`, `sphere`, `capsule` and the game's own painters test and write it. `rampOf(c)` builds five tones from one base colour:

```js
ramp = [mix(.4, COOL, .34), mix(.62, COOL, .18), mix(.84, COOL, .05), mix(1, WARM, 0), mix(1.1, WARM, .22)];
```

`box()` shades its three visible faces at base levels `3.4` (top), `2.3` (+y, lower left), `1.2` (+x, lower right). `sphere()` computes `l = -.55*dx - .6*dy + .58*nz` and picks `floor(l * 4.4 + .2 + (bayerAt(ix, iy) - .5) * .7)`. `bayerAt` is a 4 by 4 ordered matrix, `BAYER[v] = (v + .5) / 16`.

**Keep it.** Light comes from the upper left, forever. A prop that looks lit from the right will read as a different game. Use `rampOf` on one base colour instead of hand-picking five tones, or the hue drift will not match.

**Check.** Crop any solid face to 8x. It should hold three or four distinct tones in a stable dither pattern, not a gradient and not one flat colour.

## 5. Long hard shadows, screen right

**Rule.** A low sun from the upper left. Shadows are hard-edged, dithered at the rim, and travel screen right.

**Enforced by.** `castShadow(x, y, z, r)` places a disc at `(x + SHADOW_X * z, y + SHADOW_Y * z, 0)`, so shadow travel scales with height. Defaults are `SHADOW_X = 1.3`, `SHADOW_Y = -.12`, which is 10.0 px right and 4.2 px down per unit of height. `PP_SCENE` overrides both per scene. `applyShadows(refZ)` tints a shadowed ground pixel by `.54, .52, .72`, or `.36, .34, .56` for a contact shadow (`strength = 2`). `flushShadows()` walks a moving limb and drops a contact disc under its foot.

**Keep it.** Tall masonry wants a shorter throw (`stari-most` uses `.55, -.08`) or the shadows leave the diorama. Never draw a shadow as a semi-transparent black shape; the tint is violet because the ambient light is blue.

**Check.** Shadow pixels are darker and bluer than the lit ground, edges break up in a dither pattern, and no shadow crosses the ragged ground edge.

## 6. Hue-shifted ramps

**Rule.** Shadows drift violet, highlights drift warm yellow. Nothing is a pure darkening of the base colour.

**Enforced by.** `rampOf` mixes the darkest steps toward `COOL = [46, 38, 84]` and the lightest toward `WARM = [255, 232, 180]`. `shadeEdges` mixes the upper-left rim toward `WARM` at `.3, .3, .22`.

**Keep it.** If you write a colour by hand, apply the same drift: multiply by roughly `.5` and add blue for a shadow, multiply by `1.1` and pull green and blue toward yellow for a highlight.

**Check.** Pick the darkest and lightest pixels of one material. The dark one should have a higher blue-to-red ratio than the base; the light one a lower blue-to-red ratio.

## 7. Depth-buffer edges

**Rule.** An object darkens its own silhouette where it meets the ground. It gets a warm rim only on upper-left edges where it stands in front of another object. Nothing halos around a figure.

**Enforced by.** `shadeEdges()`, which compares each pixel's `zb` with its four neighbours and with `groundZ`:

- any neighbour is ground: tint `.68, .66, .76`, a dark outline
- the pixel is nearer than the pixel above or to its left: warm rim toward `WARM`
- the pixel is farther than the pixel to its right or below: tint `.74, .72, .82`

`GRADIENT_Y = COS / (S * SIN)` compensates for the ground's screen slope, so a flat surface does not outline itself.

**Keep it.** This pass runs after shadows and before overlays. Anything drawn with `drawDots` gets no edge and no depth test, which is correct for arrows and rings and wrong for world objects.

**Check.** A figure on grass has a dark one-pixel outline at its feet and no outline tracing its whole body against the white page.

## 8. Close tones on large surfaces

**Rule.** A big flat area reads as one material with soft grain. Wide steps make the dither read as a checkerboard.

**Enforced by.** Four hand-picked tones per material, roughly 5 to 10 apart per channel, chosen with `floor(v * 4 + (bayerAt(ix, iy) - .5) * .6)`:

- clay `[172,90,58] [181,97,62] [190,104,67] [199,112,73]`
- concrete `[176,172,164] [184,180,171] [192,188,178] [200,196,186]`
- water `[34,102,108] [44,122,120] [62,146,134] [94,172,150]` (wider on purpose, for depth)

**Keep it.** The more area a surface covers, the tighter its tones. Reserve a wide ramp for something small and important, such as a ball or a stone.

**Check.** View the ground at 1:1. If you see a checker pattern rather than grain, the tone steps are too wide or the Bayer term is too strong.

## 9. Characters stay sharp

**Rule.** Figures are flat bands with no dither, a dark outline on their own pixels, and patterns at least 3 px wide.

**Enforced by.** `sphere(..., 'solid')` picks `floor(l * 4.4 + .2)` with no Bayer term, clamped to levels 1 to 4. The comment in the source says why: "figures get flat bands with no dither, so they read as sharp shapes against the textured ground". `figure()` draws a head, hair, torso, two arms and two legs from capsules and spheres, with a shirt stripe every `1 / 3.2` world units, about 3 px. `flushShadows()` then gives the body a contact shadow and the silhouette pass gives it an outline.

**Keep it.** Head radius `.24` world units is about 2 px radius, 5 px across at `S = 10`. Smaller than that and the face is one pixel; bigger and the figure stops being a person and becomes a doll. Do not dither skin or clothing.

**Check.** At 1:1 a figure's torso holds two or three flat colours, and its stripe is at least 3 px. Any speckle inside the body means a textured mode leaked in.

## 10. Ambient motion only in plants

**Rule.** Grass and leaves sway in whole pixels at 8 fps. Nothing else moves unless the player caused it.

**Enforced by.** `WIND_FPS = 8` and a stepped clock, `Math.floor(t * WIND_FPS) / WIND_FPS`. `drawTufts` offsets each pixel column by `Math.round(gust * .95 * k / 3)`; `drawLeaves` offsets whole pixels by `Math.round(...)`. `STILL = matchMedia('(prefers-reduced-motion: reduce)').matches` freezes the clock at 0.

**Keep it.** Do not add drifting clouds, idle bobbing props or a pulsing highlight. Motion is the player's feedback channel; ambient motion spends it.

**Check.** With reduced motion on, the scene is a still image. With it off, only grass, leaves and any water streaks you added change.

## 11. Painted shapes take form from their outline

This rule is ours, not Pixel Plays'. The source games leave painted shapes flat. [outline-relief.md](outline-relief.md) has the method, where it came from, and the tests behind the numbers below.

**Rule.** A shape painted in `groundColor` or built from `plot()` calls has no normals, so it reads as flat paint. Give it a lit upper-left rim and a shaded lower-right rim, worked out from its silhouette under the same sun as `sphere()`. Its painted colours stay as they are on the flat top.

**Enforced by.** `assets/relief.js`, loaded after `engine.js`. `relief(mask, opts)` sets each pixel's height from its distance to the mask edge, up to `bevel` px, through a quarter circle `top * sqrt(1 - (1 - d / bevel)²)`. It adds `detail * (luminance - mean)`, blurs at sigma .7, and takes the normal `(-gx, -gy, 1)`. It lights that normal with `sphere()`'s vector `(-.55, -.6, .58)` and moves each pixel -3 to +1 steps along its own hue-shifted ramp (`shiftTone`), with Bayer dither on the step. There are two ways in:

```js
// a ground surface, right after the ground loop in bake()
relief(kinds.map(k => k === KIND_FLAG), { bevel: 2.5, top: 2.5, detail: 1 });
// a plotted surface: everything whose depth changes between the two calls
reliefBegin(); paintSign(); reliefEnd({ bevel: 2 });
```

**Keep it.** Use it on painted shapes at least 8 px wide and 5 px tall on screen, such as slabs, stepping stones, rugs, cushions, signs and cloth. Leave these alone:

- `box`, `sphere`, `capsule` and `figure`. They already shade from real normals, and a uniform bevel turns a box into a pillow.
- Textures whose cells fall below the size floor: bricks, planks, small tiles. `masonry()` at 6x4 px blocks came out muddier under every setting tried.

Never swap the sun for a point light or a smooth multiply. Rules 4 and 6 still apply.

**Check.** At 6x, each painted shape has lighter pixels along its upper-left edge and darker ones along its lower-right edge, and its interior is unchanged. A shape lit on the lower right means the normal's y sign was flipped.

## Palette recipe

One base colour per material, then `rampOf` does the rest. The games use a narrow set:

| Role | Colour |
| --- | --- |
| Ink, outlines, signals frame | `rgb(28,27,25)` |
| Signal fill | `rgb(255,214,10)` |
| Paper, halo | `rgb(255,255,255)` |
| Muted UI text | `#8b877f` |
| Grass ramp | `[34,62,50] [52,88,52] [82,118,54] [124,146,62] [168,172,76]` |
| Bark | `[92,74,60]` |
| Shoe | `[226,222,212]` |

UI text is the same monospace stack as the page, 13 px, lowercase status lines. Yellow means "in" or "act now". Ink on white means "out". Red is never used: it vanishes into clay, brick and skin.

## Screenshot check

Before calling a game or illustration done, take one 1:1 crop and one full-page shot, then verify:

1. White is 255,255,255 outside the ground, with no vignette or panel.
2. The ground edge scatters into single pixels over 8 to 12 px.
3. Every solid face holds three to four tones in a stable dither, not a gradient.
4. Shadows fall screen right, are violet-tinted, and stay inside the ground.
5. A figure is flat-banded, outlined at the feet, with no speckle inside.
6. Only plants and water move when the player is idle.
7. No element is drawn at fractional canvas scale.
8. Every painted shape above the size floor has a lit upper-left rim and a shaded lower-right rim. No sphere, box or figure was passed through `relief`.
