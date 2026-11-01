---
name: isometric-pixel-games
description: Build original small browser games, still illustrations, or web pages in the isometric pixel-diorama style of Pixel Plays. A 360x280 software rasteriser, one small place on pure white, a fixed 30 degree camera, five-tone hue-shifted ramps, ordered dither, long violet shadows, and one readable physical action. Use when asked for an isometric pixel game, a tiny diorama, pixel-art scenery, a browser toy, a playable hero, or a site in this visual language. Ships the MIT engine, a working starter game, the visual rules, and a 778-line technique reference read from all five Pixel Plays games.
---

# Isometric pixel games

One small place on white, one readable physical action, and a rasteriser small enough to read in an afternoon. The look comes from the renderer, not from a filter on top of it. Change the subject, keep the rules.

Five ways it fails:

- **A scene, not a place.** A landscape with no edge, no ground plane, no reason to stand anywhere. The diorama must feel like a tabletop model you could pick up.
- **No action.** Pretty pixels with nothing to time, aim or release. Every game here is one gesture, repeated with variation.
- **Detail at the wrong scale.** A 360 by 280 canvas holds about 100,000 pixels. A window is 8 px. A face is 4. Detail that needs more than that reads as noise.
- **A copied subject.** The five source games are bocce, bridge diving, rooftop laundry, clay tennis and a skate ramp. Do not rebuild them, rename them, or move them to a new country.
- **Function without feel.** A working loop that looks like a prototype. The page, the type, the status line and the sound are part of the toy.

## 0. Choose the output

| Ask | Build | Section |
| --- | --- | --- |
| A game, toy, playable thing | Starter page plus a loop, input, HUD, sound | 1 to 7 |
| A still, illustration, hero image, poster | One baked frame, no loop, PNG export | 8 |
| A website or landing page | Page shell plus one or more dioramas | 9 |

All three use the same engine and the same visual rules. Read [references/visual-rules.md](references/visual-rules.md) before the first line of scene code. It maps every rule to the function that enforces it, so you can tell which parts are style and which are the renderer working correctly.

## 1. Pick one physical action

The style supports actions you can read from a fixed camera in silhouette: throw, drop, hold, release, swing, pour, stack, catch, pull, light.

A good action has all four:

1. **One input.** Press, hold, drag or tap. A second control is a different game.
2. **A visible commitment.** Something leaves the hand, crosses the place, and lands. The player watches their decision travel.
3. **A timing or aim decision.** The difference between a good and a bad attempt must be legible, not random.
4. **A cost.** Speed bleeds off, the wind pushes, the stack topples, the count runs down.

Test it before you build: say the action in one sentence with the input and the failure. "Hold to wind up, release to skip a stone, each skip costs speed and a slow stone sinks." If the sentence needs an "and then", the action is two actions.

Actions that fit, as prompts rather than a queue: cast a fishing line into a rock pool, pump water into a bucket before it leaks, launch a paper boat down a gutter, pole a pear off a branch, flip a sandcastle bucket, ring a bell with a rope, blow out a lantern, stack crates on a handcart, sweep leaves into a drain, set a mousetrap, hammer a nail, pour tea without spilling.

Actions that do not fit: anything needing a camera move, a dialogue, a menu, a character close-up, or per-pixel precision the player cannot see.

## 2. Start from the starter

Copy the starter, then rename the game:

```bash
cp <skill>/assets/starter/index.html ./my-game/index.html
cp <skill>/assets/engine.js ./my-game/engine.js
```

Change the one script tag from `../engine.js` to `engine.js`, then you have:

```
my-game/
  index.html      page, scene, game logic
  engine.js       shared renderer, do not edit per game
```

`index.html` loads in this order: HUD markup, then `window.PP_SCENE`, then `engine.js`, then the game script. The engine needs a `<canvas id="c">` and reads `PP_SCENE` once at load.

Open the file directly or through any static server. There is no build step, no dependency and no bundler. Keep it that way.

The starter is a working stone-skipping game: hold to wind up, release to throw, each skip costs 22 percent of the stone's speed. Read it end to end before changing it. It is about 300 lines and every part earns its place.

## 3. Set the scene

`PP_SCENE` has three numbers and no other configuration:

```js
window.PP_SCENE = { originY: 14, shadowX: 1.1, shadowY: -.22 };
```

- `originY` moves the world origin down the canvas. Use a positive value when the place is tall, a negative value when it hangs below ground. The starter's tree reaches about 4.3 units, so 14 is enough headroom.
- `shadowX` and `shadowY` set how far a shadow travels per unit of height: `(shadowX - shadowY) / √2 * 10` px right and `(shadowX + shadowY) / √2 * 5` px down. Defaults `1.3` and `-.12` give 10 px right and 4.2 px down. Tall masonry wants a shorter throw, around `.55` and `-.08`.

Then make the ground. `groundColor(x, y, ix, iy, i)` returns a packed colour or 0 for white page, and sets `kinds[i]` before it returns.

```js
const KIND_WATER = 1, KIND_SAND = 2;   // 0 is none, 3 is grass and belongs to the engine

function groundColor(x, y, ix, iy, i) {
  const edge = Math.pow(Math.pow(Math.abs(x) / HALF_X, 4) + Math.pow(Math.abs(y) / HALF_Y, 4), .25)
             + (noise(x * 1.3, y * 1.3) - .5) * .1;
  if (edge > 1.04) return 0;                                      // white
  if (edge > .94 && hash(ix, iy) < (edge - .94) / .1) return 0;   // scattered border
  if (insidePlace(x, y)) {
    kinds[i] = KIND_WATER;
    const v = .5 + (noise(x * .6, y * .35) - .5) * .5;
    return rgb(...WATER_TONES[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * .6), 0, 3)]);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (hash(ix, iy) - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
```

Exponent 4 gives a rounded rectangle, low-frequency noise makes the border uneven, and the per-pixel hash thins it out. `insidePlace` is your own shape test in world units: the starter's pond is a wobbling ellipse. The `kinds` array is how later passes know what they are standing on: `growGrass` only grows on grass, rings only draw on water, ball marks only on clay.

Pick `HALF_X` and `HALF_Y` from the action, not from the canvas. A throwing game needs depth in the throwing direction. A stacking game needs width and a low skyline.

## 4. Bake the place once

Everything static goes into `bakedPix` and `bakedZ` in `bake()`. The frame loop copies them back, so the per-frame budget is actors and weather only.

```js
function bake() {
  zb.fill(-1e9);
  pix.fill(rgb(255, 255, 255));
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const g = unproject(ix + .5, iy + .5), i = iy * W + ix;
    const c = groundColor(g.x, g.y, ix, iy, i);
    if (!c) continue;
    pix[i] = c; ground[i] = 1;
    zb[i] = (g.x + g.y) / R2 * COS;          // ground depth at this pixel
  }
  growGrass();
  groundZ.set(zb);
  buildProps();                              // box, plot, sphere, growTree, static figures
  bakeOcclusion();                           // contact darkening under props
  staticShadow.set(shadowMask);              // save before applyShadows clears it
  applyShadows(groundZ);
  bakedPix.set(pix); bakedZ.set(zb);
}
```

Props are built from five primitives:

- `box(x0, y0, z0, x1, y1, z1, color, seed)` for walls, crates, roofs, furniture. Shades top 3.4, lower-left 2.3, lower-right 1.2.
- `plot(x, y, z, color)` for a single pixel of a hand-built surface.
- `sphere(x, y, z, r, color, mode)` for stones, fruit, heads, balls. Mode `'rough'` adds grain, `'solid'` gives flat bands for figures, `'gloss'` adds a highlight.
- `capsule(a, b, r0, r1, colorOf, mode)` for limbs, poles, branches, reeds.
- `growTree(x, y, scale, count, seed)` for the one tree the engine knows how to draw.

Call `castShadow(x, y, z, r)` for each static prop. Order matters: ground, props, occlusion, shadow mask, then `applyShadows`. Shadows are cast into a mask, so cast them after the ground and props exist, and never after `applyShadows` has cleared the mask.

Hand-built surfaces use sample spacing `.03` to `.07` world units. That is under 1 px on screen, so every screen pixel gets a sample and the surface has no holes. Wider spacing leaves holes that look like damage you did not intend.

## 5. Wire the action

The loop is fixed. Copy it, then only change what is inside.

```js
let last = performance.now();
function frame(now) {
  update(Math.min(.04, (now - last) / 1000));
  last = now;
  draw();
  requestAnimationFrame(frame);
}
```

`update(dt)` advances phases and physics. `draw()` runs in this order and nothing may be reordered:

```js
pix.set(bakedPix); zb.set(bakedZ); pendingShadows.length = 0;
drawActors();                                   // figure(..., dynamicAdd), moving props
const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
drawLeaves(windT); drawTufts(windT); drawSurface(windT);
flushShadows(); applyShadows(bakedZ); shadeEdges();
drawOverlays();                                 // rings, drops, arrows, bars
ctx.putImageData(image, 0, 0);
```

Phases are a small string machine, usually four to six states. The starter uses `aim`, `charge`, `swing`, `flight`, `rest`, `over`. Every phase has one job and one exit. When a phase ends, set the next status line and the next phase in the same place, so the two never disagree.

Input is press and release, from pointer and keyboard, with no duplicated logic:

```js
canvas.addEventListener('pointerdown', e => {
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(e.pointerId);
  press();
});
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('keydown', e => {
  if (e.key !== ' ' && e.key !== 'Enter' || e.repeat) return;
  e.preventDefault(); press();
});
canvas.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') release(); });
```

The canvas needs `tabindex="0"`, an `aria-label` that states the controls, `touch-action: none`, `image-rendering: pixelated` and `outline: none`. Holding must not stick when the window loses focus: release on `blur` too.

Physics is a table of numbers, not a library. Gravity 8 to 12 units per second squared, launch speed 10 to 16, a drag or restitution factor around `.78`. Substep the integration four times per frame when the object is fast, or it will tunnel through the surface it is meant to hit.

## 6. Read the state

The HUD is DOM, not canvas. It is small monospace text at the edges of a white page, and it never covers the place.

- Top left: the score, 13 px monospace, numbers tabular. One line per fact, not a dashboard.
- Bottom left: `#status` with `role="status" aria-live="polite"`, lowercase, facts joined with ` · `, ending in the next action. `6 skips, then it sank · tap to go again`.
- Bottom right: a sound toggle reading `sound on` or `sound off` with `aria-pressed`.
- Top right: a `Rules` button opening a `<dialog>` with four or five plain sentences: goal, input and its keyboard equivalent, scoring, the twist.

`setStatus` should skip identical text, or screen readers re-announce every frame.

Store a best score in `localStorage` under `pixel-plays:<id>:best`, read and written inside `try/catch`. Private windows throw.

Sound is Web Audio built on the first input, because browsers block audio before a gesture. One oscillator sweep per event is enough: a bandpassed noise burst for a physical hit, a short triangle sweep for motion. Every `sound()` returns early when muted. Do not ship a music track you do not own; the Pixel Plays tracks are Suno output and are not MIT.

## 7. Verify it runs

Every game exposes a test hook. It is the only reason the browser check is reliable.

```js
window.__mygame = {
  G,
  step(dt, skipDraw) { update(dt); if (!skipDraw) draw(); },
  act(power) { press(); G.power = power; release(); },
};
```

Then drive the real page:

```bash
agent-browser open "file://$PWD/index.html"
agent-browser eval "window.__mygame.act(.92)"
agent-browser eval "for (let i = 0; i < 600; i++) window.__mygame.step(1/60, true); JSON.stringify(window.__mygame.G)"
agent-browser console
agent-browser screenshot /tmp/game.png
```

Check, in this order:

1. **It boots.** No console errors, canvas is 360 by 280, the ground is white outside the edge.
2. **The action works.** A good attempt and a bad attempt produce different outcomes, driven through the hook, not by hand.
3. **The loop resets.** Play until `over`, then start again. Score, best and attempt count return to a consistent state.
4. **It reads.** Screenshot at 1:1 and full page, then run the seven checks at the end of [visual-rules.md](references/visual-rules.md).
5. **It survives.** Reduced motion freezes the plants. A resize keeps integer scale. Holding and switching tabs does not lock the input.

Report the exact command output and the screenshot, not "it works".

## 8. Still illustrations

A still is the same scene with no loop and no input. Delete `update`, `frame` and the HUD, keep `bake()` and call `draw()` once.

```js
fit(); bake(); draw();                 // one frame, no requestAnimationFrame

// export at 3x, nearest neighbour: never upscale a 1x PNG in the browser
const out = document.createElement('canvas');
out.width = W * 3; out.height = H * 3;
const o = out.getContext('2d');
o.imageSmoothingEnabled = false;
o.drawImage(canvas, 0, 0, out.width, out.height);
const link = document.createElement('a');
link.download = 'place.png';
link.href = out.toDataURL();
link.click();
```

For a still, the composition carries everything the action would:

- **One subject, one support.** A figure and what they are doing, then one prop that explains where they are. Two subjects compete at this size.
- **Crop with the ground, not the canvas.** Let the ragged edge leave the frame on one side if the place is bigger than the picture. White stays white.
- **Keep one live detail.** A single bird, a curl of steam, a hanging cloth. It stops the image reading as a screenshot of a game that failed to load.
- **Animate only if asked.** For a looping hero, keep the 8 fps plant sway and the water streaks; they cost almost nothing and make a still feel alive. Export a PNG of one frame for anything that cannot run JavaScript.

Export at 2x or 3x with nearest neighbour, never at 1x and upscaled by the browser. Use `canvas.toDataURL()` after `draw()`, or screenshot the canvas element at device pixel ratio 2.

## 9. Websites in this style

The page is white, the type is small monospace, and the diorama is the only image. The restraint is the design.

- **Shell.** `#pp-menu` top centre with the project name and a list of scenes, `Rules` top right, credits bottom centre in muted grey, each as fixed positioned text. No nav bar, no logo lockup, no hero gradient.
- **Type.** `13px/1.35 ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace`. Page headings can go to 16 px semibold. If you need a display face, use it once, in lowercase, and let the diorama stay the loudest thing.
- **Layout.** One diorama per section, centered, with at most 16 px of side padding. Text sits at the edges or directly under the scene, never in a card on top of it.
- **Scrolling.** A page taller than the viewport is fine. Pin nothing, parallax nothing, fade nothing in. The scene is already the motion.
- **Interaction.** A diorama on a marketing page can be a live toy, a replay of one good attempt, or a still. A live toy needs the same input and accessibility work as the game, including a visible focus state and a keyboard equivalent.
- **Performance.** One canvas per visible scene, paused with `IntersectionObserver` when off screen. A 360 by 280 software rasteriser is cheap, but five of them running at once on a phone is not.
- **Copy.** Lowercase status lines, plain verbs, no marketing adjectives. Say what the thing does in the same voice as the HUD.

For a game collection, `assets/shell.js` provides the same chrome the source games use: a game menu, a rules dialog and credits, all fixed text on white. Load it before the page script:

```html
<script src="../shell.js"></script>
<script>
PixelPlays.mount({
  id: 'my-game',
  games: [{ id: 'my-game', title: 'My game' }, { id: 'next', title: 'Next', soon: true }],
  rules: ['Goal.', 'Input and its keyboard equivalent.', 'Scoring.', 'The twist.'],
  credits: [['Made by', 'Your name', 'https://example.com']],
});
</script>
```

It leaves the title in place and appends only the menu, the dialog and the credits row. Do not copy the Pixel Plays game names or subjects.

## 10. Originality and licence

The engine is MIT, copyright AmirMushich and contributors, licence in `assets/LICENSE-pixel-plays`. Ship that file with the engine. Attribution in the page credits is welcome but not required by MIT.

The music is not MIT. `MUSIC.md` in the source repo says the tracks were generated with Suno and are not licensed for reuse. Ship no track, or one you own.

The visual language is a style, not a template. Take the camera, the dither, the ramps and the edge. Do not take the five games' subjects, layouts, names, copy or HUD wording. A new game should be describable without reference to any of them.

The upstream reference for the style is shawn.'s Small plays, cited by Pixel Plays as visual reference only. Treat it the same way: a direction, not a source of assets.

## Reference

- [references/visual-rules.md](references/visual-rules.md): the ten rules, the function and constant that enforce each, and the screenshot check.
- [references/techniques.md](references/techniques.md): 778 lines read from all five games. Water, storms, masonry, arches, curved ramps, cloth, palms, crowds, pose recipes, physics tables, bot AI, sound tables, and 30 named pitfalls with `file:function:line` references.
- `assets/engine.js`: the renderer, unmodified upstream.
- `assets/shell.js`: the menu, rules dialog and credits for a multi-scene site.
- `assets/starter/index.html`: the worked example.
