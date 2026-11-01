# Techniques reference

Techniques read from `amirmushichge/pixel-plays` (MIT code). Use them to build new games with new subjects. Do not rebuild the five source games (bocce, bridge diving, rooftop laundry, clay tennis, skate mini ramp) or copy their layouts.

The `.mp3` tracks are not MIT. `MUSIC.md` says they were generated with Suno for these games and "are not licensed for reuse outside this project". Ship your own track or none; a game runs without it.

How to read an entry: what it does on screen, where it lives (`file:function:line`, lines approximate, paths from the repo root), the mechanism, key constants, and sometimes an excerpt. Excerpts are lightly generalised; CAPS names are constants you supply. "Inferred" marks anything not read directly from code or comments.

## 0. Coordinates used throughout

- World x, y lie on the ground, z points up. `project(x, y, z)` returns `sx, sy` and depth `d` (larger is nearer the camera). `S = 10` px per unit along screen-horizontal. (`engine.js:53`)
- `u = (x - y) / √2` is screen-horizontal, `v = (x + y) / √2` runs toward the camera. So +x goes screen right and down, +y goes screen left and down.
- Three faces of a solid can face the camera: the top, the +y face (lower left) and the +x face (lower right). Light comes from the upper left. `box()` shades them at base levels 3.4, 2.3 and 1.2 (`engine.js:95`). Hand-built walls use `masonry(..., 3)` on +y faces and `masonry(..., 2)` on +x faces.
- Ground depth of a pixel is `(g.x + g.y) / R2 * COS` with `g = unproject(ix + .5, iy + .5)`.
- `plot`, `box`, `sphere`, `capsule` and mini-ramp's `paint` test and write `zb`. `drawDots` writes pixels with no depth test, so use it only for overlays drawn after `shadeEdges()`.
- Sample spacing for hand-plotted surfaces is `.03` to `.07` units, always under 1 px on screen, so every screen pixel gets at least one sample and the surface has no holes.

## 1. Scene config (`PP_SCENE`)

Set it in an inline script before `<script src="../engine.js">`; the engine reads it once at load (`engine.js:4-8`).

| Game | originY | shadowX | shadowY | origin on canvas (OY) | shadow travel per unit of height |
|---|---|---|---|---|---|
| engine default | 0 | 1.3 | -.12 | 140 | 10.0 px right, 4.2 px down |
| balote | 22 | 1.3 | -.12 | 162 | 10.0 right, 4.2 down |
| stari-most | 46 | .55 | -.08 | 186 | 4.5 right, 1.7 down |
| laundry | -18 | .9 | -.35 | 122 | 8.8 right, 1.9 down |
| tie-break | 10 | .9 | -.6 | 150 | 10.6 right, 1.1 down |
| mini-ramp | 26 | .9 | -.6 | 166 | 10.6 right, 1.1 down |

The last column is computed from `castShadow` and `project`, not stated in the source.

- `originY`: `OY = H / 2 + originY`. Positive values move the world origin down the canvas and leave headroom above. Stari Most needs 46 because its deck peaks at z 11.2 and its towers reach 10.2 plus a roof (inferred). Laundry uses -18 because its walls hang 6 units below the roof (inferred).
- `shadowX`, `shadowY`: `castShadow(x, y, z, r)` drops a disc at `(x + shadowX * z, y + shadowY * z, 0)`. On screen it moves right by `(shadowX - shadowY) / √2 * 10` px and down by `(shadowX + shadowY) / √2 * 5` px per unit of height. A larger difference gives longer shadows; a sum near 0 keeps them level, running straight right. Stari Most shortens shadows to .55, probably so its tall masonry does not throw shadows off the diorama (inferred).
- mini-ramp converts these into its own ramp axes (`SHADOW_ALONG`, `SHADOW_ACROSS`, section 5.4).

## 2. Ground surfaces

### 2.1 Ragged edge that dissolves into white

On screen: the playable place is a rounded rectangle whose border breaks into scattered pixels, then white page.
Where: `groundColor` in `stari-most:77`, `tie-break:80`, `mini-ramp:86`.
Mechanism: a superellipse with exponent 4 gives a rounded-rectangle distance that is 1 on the border. Low-frequency noise jitters it. Past 1.04 the function returns 0 (no ground, white). Between a start value and 1.04 a per-pixel hash removes pixels, more of them toward the edge.

| Game | half-size x | half-size y | jitter | dissolve starts | over |
|---|---|---|---|---|---|
| stari-most | 15.6 | 10.4 | .13 | .93 | .11 |
| tie-break | 16.2 | 11 | .1 | .94 | .1 |
| mini-ramp | 16.6 along `a` | 11.4 along `w + .6` | .1 | .94 | .1 |

mini-ramp measures in its rotated `a, w` axes and shifts the centre back by .6. Laundry uses a hard rectangle (`|x| > 12.5 || |y| > 7` returns 0) and lets the building walls dissolve downward instead (section 4.6).

```js
function groundColor(x, y, ix, iy, i) {
  const edge = Math.pow(Math.pow(Math.abs(x) / HALF_X, 4) + Math.pow(Math.abs(y) / HALF_Y, 4), .25);
  const rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .1;
  if (rough > 1.04) return 0;                                       // white page
  if (rough > .94 && hash(ix, iy) < (rough - .94) / .1) return 0;  // scattered border
  const fine = hash(ix, iy);
  if (inMainSurface(x, y)) {
    kinds[i] = KIND_MAIN;
    const v = .5 + (noise(x * .6, y * .7) - .5) * .6;
    return rgb(...MAIN_TONES[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * .6), 0, 3)]);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (fine - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
```

### 2.2 Close-tone fills

On screen: large flat areas read as one material with soft grain, not a checkerboard.
Where: `CLAY_TONES` (`tie-break:76`), `CONCRETE_TONES` (`mini-ramp:55`), `WATER_TONES`, `BEACH_TONES` (`stari-most:53-54`), `SAND_TONES` (`balote`).
Mechanism: four hand-picked tones roughly 8 to 10 apart per channel, picked by `floor(v * 4 + (bayer - .5) * k)` with k .6 to .7. The README rule: "Large flat surfaces use closely spaced tones; wide steps make the dither read as a checkerboard." Tie-break repeats it in a comment. Stari Most wraps it as `toneOf(tones, v, ix, iy)` (line 75).

- Clay: `[172,90,58] [181,97,62] [190,104,67] [199,112,73]`.
- Concrete: `[176,172,164] [184,180,171] [192,188,178] [200,196,186]`.
- Water (wider steps on purpose, for depth): `[34,102,108] [44,122,120] [62,146,134] [94,172,150]`.
- Grass uses the engine `GRASS` ramp with hash speckle and no Bayer term (formula in the excerpt above).
- Dirt rim between surface and grass: band width `.2 + noise(x * 2.2, y * 2.2) * .8` (tie-break) or `.3 + ...` (mini-ramp), colour `rampOf(DIRT)[clamp(floor(1.5 + (.25 + noise(x*3, y*3) * .6) * 2.4 + (bayer - .5) * .9), 1, 4)]`, `DIRT = [132,100,72]`.

### 2.3 Per-pixel kinds

`kinds` is a `Uint8Array(W * H)` in the engine. `KIND_NONE = 0` and `KIND_GRASS = 3` are reserved; games use 1 and 2 for their own surfaces. Set `kinds[i]` inside `groundColor` before returning.

Readers of `kinds`: `growGrass` (tufts only on grass), `drawTufts` (draws only over grass or none), `drawWater` and `drawRings` (water only), `markClay` (clay only), balote `stampTrack` (court only). Laundry sets no kinds and never calls `growGrass`, so its roof has no grass.

### 2.4 Specks, pebbles, moss

- Pebbles with their own shadow (`stari-most:90-91`): pale `rgb(240,236,220)` where `hash(ix, iy) > .96`, dark `rgb(150,142,126)` where `hash(ix - 1, iy - 1) > .96`. The offset hash puts the dark pixel one step down and right of each pale one, a lit top with a shadow (derived from the offset).
- Light specks on clay: `fine > .985` gives `rampOf(CLAY)[4]`. Dark specks on concrete: `fine > .985` gives `rgb(150,146,140)`. Light specks on pavers: `fine > .975` gives `ramp[4]`.
- Moss in damp patches (`laundry:95`): `noise(x * .5, y * .5) > .7 && fine > .55` gives `rgb(116,122,70)`. Low-frequency noise chooses the patch, the hash thins it.

### 2.5 Tiles and slabs

- Staggered pavers (`laundry:87-97`): 1.5-unit tiles, every other row shifted half a tile, joints where the fraction is under .08 use `ramp[1]`. Tile tone comes from `hash(row, col)` and is clamped to levels 2 to 4, so only joints are dark.
- Concrete slab joints (`mini-ramp:95-96`): every 4 units along `a` and `w`, line widths .012 and .018 of the period, drawn only where `fine > .15`, so about 15% of joint pixels stay concrete and the lines look broken (visual effect inferred).

### 2.6 Painted court lines and wear

Where: `tie-break:groundColor:85-98`.
Mechanism: lines are tested in world units inside `groundColor`, so the projection draws them in perspective with no extra code. `LINE = rgb(246,238,220)`. Baseline `|ax - 11| < .09`, sideline `|ay - 4.6| < .09`, service line `|ax - 6| < .07`, centre line `ay < .07`. `fine > .07` leaves 7% of line pixels as clay (chalky look, inferred). Near the baselines the tone value rises by `max(0, 1 - |ax - 10.6| / 1.4) * max(0, 1 - ay / 6) * .34` ("the baselines wear pale where players run"). A brushed grain adds `sin(y * 4 + noise(x * .3, y) * 3) * .04`.

### 2.7 Marks stamped into baked pixels during play

- Ball marks (`tie-break:markClay:354`): on each first bounce darken a 5x3 blob (skip corners where `|dx| == 2 && dy != 0`) in `bakedPix` by (.88, .84, .82), skipping non-clay and `LINE` pixels. Repeat hits darken further.
- Roll tracks (`balote:stampTrack:103`): one pixel per position while speed > .4, darkened by (.88, .87, .9); a `trackMark` mask prevents darkening a pixel twice.
- Reset: tie-break saves `pristinePix` after `bake()` and copies it back into `bakedPix` on `resetMatch` (lines 176, 349).

Write marks into `bakedPix`, not `pix`; `pix` is overwritten from `bakedPix` every frame.

## 3. Water, weather and animated surfaces

The source has no reflections. Water reads through depth tones, flowing streaks, rings and drops.

### 3.1 River body (stari-most)

`riverHalf(y) = 6 + (noise(y * .25 + 9, 3) - .5) * 1.2` gives wobbling banks (line 74). Water tone `v = .1 + shore² * .7 + (noise(x * .6, y * .3) - .5) * .35`, with `shore = |x| / half`, so the channel is dark in the middle and light at the shallows. A beach band follows, width `1.1 + noise(x * 2, y * 2) * .9`. Bake 44 rough limestone spheres along the banks (`r = .35 + hash * .7`, centre at `z = r * .28` so most of each sphere is buried, skipped where `|y| < 1.8`) plus 4 placed by hand.

### 3.2 Flowing streaks

Where: `stari-most:STREAKS:513`, `drawWater:517`.
Mechanism: 340 streaks with fixed random x, start y, speed and length. Each frame their y advances and wraps; each draws a few samples on the ground plane. A streak only replaces pixels that are visible water (`kinds === KIND_WATER && zb === groundZ`), so it never paints over the bridge or a figure. Pixels in baked shadow use a dim colour. Time is the stepped `windT`, so the flow moves at 8 fps and stops under reduced motion.
Constants: x within ±5.5, wrap length 21, speed .9 to 2.0, 2 to 4 samples spaced .11, 28% bright. Colours lit `rgb(150,208,180)`, soft `rgb(104,180,158)`, dim `rgb(58,112,120)`.

```js
const STREAKS = [];
for (let k = 0; k < 340; k++) STREAKS.push({ x: (hash(k, 31) - .5) * 11, y0: hash(k, 32) * 21,
  speed: .9 + hash(k, 33) * 1.1, len: 2 + (hash(k, 34) * 3 | 0), bright: hash(k, 35) > .72 });
function drawWater(t) {
  for (const s of STREAKS) {
    const y = ((s.y0 + t * s.speed) % 21) - 10.5;
    for (let k = 0; k < s.len; k++) {
      const p = project(s.x + Math.sin(y * .4 + s.y0) * .3, y + k * .11, 0), ix = p.sx | 0, iy = p.sy | 0;
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const i = iy * W + ix;
      if (kinds[i] !== KIND_WATER || zb[i] !== groundZ[i]) continue;
      pix[i] = staticShadow[i] ? DIM : s.bright ? LIT : SOFT;
    }
  }
}
```

### 3.3 Splash rings and drops

Where: `stari-most:entry:402-407`, `update:455-461`, `drawRings:530`, `drawDrops:543`.
- Rings: push two, `{r: .3, life: 1}` and `{r: 0, life: 1.3}`. Each frame `r += dt * 1.5 * life`, `life -= dt * .4`. Draw `max(10, ceil(r * 22))` points around the circle on the ground plane and skip a point when `hash(k, r * 40 | 0) > life`, so rings break up as they fade. Colour `rgb(226,240,226)`, visible water only.
- Drops: `round(8 + (1 - q) * 90)` drops, where q is entry quality. Horizontal speed `rand * (.5 + (1 - q) * 2.6)`, upward speed `2 + rand * (q > .88 ? 8 : 5)`, game gravity 8.5, removed at z 0. One pixel each, `rgb(244,250,244)`, drawn after `shadeEdges` with no depth test. A clean entry throws a tall narrow column, a flat one a wide spray (derived from the formulas).

### 3.4 Sinking below a surface

The diver's skeleton is clipped at z .02: a bone with both ends below is skipped, a bone crossing the plane has its low end moved to the crossing point (`stari-most:drawDiver:477-479`). Under water the body sinks at 7 units/s to z -3 and stops drawing below -1.4. After 1 s a head and hair pair bobs at the surface (`sin(time * 3) * .03`) and swims toward the +x bank at .55 units/s for up to 3.4 units.

### 3.5 Storm: rain, clouds, lightning, colour grade (laundry)

Timeline: `stormLevel = ease(clamp((t - 10) / 18, 0, 1))`, `rainLevel = clamp((t - 28) / 8, 0, 1)`, game length 48 s. After the game ends the clock runs at double speed to 48, so a quick player watches the storm from the dry side (comment, line 366).

- Rain (`updateRain:432`, `drawRain:497`): `floor(rain * 520)` drops falling 26 units/s, drifting `3 + gustGlow * 5` units/s in +x. Each draws as a 4-sample slanted streak, depth-tested, `rgb(112,134,188)`. A drop that lands on the roof leaves a 3 px splash, `rgb(212,224,244)`, for .12 s.
- Clouds (`drawClouds:462`): 26 screen-space ellipses (1.5:1, radius 8 to 17 px, y 20 to 46 px) fade in one by one as the storm grows, drift with `windT` at 3 to 6 px/s, fade over 34 px near the canvas sides, use Bayer coverage for soft edges, and shade from the upper left with `rampOf([150,148,170])`. They draw only on empty pixels (`zb < -1e8`), never over the scene.
- Lightning (`strike:453`, `drawBolt:481`): the 22 s countdown only runs once the game clock passes 18, so the first bolt comes about 40 s in, then every 3.5 to 7.5 s. A screen-space polyline from y 44 to 150, stepping 8 to 18 px down and up to ±9 px sideways, starting at x 40 to 90 or 270 to 320 (beside the diorama). 3 px wide: centre `rgb(250,240,150)`, sides `rgb(120,112,214)`, empty pixels only. `flash` starts at 1, decays 3.2/s, and the bolt disappears below .35.
- Grade (`gradeStorm:516`): runs after `shadeEdges`, over every non-empty pixel.

```js
const rm = 1 - .46 * storm, gm = 1 - .36 * storm, bm = 1 - .2 * storm;  // cool and darken
const ra = 8 * storm, ga = 12 * storm, ba = 26 * storm;
for (let i = 0; i < W * H; i++) {
  if (zb[i] < -1e8) continue;                        // leave the white page alone
  const c = pix[i], ix = i % W, iy = i / W | 0;
  let r = (c & 255) * rm + ra, g = (c >> 8 & 255) * gm + ga, b = (c >> 16 & 255) * bm + ba;
  // cloud shadows: noise on 8x8 px cells, recomputed only when windT changes
  if (cloudCells[(iy >> 3) * CELLS_W + (ix >> 3)] + bayerAt(ix, iy) * .22 > 1 - storm * .62) { r *= .76; g *= .76; b *= .82; }
  if (wet > 0 && zb[i] === groundZ[i]) {
    const damp = 1 - wet * .24; r *= damp; g *= damp; b *= damp + wet * .05;
    if (puddle[i] > 1 - wet * .42) { r = lerp(r, 92, .7); g = lerp(g, 108, .7); b = lerp(b, 140, .7); }
  }
  if (flash > 0) { r = lerp(r, 244, flash); g = lerp(g, 244, flash); b = lerp(b, 255, flash); }
  pix[i] = rgb(r, g, b);
}
```

`puddle[i]` is baked per ground pixel as `noise(x * .55 + 3, y * .8 + 7)`; `wet` rises by `rain * dt / 14`; `flash` is `G.flash * .4`.

### 3.6 Dust puffs

On each first bounce tie-break spawns 6 particles: horizontal speed ±1.2 plus 6% of the ball's, upward 1 to 2.4, gravity 7, life .32 s, colour `rgb(224,170,130)`, drawn with `drawDots` (`tie-break:land:370`, `draw:546`).

## 4. Built structures

### 4.1 Masonry texture

Where: `stari-most:masonry:100`; laundry variant `wallColor:98`.
Mechanism: `a` is the coordinate along the wall. Courses are .625 units high and blocks .83 wide, every other course shifted half a block. Mortar joints are one level darker, and a per-block hash makes some blocks a level lighter or darker. Laundry's variant shows plaster where `noise(a * .4, z * .5 + 4) <= .68` and stone masonry elsewhere ("patches fallen away"). It adds 40 to z so `floor` behaves below the roof (inferred).

```js
function masonry(a, z, base, c = STONE) {
  const fz = z * 1.6, course = Math.floor(fz);
  const fa = a * 1.2 + (course % 2) * .5, block = Math.floor(fa);
  const mortar = fz - course < .14 || fa - block < .1;
  const tone = hash(block, course);
  return rampOf(c)[clamp(base + (tone > .75 ? 1 : tone < .2 ? -1 : 0) - (mortar ? 1 : 0), 0, 4)];
}
// a solid seen from this camera: paint only the two faces that face it
function walls(x0, y0, x1, y1, z1) {
  const step = .045;
  for (let a = x0; a <= x1; a += step) for (let z = 0; z <= z1; z += step) plot(a, y1, z, masonry(a, z, 3));
  for (let a = y0; a <= y1; a += step) for (let z = 0; z <= z1; z += step) plot(x1, a, z, masonry(a, z, 2));
}
```

`STONE = [216,206,184]`, `SLATE = [120,112,110]`, `TILE = [168,96,70]`, `DARK = [44,40,50]` (stari-most). `PLASTER = [234,224,202]`, `STONE = [206,194,170]`, `SHUTTER = [70,112,104]` (laundry).

### 4.2 Windows and doors

Plot dark rectangles .14 units in front of the wall (`y1 + .14` or `x1 + .14`) so they win the depth test. Colour `rampOf(DARK)[1]`, mullion `ramp[3]` where `|a - cx| < .03`.
- House windows (`stari-most:house:192`): `max(1, floor(width / 1.6))` of them, .48 wide, .8 tall, bottom at `z1 * .55`.
- Tower windows (`squareTower:149`): three, at (fraction along, fraction of height) `[.35,.3] [.65,.55] [.35,.78]`, .44 by .8.
- Shuttered windows (`laundry:buildWalls:117-127`): window .9 by 1.8 with a cross mullion, shutters .5 wide each side with louvres `floor((z + 3) * 7) % 2` picking `rampOf(SHUTTER)` 3 or 2. Five on the long wall, three on the short.
- Plank door (`laundry:140`): `rampOf(SHUTTER)[floor(a * 3) % 2 ? 2 : 1]`.

### 4.3 Pointed arch bridge

Where: `stari-most:buildBridge:106`.
Mechanism: two circular arcs whose centres sit `ARCH_C` past the centreline, so they meet in a soft point. The underside is swept by angle, not by x, "so its steep haunches have no gaps". The near face (`y = HALF_W`) is filled from the arch line up to the deck, with three bands: a pale string course just under the deck top, a ring of voussoirs with radial joints, and plain masonry elsewhere. The deck is ribbed (`floor(x * 2.6) % 2` alternates levels 3 and 4); the parapet is two faces .2 apart plus a pale cap.
Constants: `ARCH_A 7.2`, `ARCH_C 1.2`, `ARCH_R 8.4`, `ARCH_BASE 2.2` (crown at z 10.51), `DECK_END 8.4`, `DECK_LOW 6.9`, `DECK_TOP 11.2`, `DECK_REACH 10.2`, `HALF_W 1.15`, `PARAPET .45`. Deck profile `DECK_TOP - (DECK_TOP - DECK_LOW) * (|x| / DECK_END) ** 1.6`. Voussoir ring where radius `< ARCH_R + .62`, joint where `(atan2(z - ARCH_BASE, |x| + ARCH_C) * 26) % 1 < .16`. String course `top - .24 < z < top - .1`.

```js
const archZ = x => ARCH_BASE + Math.sqrt(Math.max(0, ARCH_R ** 2 - (Math.abs(x) + ARCH_C) ** 2));
const crown = Math.acos(ARCH_C / ARCH_R);
for (let t = 0; t <= crown; t += .002) {             // sweep by angle along each arc
  const a = ARCH_R * Math.cos(t) - ARCH_C, z = ARCH_BASE + ARCH_R * Math.sin(t);
  for (let y = -HALF_W; y <= HALF_W; y += .04) {
    plot(-a, y, z, masonry(y + t * 4, t * 8, 2));
    plot(a, y, z, masonry(y + t * 4, t * 8, 1));
  }
}
```

### 4.4 Towers and roofs

- Round tower (`stari-most:roundTower:159`): a cylinder plotted by angle (step .016). Per-angle light `l = -.5 * nx + .85 * ny` sets the masonry base `clamp(round(2.4 + l * 1.3), 1, 4)`. Cone roof: radius `(r + .2) * (1 - q)`, height `q * 2.1`, slate bands `floor(q * 12) % 2` adding .4. Slit windows on the arc at radius `r + .14`.
- Gable roof (`roof:181`): ridge along x at the middle of y; height `z + rise * (1 - q)` with `q = |y - yc| / half`; tile rows `floor(q * half * 3.4) % 2`; the +y slope uses base 3, the far slope base 1, a hash above .85 darkens a tile; the gable triangle on the x1 end uses masonry base 2. Overhang .15 (towers) or .2 (houses); rise 1.4 or 1.3.
- Placement in Stari Most: square tower at x -12.4 to -10.2 (height 10.2), round tower at x 11.8 (r 1.9, height 9.4), four houses at the corners, so the two banks frame the bridge.

### 4.5 Shadows for hand-plotted solids

`plot()` casts no shadow. Fill the volume with `castShadow` samples during bake. `shadowBox` (`stari-most:205`): x and y every .5, z from .3 every .7, radius .55. Bridge: x every .3, z every .45, y from -.9 to .9 every .6, radius .5. Poles: every .4 in z, radius .12, dither 0. A thin line: every .4, radius .05.

### 4.6 A building that sinks into the page (laundry)

The roof is the ground at z 0. Walls run from z 0 down to -6 on the +y and +x faces. Below z -3 each pixel is dropped with probability `(-z - 3) / 3`, so the facade fades into white ("the building drops away below the roof and dissolves into the white page", line 107). Use `originY` to lift the scene so the hanging walls fit.

```js
function wallPixel(x, y, z, a, base) {
  const fade = (-z - (WALL_DEPTH - 3)) / 3;           // 0 at z = -3, 1 at z = -6
  if (fade > 0 && hash(a * 23 | 0, z * 23 | 0) < fade) return;
  plot(x, y, z, wallColor(a, z, base));
}
```

Parapet: four `box` calls .3 thick and .6 tall around the roof edge. Props: a stair head box with a plank door and a slab cap, a water tank (`capsule` radius .55, `'rough'`), a chimney (stone box, plaster cap, pot), and an aerial (a plotted pole to z 5 with crossbars at z 4.8, 4.4 and 4 of half-width .7, 1 and 1.3, skewed `y - a * .3`).

### 4.7 Fences, nets, poles, lines

- Chain-link fence (`tie-break:fence:108`): sample the panel every .035; plot a wire pixel only where `frac((a + z) * 1.5) <= .11` or `frac((a - z) * 1.5) <= .11`, giving diagonal diamonds every .67 units. Wire `rgb(116,122,116)`, posts `box` .14 square every 4 units, top rail `capsule` radius .05, height 3.2.
- Net (`tie-break:bake:141-149`): "a mesh of single pixels under a white tape, so the ball stays visible behind it". Sample every .03; tape for the top .13 units `rgb(248,244,232)`; wire where `frac(y * 2.8) < .2` or `frac(z * 3.4) < .24`, `rgb(58,60,62)`. Shadow: `castShadow` every .15 along the net at z .75, radius .09, dither .5.
- Sagging line (`laundry:buildRoof:160-168`): poles are `box` .18 square up to `LINE_Z + .25`; `lineZ(x) = 3.7 - .22 * (1 - (x / 10) ** 2)` sags .22 in the middle; plot rope every .04 in `rampOf([238,234,222])[3]`.
- Railings and ladder (`mini-ramp:bakeRamp:175-184`): `capsule` radius .06 `'solid'` posts 1.5 high with a top rail; ladder rails radius .06 and rungs radius .05 every .75.
- Coping or any round rail: `capsule` radius .1, `STEEL = [176,182,186]`, `'gloss'`.

### 4.8 Containers and small furniture

- Woven basket (`laundry:169-175`): cylinder by angle (step .02); level `round(2.6 - .5 * nx + .85 * ny) + weave - 1`, weave `(floor(z * 8) + floor(t * 7)) % 2`, one level brighter in the top .1. Inside, a dark disc at `h - .04` in `rampOf(DARK)[1]`. `BASKET = { x: 9.8, y: 5.2, r: .95, h: 1 }`.
- Bench, chair, bags, bottle, ball basket (`tie-break:bake:151-170`): all `box`, except a `'gloss'` capsule bottle and nine `'gloss'` spheres in the basket. Cone (`mini-ramp:201`): a capsule from radius .34 to .06 with a white band where `.35 < z < .6`.

### 4.9 Baking a static figure

Tie-break bakes the umpire into the background (`tie-break:156-158`): clear `pendingShadows`, call `figure(...)` with `dynamicAdd`, add extra `castShadow` samples for the chair, then `flushShadows()` before `bakeOcclusion()`. The figure becomes part of `bakedPix` and its shadow part of `staticShadow`. Use this for anyone who never moves.

## 5. Curved surfaces painted outside `box()` (mini-ramp)

### 5.1 A screen-aligned frame

"The ramp runs along screen-horizontal `a`; `w` runs towards the camera" (`mini-ramp:67`). `world(a, w, z) = [(a + w) / R2, (w - a) / R2, z]`. Because `a` equals screen `u`, a profile built in `a, z` shows exactly side-on.

### 5.2 Profile functions

`pointOnRamp(s)` maps arc length `s` (centre 0) to position `a`, height `z` and surface angle `th`, for the rider. `surfaceAt(a, w)` returns the surface height under any point, for shadows and the slam board.

```js
const FLAT = 3.6, RADIUS = 4.4, LIP_A = FLAT + RADIUS, DECK_A = 10.6, RAMP_W = 4.6;
const LIP_S = FLAT + RADIUS * Math.PI / 2;           // arc length to the coping, about 10.51
const world = (a, w, z) => [(a + w) / R2, (w - a) / R2, z];
function pointOnRamp(s) {
  const n = Math.abs(s), sign = s < 0 ? -1 : 1;
  if (n <= FLAT) return { a: s, z: 0, th: 0 };
  if (n >= LIP_S) return { a: sign * LIP_A + (s - sign * LIP_S), z: RADIUS, th: 0 };
  const t = (n - FLAT) / RADIUS;
  return { a: sign * (FLAT + RADIUS * Math.sin(t)), z: RADIUS * (1 - Math.cos(t)), th: sign * t };
}
function surfaceAt(a, w) {
  const n = Math.abs(a);
  if (Math.abs(w) > RAMP_W || n <= FLAT || n >= DECK_A) return 0;
  if (n >= LIP_A) return RADIUS;
  const d = n - FLAT;
  return RADIUS - Math.sqrt(RADIUS * RADIUS - d * d);
}
```

### 5.3 Painting the sweep

Where: `paint:109`, `bakeRamp:150`.
Mechanism: walk `s` across the whole ramp (step .04) and `w` across its width (step .07), and paint the projected point with a depth test. Shade by facing: `facing = sin(th)`, level `3 + .85 * facing` toward the light or `3 + 1.5 * facing` away, plus noise ±.25. Sheet seams every 2.44 along `s` and every 2.3 across `w` drop one level. "The line everyone rides is worn darker": `|w - .3| < 1.3` loses .35. Decks switch from masonite `[150,108,74]` to plywood `[198,160,112]` with +.4. A local `pick(ramp, level, ix, iy)` adds Bayer ±.3.
Near side section at `w = RAMP_W`: fill from 0 to `surfaceAt(a, 0)`; studs every 1.7 (`|a / 1.7 - round| < .03`) and rails in the top .16 and bottom .14 use `FRAME [122,88,58]` at 2.4; the rest plywood at 1.9 ± .3.
`paint` records `rampMask[i]`. After static shadows are applied, `ground[i] = 1` is set for masked pixels, so "the ramp's surface takes moving shadows like the ground does" (line 210).

### 5.4 Shadows that bend over a surface

"Shadows bend over the ramp: drop each point along the light until it meets the surface" (`stampShadow:443`). Two fixed-point steps are enough: offset by the height above the surface, look up the surface there, offset again by the corrected height. `flushRampShadows` replaces `flushShadows` and feeds every bone sample through it. Then call `applyShadows(bakedZ)`, not `groundZ`, because ramp pixels are not ground depth.

```js
const SHADOW_ALONG = (SHADOW_X - SHADOW_Y) / R2, SHADOW_ACROSS = (SHADOW_X + SHADOW_Y) / R2;
function stampShadow(a, w, z, r, strength) {
  let h = Math.max(0, z - surfaceAt(a, w)), sa = a + h * SHADOW_ALONG, sw = w + h * SHADOW_ACROSS;
  let sz = surfaceAt(sa, sw);
  h = Math.max(0, z - sz); sa = a + h * SHADOW_ALONG; sw = w + h * SHADOW_ACROSS; sz = surfaceAt(sa, sw);
  const p = project(...world(sa, sw, sz)), rx = r * S * 1.05, ry = rx * SIN + 1;
  for (let iy = Math.max(0, p.sy - ry | 0); iy <= Math.min(H - 1, Math.ceil(p.sy + ry)); iy++)
    for (let ix = Math.max(0, p.sx - rx | 0); ix <= Math.min(W - 1, Math.ceil(p.sx + rx)); ix++) {
      const dx = (ix + .5 - p.sx) / rx, dy = (iy + .5 - p.sy) / ry, i = iy * W + ix;
      if (dx * dx + dy * dy <= 1 && shadowMask[i] < strength) shadowMask[i] = strength;
    }
}
```

## 6. Cloth on lines (laundry)

### 6.1 Item types

| kind | w | h | value | carry speed (units/s) |
|---|---|---|---|---|
| sheet | 3 | 2.4 | 5 | 6.5 |
| towel | 1.5 | 1.6 | 3 | 9 |
| shirt | 1.9 | 1.75 | 3 | 10 |
| trousers | 1.25 | 2.1 | 3 | 10 |
| sock | .5 | .8 | 1 | 18 |

Three lines at y -4.2, -.8 and 2.6, each with a fixed set of seven shuffled kinds, centred with gaps of `min(1.1, (17 - total) / (n - 1))`. Colours come from 8 cloth tones; 45% of items get stripes in an accent colour (`hangWashing:208`). Bigger pieces score more and drag slower, which is the game's trade-off.

### 6.2 Silhouettes as a test in cloth space

`inside(item, u, v)` (line 226) decides which samples belong to the shape. `u` runs across the width from the centre, `v` runs down from the line.
- shirt: `|u| < w * .3 || v < h * .32 + (|u| - w * .3) * -.3` (body plus sloping sleeves)
- trousers: `v < h * .32 || |u| > .06` (waistband, then two legs with a gap)
- sock: `v < h * .62 ? |u| < w * .3 : u > -w * .3` (leg, then a foot turned one way)
- everything else: a full rectangle.

### 6.3 Drawing a rippling cloth

Where: `drawCloth:233`.
Mechanism: sample `u, v` every .055 and displace each sample sideways by a travelling sine wave. While pinned, the displacement grows with distance from the pegs (`reach = v / h + .12`). The cosine of the same wave picks the shade level, so each fold has a lit side and a shaded side. Wet cloth drops one level once `wet >= .56`. Each pixel writes the item id into `itemBuf` for picking (6.5).
Constants: amplitude .55 when loose, .4 when flying or held, `.12 * (1 + storm * .9 + gustGlow * 1.2)` on the line; wave speed 9 when loose, else `3 + storm * 2`. Held cloth shears backward by `clamp(vx * .05, -.7, .7)` per unit of `v`, so it trails the drag.

```js
for (let u = -item.w / 2; u <= item.w / 2; u += .055) for (let v = 0; v <= item.h; v += .055) {
  if (!inside(item, u, v)) continue;
  const wave = u * 3.2 + t * speed + item.phase + v * 1.2, s = Math.sin(wave), c = Math.cos(wave);
  const reach = pinned ? v / item.h + .12 : 1;
  const px = item.x + u * cr - v * sr - trailX * v;     // cr, sr: cos and sin of item.rot
  const py = item.y + s * amp * reach;
  const pz = Math.max(.05, item.z - v * cr - u * sr);
  const level = clamp(3 + Math.round(c * 1.1) - Math.floor(item.wet * 1.8), 0, 4);
  const stripe = item.stripes && Math.floor((item.kind === 'sheet' ? u * 2.4 : v * 5) + 40) % 2;
  const p = project(px, py, pz), ix = p.sx | 0, iy = p.sy | 0;
  if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
  const i = iy * W + ix;
  if (p.d <= zb[i]) continue;
  zb[i] = p.d; pix[i] = (stripe ? accentRamp : ramp)[level]; itemBuf[i] = item.id;
}
```

Cloth lying on the ground is drawn flat: `pz = .05 + (s + 1) * .03`. Pegs: one on a sock, two at `±.42 * w`, brown `rgb(120,92,62)`, turning `SIGNAL` yellow while the item is about to blow off. Shadows: one sample for a sock, three across the width, at `z - h / 2`, radius `max(.22, h * .34)`, dither .4.

### 6.4 States and motion

`line` (pinned) -> `loose` (pegs yellow, pops after .9 s) -> `flying` -> `held`, `falling`, `ground`, `basket` or `lost`.
- Gusts (`gust:306`): first at 8 s, then every `lerp(7, 3, storm) * (.8 to 1.2)` s. Each loosens `1 + round(storm * 2)` pinned items and relaunches half of the ground items.
- Launch (`launch:317`): speed `3.2 + storm * 1.8`, heading jitter ±.35 rad, spin ±1.3 rad/s, z at least 2.4. "An item near an edge blows back across the roof, so there is always time to catch it": if `|x| > 3` it flies toward the centre.
- Flying: `vz = sin(time * 2.7 + phase) * 1.1 + (3 - z) * .7`, a hover spring around z 3 with flutter. Past the roof edge by 1.2, `vz = -9`; below z -7 the item is lost.
- Falling: gravity 14, rotation decays by .9 per frame, lands below z .6.
- Held: moves toward the target at its carry speed, eases to `CARRY_Z + h / 2` (`CARRY_Z 1.7`) at rate 10/s, rotation decays by .8 per frame.
- Banking: value times `(1 - wet * .7)`, rounded to .1. Items in the basket draw as a pile of `'solid'` spheres (radius .42, socks .2) stacked `min(1.1, k * .06)` high.

### 6.5 Picking by pixel

`itemBuf` (`Uint16Array`) is cleared every frame and filled by `drawCloth`. `pickAt` searches square rings out to 6 px, "a few pixels of slack, so socks can be caught on a phone".

```js
function pickAt(sx, sy) {
  for (let radius = 0; radius <= 6; radius++)
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
      const ix = Math.round(sx) + dx, iy = Math.round(sy) + dy;
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const id = itemBuf[iy * W + ix];
      if (id) return items[id - 1];
    }
  return null;
}
```

Drop test (`overBasket:348`): screen distance between the item's bottom centre and the basket rim under `DROP_PX = 26`.

## 7. Vegetation

### 7.1 Palms (mini-ramp)

Where: `growPalm:119`. "A leaning ringed trunk under drooping fronds; the fronds sway in drawLeaves like any other leaves."
Mechanism: the trunk is 7 capsules along a curve whose lean grows with the square of height, colour-banded every ~.3 units between bark `[128,104,80]` and ring `[96,76,60]`. Three coconut spheres sit under the crown. Ten fronds each follow a parabola that rises, then droops. Every frond sample is three small spheres (a rib and two leaflets hanging .22 lower) captured into `leaves[]`, the same path `growTree` uses, so `drawLeaves` sways them and casts their shadows.
Constants: height `5.6 * scale`, lean `1.1 * scale`, trunk radius .3 to .17, frond length `2.7 + rand * .9`, rise `.9 + rand * .8`, drop `rise * u - 2.4 * u * u`, width `.42 * (1 - .55 * u)`, 11 samples. Tones `PALM_DEEP [38,88,58]`, `PALM_MID [70,128,62]`, `PALM_LIGHT [132,168,72]`, thresholds .35 and .85.

```js
const trunkAt = t => [bx + leanX * t * t, by + leanY * t * t, height * t];
for (let f = 0; f < 10; f++) {
  const angle = f / 10 * 6.283 + hash(seed, f) * .5, length = (2.7 + hash(seed, f + 20) * .9) * scale;
  const fx = Math.cos(angle), fy = Math.sin(angle), rise = .9 + hash(seed, f + 40) * .8;
  for (let n = 1; n <= 11; n++) {
    const u = n / 11, along = length * u, drop = top[2] + scale * (rise * u - 2.4 * u * u);
    const width = .42 * scale * (1 - u * .55);
    for (const side of [-1, 0, 1]) {
      const k = seed * 1000 + f * 40 + n * 3 + side + 1;
      const tone = hash(k, 3) + (side ? 0 : .35) - u * .2;
      const lx = top[0] + fx * along - fy * width * side, ly = top[1] + fy * along + fx * width * side;
      capture = [];
      sphere(lx, ly, drop - (side ? .22 * scale : 0), (side ? .15 : .12) * scale, toneColor(tone), 'rough');
      leaves.push({ x: lx, y: ly, z: drop, k, r: .26 * scale, pixels: capture });
      capture = null;
    }
  }
}
```

Mini Ramp places seven palms: five along the back edge and one at each side, scale .78 to 1.22.

### 7.2 Engine trees, shrubs, grass

- `growTree(x, y, scale, count, seed)` calls: stari-most `(-9.6, 7.8, .72, 260, 500)`, `(8.8, -8, .85, 300, 900)`, `(14.2, 2.6, .62, 220, 1400)`; tie-break `(-15, 2.6, .9, 300)`, `(3, -10.3, .8, 260, 500)`; laundry's lemon tree `(-11.1, 5.2, .58, 200, 300)` in a pot. Vary `seed` per tree so the crowns differ.
- Potted shrub (`laundry:150-157`): a `box` pot `1.6r` wide and `1.4r` tall, 14 `'rough'` spheres of radius .22 in `LEAF [92,128,72]` scattered above it, one `castShadow`.
- Grass: `growGrass()` places tufts on `KIND_GRASS` pixels; call it after the ground loop because it reads `kinds`.

## 8. Characters

### 8.1 `figure()` pose fields

`figure(x, y, yaw, pose, palette, addBone)` returns the right hand position (`engine.js:248`). Pass `dynamicAdd` so bones queue shadows.
- `yaw`: facing direction in world radians.
- `z`: height of the feet (stand on a deck or chair). `scale`: overall size (default 1).
- `crouch`: 0 standing to about 1; lowers the hips by `.4 * crouch` and bends the knees.
- `lean`: torso tilt forward in radians; negative leans back.
- `stance`: foot spread front to back (default .2).
- `armR`, `armL`: shoulder angle in radians. 0 hangs down, π/2 points forward, about 2.8 to 3.6 is overhead, negative swings back. Defaults 0 and .08.
- Palette: `shirt`, `stripe` (bands about 3 px tall; set equal to `shirt` for plain), `legs`, `skin`, `hair`. Shoes are fixed.

### 8.2 Pose recipes

| Action | Pose | Source |
|---|---|---|
| Idle breathing | `lean: sin(time * 1.8) * .012`, stance .08 | laundry host, balote |
| Looking at a phone | `armR 1.35, armL 1.25` | stari-most tourists |
| Cheering | arms 2.8 ± .3 alternating on a beat, hop `z += beat * .06` | stari-most |
| Hands up in the rain | `arms 2.6 + beat * .35`, beat `floor(time * 3) % 2` | laundry host |
| Clapping | both arms 1.5 / 1.15 alternating, beat `floor(time * 9 + k * 1.6) % 2` | tie-break crowd |
| Arms up, alternating | 3 / 2.5 swapped on `floor(time * 8 + k * 2) % 2` | mini-ramp friends |
| Running | stance `.16 + sin(time * 15) * .2`, crouch .2, lean .24, arms .55/.5 when speed > 1.2 | tie-break |
| Ready, racket back | crouch .36, `armR -2`, armL .9, body twist .9 rad | tie-break |
| Forehand over .3 s | eased t: `armR lerp(-2, 2.6)`, `armL lerp(.9, .2)`, crouch .34, twist `lerp(.95, -.8)` | tie-break |
| Serve toss | crouch .12, `armR 3.6`, `armL 2.8`, twist .45 | tie-break |
| Serve swing | `armR lerp(3.5, .7)`, `armL lerp(2.4, .2)`, `lean lerp(-.1, .4)`, twist `lerp(.4, -.3)` | tie-break |
| Wind-up for a throw | crouch `.35 + p * .45`, lean `.3 + p * .24`, `armR -.1 - p * 1.15` (p = power) | balote |
| Seated high up | `z 1.8`, scale .85, arms .4/.3, stance .04 | tie-break umpire |

Twist is added to yaw and mirrored for the second player (`i === 0 ? 1 : -1`). Walking tourists step through discrete poses: `swing = sin(floor(gait * 1.3) * π / 2 + .8)`, stance `swing * .13`, arms `∓swing * .4`, "in keeping with the hand-animated wind".

### 8.3 Custom skeletons when `figure()` cannot pose it

- Flipping diver (`stari-most:drawDiver:465`): build bones in body space (side, forward, up) and rotate by `pitch` about the side axis. `tuck` (0 to 1) blends every joint between open and tucked with `lerp`; charge power drops the hips by `.45 * power`. Scale .85, trunks as a short capsule per side.

```js
const cp = Math.cos(pitch), sp = Math.sin(pitch), k = SCALE;
const at = (s, f, z) => [x + s * k, y + (f * cp + z * sp) * k, baseZ + (z * cp - f * sp) * k];
```

- Rider on a curve (`mini-ramp:drawRider:377`): build in the surface frame so the body stays perpendicular to the ramp. `P(t, n, side) = world(a + t * cos(th) - n * sin(th), w0 + side, z + t * sin(th) + n * cos(th))`. Crouch 1 grabbing, .75 pumping, .22 riding, .05 waiting. Grab puts the front hand on the board at `P(.34, .42, .12)`. In the air the rider rises and falls straight above the coping (`a = sign * (LIP_A - .3)`) with `th = sign * π/2 * |1 - 2p|` (p = air progress): "the board levels out at the top of the air and tips back to the wall on the way down". A slam lays the body along the surface and gives the board its own physics (section 9).
- Held object: tie-break's racket extends the arm direction from the returned hand: handle to .32, head sphere radius .22 at .66 in team colour, plus a cream sphere radius .13 for strings.

### 8.4 Crowds

- Wandering tourists (`stari-most:268-347`): 14 at scale .78 on the deck. Each picks a target (68% near the crown, outside the diver's clearance of 2.6), walks at .45 to .85 units/s, waits 1.5 to 7.5 s, and 55% hold a phone. Arriving, they face out over their side of the parapet. While the diver charges or flies, those within 7 of the centre face the drop and raise phones. Turning eases at `min(1, dt * 6)` with angle wrap. "People drift towards the crown ... leaving the middle of the skyline clear so the jump stays readable."

```js
for (let i = 0; i < crowd.length; i++) {
  const a = crowd[i];
  for (let j = i + 1; j < crowd.length; j++) {          // soft shove, no walking through each other
    const b = crowd[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01;
    if (d >= GAP) continue;
    const push = (GAP - d) * Math.min(1, dt * 5) / 2;
    a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
  }
  if (keepClear) {                                        // keep a spot free for the player
    const dx = a.x - SPOT_X, dy = a.y - SPOT_Y, d = Math.hypot(dx, dy) || .01;
    if (d < CLEAR) { const k = (CLEAR - d) * Math.min(1, dt * 6); a.x += dx / d * k; a.y += dy / d * k; }
  }
}
```

`GAP .72`, `CLEAR 2.6`; positions are then clamped to the deck.
- Seated spectators (`tie-break:drawCrowd:506`): five fixed figures; "heads follow the ball in coarse steps, like a crowd at a real match": yaw `round(atan2(...) / .35) * .35`. Mini Ramp's two friends do the same in .4 steps toward the rider.
- Tourist palettes are picked per person by hash from lists of 8 shirts, 5 legs, 6 hair and 4 skin tones, with a 25% chance of a white stripe (`stari-most:64-67`).

### 8.5 Palette and sharpness rules

From the README and engine: figures use `'solid'` mode (flat bands, no dither) so they read sharp against the textured ground; edges darken their silhouette; patterns are at least 3 px wide. Two teams get contrasting shirts with matching HUD colours (`--a #b5392b`, `--b #27496d` in tie-break). Keep figure colours off the ground hue; tie-break chose a yellow-green ball `[216,236,72]` against clay.

## 9. Physics models

Every game clamps the frame step to .04 s.

| Game | Gravity | Integration | Bounce and contact | Drag or friction |
|---|---|---|---|---|
| balote | 12 | Euler, velocity first, 4 substeps | ground bounce `vz * -.22` with `.82` horizontal when `vz < -1.6`; ball impulse restitution .82; boards `-.5` | rolling decel 6 units/s² |
| stari-most | 8.5 | Euler, velocity first, 1 step | entry at z .85 ends the flight | none |
| laundry | 14 (falling items) | Euler, velocity first, 1 step | land below z .6; rain 26 units/s | hover spring `(3 - z) * .7` |
| tie-break | 14 | exact position step, 4 substeps | first landing `vz * -.7`, `vx, vy * .55`; later `vz * -.7`, `* .8` when `vz < -1`; apron walls `-.25`; net stop | rolling decel 5 |
| mini-ramp | 12 | 1D along arc length, analytic air | land reverses speed `* .985` | `.2 * (1 - low * .7) + .0042 * v²` |

Notable mechanisms:
- Stari Most dive: power fills over .9 s. Jump `vy = 1.4 + 1.2p`, `vz = 2 + 3.2p`, base spin `.25 + .85p + wind` (wind ±.3). Holding tucks: `tuck` eases at 14/s, spin eases at 12/s toward `base + tuck * 7.5`. Score: `err` = distance of pitch from the nearest multiple of π, `quality = clamp(1 - err / (π / 3), 0, 1)`, `flips = |round(pitch / π)| / 2`, points `quality * 10 * (1 + flips * .6)` rounded to .1; an odd number of half-turns means head first.
- Tie-break shots are solved, not aimed by physics: `strike(by, x, y, T)` picks velocities that land at `(x, y)` after `T` seconds. The hit window centres on the second-bounce apex.

```js
const vx = (x - b.x) / T, vy = (y - b.y) / T, vz = (BALL_R - b.z + .5 * GRAVITY * T * T) / T;
const up = (GRAVITY * T - vz) * BOUNCE_UP, after = up / GRAVITY * 1.15;
const tc = T + after;                                   // contact time for the receiver
const win = Math.min(lerp(.7, .42, pace), 2 * .8 * up / GRAVITY);
shot.wS = tc - win / 2; shot.wE = tc + win / 2;
```

`pace = clamp(rally / 14, 0, 1)`; shot time `T = lerp(1.25, .72, pace)`, so rallies speed up. Net: if the ball crosses x 0 below `NET_Z + BALL_R` (1.25) within the posts, put it back, `vx *= -.08`, `vy *= .3`, `vz = min(vz, 0)`.
- Mini Ramp pump ("like a swing"): gravity along the slope, `v -= g * sin(th) * dt`. Holding while moving downhill adds speed; holding while moving uphill costs a little. `low` measures how far the energy is below the lip; "below the lip a pump counts for more and mistakes for less, so lost speed comes back in a pass or two".

```js
const th = pointOnRamp(s).th, slope = Math.sin(th), dir = Math.sign(v) || -Math.sign(s) || 1;
const low = clamp(1 - (v * v / 2 + GRAVITY * pointOnRamp(s).z) / (GRAVITY * RADIUS * 1.25), 0, 1);
v -= GRAVITY * slope * dt;
if (hold) {
  if (!slope || v * slope < 0) v += dir * PUMP * (Math.abs(slope) + low * LOW_BOOST) * dt;
  else v -= dir * PUMP * Math.abs(slope) * (1 - low) * .5 * dt;
}
const speed = Math.abs(v), next = Math.max(0, speed - (ROLL_DRAG * (1 - low * .7) + AIR_DRAG * speed * speed) * dt);
if (speed > 0) v *= next / speed;
```

`PUMP 6`, `LOW_BOOST 2.6`, `MIN_FLAT_SPEED 5` (the flat never lets you stall). Past the coping moving outward: take off with `vz = min(|v|, 12.5)`, air time `2 * vz / g`. Height `vz² / 2g`; points `round((10 + height * 12 + grab * 60) * multi)`, multiplier +1 per grab of at least .2 s, up to 5. Holding for more than .1 s at landing is a slam: multiplier resets, the board bounces separately (`vz * -.4` when faster than 2, along-speed `* .7`, spin 11 rad/s), and riding resumes after 1.25 s at speed 8 or more.
- Balote rival throws invert the roll formula: `distance = airTime * v + v² / (2 * decel)` gives `v = (-air + sqrt(air² + 2 * dist / decel)) * decel`.

## 10. Input

Shared pattern in all four games:
- Canvas has `tabindex="0"`, an `aria-label` that states the controls, CSS `touch-action: none`, `image-rendering: pixelated`, `outline: none`.
- `pointerdown`: `canvas.focus({ preventScroll: true })`, then `ensureAudio()`, then game logic. Keyboard listens on the canvas for `' '` and `'Enter'`, calls `preventDefault`, and ignores `e.repeat`.
- Converting pointer to canvas pixels: `{ x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }` with `r = canvas.getBoundingClientRect()`.

Per game:
- Hold and release (stari-most, mini-ramp): `pointerdown` calls `setPointerCapture` and `press()`; `pointerup` and `pointercancel` call release; `keydown`/`keyup` mirror it. Mini Ramp also releases on window `blur`, so a hold does not stick after switching tabs. In Stari Most the same press means crouch on the bridge, tuck in the air, and next dive under water.
- Drag (laundry): capture the pointer only when `pickAt` finds an item. The carried item targets the pointer at carry height, not the ground under it: `unproject(px, py + CARRY_Z * COS * S)`, clamped to the roof plus 1. Keyboard: space auto-carries the next item, ordered flying, loose, ground or falling, then line, then by value.
- Drag back and release (balote): convert the drag vector to world units (`dx / S`, `dy / (S * SIN)`, then rotate), `power = len / 18`; aim opposite the drag. Arrows adjust yaw by .015 and power by .02; `pointercancel` cancels the throw.
- Tap timing (tie-break): one input. Timing maps to aim: within the hit window the landing point sweeps across the far court (`aim()`, line 291), so the moment of the tap chooses where the ball lands. A tap outside the window swings and locks input for .18 s, so mashing does not work.

## 11. Opponents and AI

Tie-break rival (`planBot:267`, `botReturn:274`): "the rival sets off after a beat and decides from how far it had to run how good its reply can be".
- Plan: target the ball's position at contact time, offset by the reach (1.3, .45); wait .1 s; run at 3.6 units/s. `stretch = distance / (3.6 * max(.2, tc - .1))`.
- If still more than .8 from the target at contact, the player's shot is a winner.
- Error: `miss = .02 + .26 * s³ + pace * .03` (s = stretch clamped to 1). A miss is 35% a fast .7 s ball aimed at x 2, low enough to catch the net from the baseline (derived), 35% long (x 12.4, past the 11 baseline), 30% wide (|y| 5.2 to 6.8, past 4.6).
- Good reply: if `s < .55` it attacks, away from the player's side at |y| 2.8 to 4.3 and .06 s faster; otherwise it defends, through the middle (±1.8) and .15 s slower.
- Serve: faults 14% on a first serve, 3% on a second (wide at |y| 5.2 to 6.2).
- The human player runs automatically to the predicted contact point at `min(16, distance / timeLeft)`, so it arrives exactly at the window start; only the timing is the player's.

Balote rival (`planAI`): usually aims at the jack. When the player's best ball is within 1 of the jack and nearer than the rival's, it tries to knock that ball away 45% of the time, adding 3.2 units of distance. Deliberate error: power times `1 ± .065`, yaw ± .035 rad. It animates the aim (wait .55 s, raise power over .7 s, release at 1.45 s) so the player can read it.

## 12. Loop, phases, HUD, status, rules, best score

### 12.1 Bake once, draw every frame

```js
function bake() {
  zb.fill(-1e9); pix.fill(rgb(255, 255, 255));
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const g = unproject(ix + .5, iy + .5), i = iy * W + ix, c = groundColor(g.x, g.y, ix, iy, i);
    if (!c) continue;
    pix[i] = c; ground[i] = 1; zb[i] = (g.x + g.y) / R2 * COS;
  }
  growGrass(); groundZ.set(zb);
  buildProps();                     // box, plot, sphere, growTree, static figures, castShadow
  bakeOcclusion();
  staticShadow.set(shadowMask);     // save it before applyShadows clears the mask
  applyShadows(groundZ);
  bakedPix.set(pix); bakedZ.set(zb);
}
function draw() {
  pix.set(bakedPix); zb.set(bakedZ); pendingShadows.length = 0;
  drawActors();                     // figure(..., dynamicAdd), spheres, cloth
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT); drawTufts(windT); drawSurface(windT);
  flushShadows(); applyShadows(groundZ); shadeEdges();
  drawOverlays();                   // drops, arrows, rings, bars: drawDots
  ctx.putImageData(image, 0, 0);
}
let last = performance.now();
function frame(now) { update(Math.min(.04, (now - last) / 1000)); last = now; draw(); requestAnimationFrame(frame); }
```

Boot order: `addEventListener('resize', fit); fit(); bake(); reset(); requestAnimationFrame(frame)`.
`applyShadows` reference: `groundZ` keeps moving shadows on bare ground only ("never on the masonry", stari-most:581; laundry also). `bakedZ` lets them fall on any baked pixel inside the ground footprint as well, such as props and the ramp (tie-break, mini-ramp). In both cases moving figures never receive shadows (derived from `applyShadows`).

### 12.2 Phases

- stari-most: `ready` -> `charge` -> `air` -> `under` -> `ready`; five dives, then `finished`.
- laundry: `play` -> `over`.
- tie-break: `serve-wait` -> `toss` -> `rally` -> `point-end` or `fault-wait` -> ... -> `over`. Server order `(first + floor((n + 1) / 2)) % 2`, court side flips each point, `first` alternates per match. "An unhit toss is caught and costs nothing."
- mini-ramp: `ready` -> `ride` <-> `slam` -> `over`; the 60 s clock runs only during `ride` and `slam`, and the game ends only once the rider is back on the ramp.

Each restart ignores taps for a moment after the end so the final tap does not restart at once (inferred): stari-most .5 s, laundry .5 s, tie-break .5 s (and .4 s to skip a point pause, which ends by itself after 1.7 s; fault pause .95 s), mini-ramp .8 s.

### 12.3 HUD markup

DOM, not canvas. `#scores` top left (16 px, weight 600, tabular numbers); `#status` bottom left, `role="status" aria-live="polite"`, muted colour; `#mute` bottom right, text `sound on`/`sound off` with `aria-pressed` (shell.js also mutes the music from the same button). Body font 13px monospace stack. `setStatus` skips identical text so screen readers are not re-announced.
- stari-most: total with one decimal plus five 6 px squares, dimmed to .16 opacity as dives are used.
- tie-break: one row per side in team colour, score plus a 6 px server dot.
- mini-ramp: score plus a meta line `x2 · 45s · best 300`.

### 12.4 Status wording

Lowercase, joined with ` · ` (middle dot), ending with the next action.
- stari-most: `no wind` / `light headwind` / `strong wind at your back` (thresholds .08 and .2) + ` · hold, then release to jump`; `hold to tuck, release to open`; `rip entry` (q >= .88), `clean` (>= .55), `rough`, `belly flop`, then ` · head first` or ` · feet first`, ` · 1 flip`, ` · +7.4`, ` · tap for the next dive`. End: `... · total 31.2, a new best · tap to dive again` or `, best 28.0`.
- laundry: `drag the washing into the basket`, `the sky is turning`, `rain`, `it is pouring`, `carrying to the basket`, `drop it in the basket`. End: `6 dry · 3 wet · 2 lost · a new best · tap to hang it again`.
- tie-break: `tap to toss`, `second serve · tap to toss`, `rival to serve`, `rival: second serve`, `fault`, `net`, `double fault`, `ace`, `missed`, `winner`, `out`, `rival hit it out`, `rival netted it`. End: `you win 7-5 · longest rally 9 · tap to play again` (the source joins the score with U+2013).
- mini-ramp: `tap to drop in`, hints `hold on the way down` / `let go on the way up` (shown during the first two airs or after 2.5 s without air), `+120 · grab 0.4s`, `slam · let go before landing`. End: `840 · new best · highest air 4.1 m · tap to skate again`.

### 12.5 Rules array

Passed to `PixelPlays.mount({ id, rules })` and shown in the Rules dialog. Four or five plain sentences in this order: goal, input (with the keyboard equivalent), how scoring works, the twist or limit. Mini Ramp's:

```js
rules: [
  'Pump like on a swing: hold on the way down, let go on the way up. Use a finger, the mouse or space. If you lose speed, a few pumps bring it back.',
  'Enough speed takes you over the coping into the air. Higher air scores more.',
  'In the air, hold to grab the board for extra points. Let go before you land, or you slam.',
  'Each clean grab raises the multiplier up to x5. A slam resets it. You have 60 seconds.',
],
```

### 12.6 Best score

| Game | localStorage key | Value |
|---|---|---|
| stari-most | `pixel-plays:stari-most:best` | total, one decimal |
| laundry | `pixel-plays:laundry:best` | score |
| mini-ramp | `pixel-plays-mini-ramp-best` | score |
| tie-break, balote | none | tie-break reports the longest rally instead |

Reads and writes sit in `try/catch` ("best score is a convenience", "private window: no saved best"). The key formats differ; pick one (`pixel-plays:<id>:best` is the majority form) for a new game.

## 13. Feedback signals drawn in the canvas

All signals use `INK rgb(28,27,25)`, `SIGNAL rgb(255,214,10)` and `PAPER` white, drawn with `drawDots` after `shadeEdges`. "Signals get a white halo, so they separate from whatever busy detail sits behind them" (`haloDots`).
- Bobbing arrow `drawArrow(sx, sy, time)`: 13x12 sprite that bobs 2 px, switching every 1/3 s. Placed above the player before the first action (stari-most, `z + 1.7`), above the drop target while dragging (laundry, basket `h + 1.3`), above the head when a pump is due (mini-ramp, `head.sy - 5`).
- Charge bar (`stari-most:drawChargeBar:555`): 17x5 px above the diver, INK frame with halo, 15 cells filling SIGNAL over PAPER.
- Landing ring (`tie-break:drawTarget:515`): an ellipse of radius 8x4 px with an outer line and a plus at the centre. In: SIGNAL ring with INK outline. Out: INK ring with PAPER outline. "Yellow on black means in, black on white means out: red would vanish into the clay."
- Contact spark: 8 white dots at 3 and 4 px around the hit point for .09 s (tie-break).
- Warning sprite (`mini-ramp:BANG:467`): a 5x7 px exclamation mark that flashes at 5 Hz above the head while a grab is held within .5 s of landing.
- Yellow pegs on cloth about to blow off (laundry).
- Aim preview (balote): dots every other step of the simulated arc and a 5 px landing cross; the result shows marching dotted lines from the jack to each counted ball.

## 14. Sound

Audio is built on the first input (`ensureAudio()` in the pointer and key handlers): create the `AudioContext` once, `resume()` if suspended. Every `sound()` returns early when there is no context or `muted` is set. Envelopes ramp exponentially to .0005.

Oscillator sweeps, `osc.frequency` from start to end over the duration (tie-break, mini-ramp, balote). `a` is the amount passed in.

| Game | Name | Start Hz | End Hz | Seconds | Gain | Wave | Fires on |
|---|---|---|---|---|---|---|---|
| tie-break | hit | 520 | 170 | .07 | `.2a + .1` | square | rally stroke, a = `.4 + pace * .6`; plus a noise click |
| tie-break | serve | 640 | 150 | .09 | .32 | square | serve; plus a noise click |
| tie-break | bounce | 190 | 90 | .07 | `.22a + .03` | sine | first landing (a .7), later bounces (a .3) |
| tie-break | net | 130 | 70 | .12 | `.22a` | triangle | ball hits net (a .8), fault (a .5) |
| tie-break | point | 660 | 880 | .16 | .07 | triangle | every point; applause when the player wins it |
| mini-ramp | clack | 1250 | 520 | .05 | `.22a + .04` | square | drop in (a .5), take-off (a .8) |
| mini-ramp | land | 210 | 80 | .12 | `.3a + .06` | triangle | clean landing (a .7) |
| mini-ramp | slam | 120 | 40 | .28 | .5 | sawtooth | slam |
| balote | clack | 1500 | 620 | .05 | `.28a + .05` | square | ball on ball |
| balote | thud | 150 | 70 | .09 | `.3a + .04` | sine | ball hits ground |
| balote | board | 240 | 120 | .06 | `.22a + .03` | triangle | ball hits the board |
| balote | whoosh | 320 | 180 | .1 | .035 | triangle | throw |
| balote | point | 660 | 880 | .16 | .08 | triangle | end of frame |

```js
function sound(kind, a = .6) {
  if (!audio || muted) return;
  const [f0, f1, len, level, wave] = SPECS[kind], now = audio.currentTime;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(f0, now);
  osc.frequency.exponentialRampToValueAtTime(f1, now + len);
  gain.gain.setValueAtTime(typeof level === 'function' ? level(a) : level, now);
  gain.gain.exponentialRampToValueAtTime(.0005, now + len);
  osc.connect(gain).connect(audio.destination);
  osc.start(now); osc.stop(now + len + .01);
}
```

Filtered noise bursts: a white-noise buffer (1 s in stari-most, 2 s in laundry, .25 s in tie-break) played through a biquad filter and a decaying gain. Stari-most and laundry start each burst at a random offset in the buffer.

| Game | Name | Filter | Hz | Q | Gain | Seconds | Fires on |
|---|---|---|---|---|---|---|---|
| tie-break | click | bandpass | 2600 | .8 | .12 | .03 | with every hit and serve |
| tie-break | applause | bandpass | 1500 to 2700 | .8 | .05 to .1 | .05 | 9 bursts every .09 s, player's point |
| stari-most | jump | bandpass | 900 | .8 | .05 | .16 | take-off |
| stari-most | splash | bandpass | 700 and 240 | .5, .7 | `.16 + .3a`, `.1 + .3a` | `.35 + .6a`, `.2 + .3a` | entry, a = `1 - quality * .75` |
| stari-most | cheer | bandpass | 1400 to 2600 | 3 | `.022 * quality` | .12 | 7 bursts from .2 s, every ~.09 s, quality >= .55 |
| laundry | pop | bandpass | 1400 | .7 | .05 | .06 | grab, peg gives way |
| laundry | drop | lowpass | 500 | .7 | .16 | .14 | item banked |
| laundry | gust | bandpass | 620 | .7 | .07 | .8 | gust |
| laundry | thunder | lowpass | 200 and 90 | .7 | .4 each | 1.5, 2.2 | lightning, delayed .25 and .35 s |

Continuous beds follow game state with `setTargetAtTime`: laundry rain is looped noise through a 1500 Hz highpass at gain `rain * .05` (times .45 after the game ends, time constant .3); mini-ramp rolling is looped noise through a 420 Hz lowpass at `min(.09, |v| * .008)` while on the ramp (time constant .04). Both go to 0 when muted.

Music: `shell.js` loops `<id>/<id>.mp3` at volume .4 from the first pointer or key event ("browsers block sound before one") and pauses on `visibilitychange`. The source tracks are not licensed for reuse.

## 15. Reduced motion, scaling, test hooks

- Reduced motion: the engine sets `STILL` from `prefers-reduced-motion: reduce`. Games pass `windT = 0` when `STILL`, which freezes grass, leaves, palms, water streaks, cloth ripple and cloud drift. `drawArrow` stops bobbing. Gameplay motion is not reduced. Not gated by `STILL` (observed): the 5 Hz warning flash in mini-ramp, the cheering and clapping beats, and the lightning flash in laundry.
- `fit()` (`engine.js:337`): `fitScale = min(innerWidth / 360, (innerHeight - 40) / 280)`, then `scale = max(1, floor(fitScale * dpr)) / dpr`, so every canvas pixel maps to a whole number of device pixels. 40 px is held back for the HUD (inferred). Call it on `resize`.
- Test hooks on `window`, each with `step(dt, skipDraw)` that runs `update(dt)` and optionally `draw()`:
  - `__stari = { G, step, press, releasePress }`
  - `__laundry = { G, step, grab, letGo, nextItem, overBasket }`
  - `__tiebreak = { G, tap, aim, isIn, step }`
  - `__ramp = { G, press, release, pointOnRamp, step }`
  - `__balote = { G, step }`

## 16. Pitfalls

Stated in code comments:
- Sweep curved masonry by angle, not by x, or steep parts get gaps (stari-most:108).
- Keep moving shadows off masonry with `applyShadows(groundZ)` (stari-most:581).
- Leave the area around the main action clear of crowds so the action stays readable (stari-most:281).
- Shove crowd members apart softly so they do not walk through each other or the player's spot (stari-most:312).
- Step gaits and sway through discrete poses; "the sway should feel hand-animated, not simulated" (engine WIND_FPS 8).
- Drawing a net as a sparse pixel mesh keeps objects behind it visible (tie-break:141).
- Large surfaces need close tones or dither reads as a checkerboard (tie-break:93, README).
- Do not use red for in/out signals on a red-brown surface; it vanishes (tie-break:522).
- Give pointer picking a few pixels of slack for small targets on phones (laundry:576).
- Blow loose objects back toward the middle so there is time to react (laundry:318).
- Shadows over a non-flat surface need the surface height at the shadow point, not z 0 (mini-ramp:442).
- Mark custom-painted surfaces as ground after baking so they receive moving shadows (mini-ramp:210).
- Make recovery easy: below the lip, pumps count more and mistakes less (mini-ramp:293). Bring the hint back whenever the player loses speed (mini-ramp:289).
- A fast collision can push a ball into the ground; clamp `vz` when resting (balote).
- Figures use flat bands; "thinner ones read as noise" for stripes under about 3 px (engine.js:253).
- `shadeEdges` never touches the ground, "so nothing halos around a figure" (engine.js:134).
- Wrap `localStorage` in `try/catch`; private windows throw.
- Long end-of-game status lines collide with the centred credits on narrow screens; shell.js moves the credits up below 1200 px and 600 px.

Derived from reading the code (not commented):
- Save `staticShadow.set(shadowMask)` before `applyShadows`, which clears the mask.
- Clear `pendingShadows` before baking a figure, and flush before `bakeOcclusion`.
- `drawDots` has no depth test; draw overlays last.
- Surface effects such as water streaks and rings should test `zb === groundZ` so they never paint over objects.
- `shadeEdges` compares `zb` with `groundZ`; anything that writes depth on a ground pixel will be edged like an object.
