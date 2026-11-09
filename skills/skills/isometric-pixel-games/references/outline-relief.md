# Outline relief

Notes on SpriteCook's "Pixel art normal maps from outline" (https://www.spritecook.ai/blog/pixel-art-normal-maps-from-outline, 8 November 2026), on how `assets/relief.js` changes the method for this engine, and on the tests behind visual rule 11. The article states no licence, so this file describes its method and quotes none of its code.

## The method as published

The usual way to make a normal map treats brightness as height. That works for stone, brick and bark. It fails on sprites: the dark outline sinks, painted shading turns into bumps, and the shape stays flat.

The article makes height a function of distance from the transparent edge instead:

1. **Mask.** Alpha above 127 is inside.
2. **Distance.** A Euclidean distance transform runs on the mask padded by 1 px, so the canvas border counts as an edge. Without the padding, a sprite touching its canvas gets no bevel on that side. On their barrel, 56 of 702 pixels were affected.
3. **Bevel.** `r = clip(d / bevel, 0, 1)` and `h = top * sqrt(1 - (1 - r)²)`. That quarter circle rises steeply at the edge and is flat on top. The defaults are bevel 5 and top 12, for a sprite about 30 px wide.
4. **Detail.** Add `detail * (luminance - mean inside luminance)`, with detail 1.5 and luminance weights .299, .587, .114.
5. **Normals.** Blur the height at sigma .7, take central-difference gradients, and normalise `(-gx, +gy, 1)`. The `+gy` is there because the PNG stores green as up.
6. **Light.** A Godot point light with falloff, lit at `max(dot(N, L), 0)`, then stepped with `ceil(lit * bands) / bands` at 6 bands. Their reasoning is that an unstepped gradient looks like a filter laid over the art.

For floor tiles with no alpha, the dark gaps between stones become the edge. Tile the image 3x3, blur at sigma .8, call the darkest 30% gaps, then use bevel 3, top 2.5 and detail 1.

**Pitfalls they list.**

- Soft or ragged edges move the zero of the distance.
- Boxes turn into pillows. Use a 1 to 2 px bevel, or go back to brightness as height.
- A light lower than the bevel top darkens the whole sprite. They put a 26 px light over a 12 px top.
- A lit floor plus lit props gets busy.

## How this engine changes it

| Article | `relief.js` | Why |
| --- | --- | --- |
| Point light with radius falloff | The sun vector from `sphere()`, `(-.55, -.6, .58)` | Rule 4: light from the upper left, forever. Painted shapes and spheres then agree. |
| `ceil(lit * bands) / bands` times the colour | `floor((l - flat) * 3 + .5 + bayer)`, clamped to -3..+1, then `shiftTone` along the pixel's own ramp | Rule 6: dark steps drift violet and light steps drift warm. The flat top is step 0, so the painter's tones stay. |
| Full distance transform (SciPy) | Exact search inside the bevel radius | Height is capped at `bevel`, so nothing further away matters. Off-canvas pixels count as outside, which does the article's padding job. |
| Normal `(-gx, +gy, 1)` | `(-gx, -gy, 1)` | Screen y points down here. A ported shader that looks lit from below has this sign wrong. |
| Export PNG, light in a shader | Baked into `pix` once, in `bake()` | The engine is a CPU rasteriser. One call costs about 0.4 ms, so a small moving actor can also run it every frame. |
| Alpha mask | A kind mask, or the pixels whose depth changes between `reliefBegin()` and `reliefEnd()` | Ground surfaces have no alpha; they have `kinds`. Plotted surfaces have depth. |

## Tests

Both were run in Chromium from the canvas at 1x, then cropped and scaled up with nearest neighbour.

**Starter flagstones.** The patch is about 4 by 3.4 world units of Voronoi stones under the thrower, painted in `groundColor` as `KIND_FLAG` with joints of .3 units, and passed through `relief(..., { bevel: 2.5, top: 2.5, detail: 1 })`.

- Painted flat, they read as grey blobs. With relief, each stone has a lit upper-left rim and a shaded lower-right rim.
- Of the 228 px in the mask, 60 got lighter and 85 got darker.
- One call took 0.39 ms, including the scan of the whole canvas.

A bug found during the test: stone ids built as `a * 17 + b` came out negative, and `flag >= 0` rejected most of the stones. Keep ids non-negative.

**Masonry.** This was the `walls()` and `masonry()` code from techniques.md 4.1, with blocks of about 6 by 4 px. Four settings were tried against the flat version:

- detail 4
- gaps .3
- gaps .12
- bevel 1 with detail 6

None of them was an improvement. The blocks are too small to carry a rim. The gaps percentile also cuts out dark blocks as well as the mortar, which mottles the +x face. `masonry()` already paints mortar one level dark, and that is the right treatment at this size. That test is where the size floor of 8 px by 5 px comes from.

## Using it

- On ground, call it after the ground loop and before props, so props drawn later are not shaded:
  `relief(kinds.map(k => k === KIND_X), opts)`.
- For plotted shapes, wrap only the shape: `reliefBegin(); ...plot()...; reliefEnd(opts)`. Pixels in front of the shape stay out of the mask, so an occluding edge bevels like an outline. Plotted shapes also get `shadeEdges`, so start with a bevel of 1.5 to 2.
- Bevel, by width: 1 to 2 px for shapes with square corners, 2 to 3 for stones and slabs, up to 5 for a dome on a shape 30 px or more across. Keep `top` near `bevel` for a soft rim. Raise it for a harder one.
- Use `dither: 0` on a shape that should read as flat bands, the way figures do.
- Use `gaps` only for one texture that holds several blocks, each at least 8 px wide.
- Do not use it on `box`, `sphere`, `capsule`, `figure`, `growTree` leaves, or the grass tufts.
