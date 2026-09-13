# Build the motion

These recipes describe the construction, not just its name. They are adaptations of the mechanisms in the source map. The small code examples are portable implementations or implementation kernels, not verbatim exports from the repository. Exact source values are identified where used; other dimensions are adjustable starting points.

Use the existing rendering and animation stack. The examples use CSS, browser animations, plain JavaScript and GSAP where it clarifies a timeline. GSAP examples assume the package is installed and `gsap` is imported. React users initialize against mounted refs and return the cleanup from their effect. Apply the reduced-motion and input behavior in SKILL.md to every chosen recipe.

## Contents

| Recipe | Build this kind of result |
| --- | --- |
| R1 | Masked line, word or character reveal |
| R2 | Layered curtain menu and directional page wipe |
| R3 | Click carousel with image counter-motion and rolling titles |
| R4 | Scroll-controlled scene with several phases |
| R5 | Sticky card stack, flip and counter-zoom |
| R6 | Horizontal story, parallax and minimap |
| R7 | Shared-element layout change |
| R8 | Hover reveal, magnetic response and pointer tilt |
| R9 | Distance-spaced cursor image trail |
| R10 | Drag, inertia, bounds and snapping |
| R11 | Seamless marquee and recycled gallery |
| R12 | SVG line draw and elastic curtain |
| R13 | Rolling number, scramble and block reveal |
| R14 | Loader-to-hero sequence |
| R15 | Physical hop, follow-through and particles |
| R16 | Shader displacement and dissolution |
| R17 | 3D ring, helix and camera travel |
| R18 | Media progress and state-change feedback |

## R1. Reveal text from its own baseline

**Construction:** one semantic heading, one clipping wrapper per line, one moving child per wrapper. The wrapper stays put. The text starts below it and translates upward. This creates an uncovering, not a block floating up from elsewhere.

```html
<h2 aria-label="Independent work. Shared standards.">
  <span class="line-mask" aria-hidden="true"><span>Independent work.</span></span>
  <span class="line-mask" aria-hidden="true"><span>Shared standards.</span></span>
</h2>
```

```css
.line-mask { display: block; overflow: clip; padding-bottom: .12em; margin-bottom: -.12em; }
.line-mask > span { display: block; }
/* Only the initialized animation owner applies this state. */
[data-motion-ready] .line-mask > span { transform: translateY(105%); }
```

```js
function revealLines(lines, gsap) {
  return gsap.fromTo(lines, { yPercent: 105 }, {
    yPercent: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out'
  });
}
```

Fire once when the block reaches the lower portion of its actual scroll viewport, or place it inside the page-entry timeline. The Dither Studio source instead pairs an 850 ms mask reveal with `translateY(80%) scale(.96)`, an 80 ms line stagger and `cubic-bezier(.16,1,.3,1)`. That additional scale gives a different arrival; choose it deliberately.

For responsive automatic lines, wait for fonts, split by rendered lines and rebuild on width changes. Preserve inline emphasis, links, indentation and a single accessible reading. Explicit spans suit deliberately broken headlines. Do not split body text into inaccessible individual characters.

**Variations:** stagger characters within each line for a skewed headline; set alternate characters to `yPercent: -105` for interlocking type; slide an opaque bar across each line then retract it from the opposite edge for block reveal. Change the geometry, not just the duration.

## R2. Open a layered curtain, then expose its links

**Layers, back to front:** page, coloured panels, menu surface, masked links, toggle. Give the toggle a higher stacking level than the open panel. Anchor panel transforms at the entering edge.

```css
.curtain { position: absolute; inset: 0; transform: scaleY(0); transform-origin: top; }
.menu-surface { position: absolute; inset: 0; clip-path: inset(0 0 100% 0); }
.menu-word-mask { overflow: clip; }
```

The Overlay Menu source uses four panels, 750 ms travel, 100 ms panel stagger, and link reveals at 50 ms spacing. The following adaptation keeps everything on one reversible timeline instead of launching separate delayed link tweens:

```js
function makeCurtain({ panels, surface, links, toggle, gsap }) {
  gsap.set(links, { yPercent: 100 });
  const tl = gsap.timeline({ paused: true })
    .to(panels, { scaleY: 1, duration: .75, stagger: .1, ease: 'power3.inOut' }, 0)
    .to(surface, { clipPath: 'inset(0 0 0% 0)', duration: .75, ease: 'power3.inOut' }, .45)
    .to(links, { yPercent: 0, duration: .75, stagger: .05, ease: 'power3.out' }, .85);
  let open = false;
  surface.inert = true;
  const activate = () => {
    open = !open;
    toggle.setAttribute('aria-expanded', String(open));
    surface.inert = !open;
    surface.style.pointerEvents = open ? 'auto' : 'none';
    tl.reversed(!open);
    tl.paused(false);
  };
  toggle.addEventListener('click', activate);
  return () => { toggle.removeEventListener('click', activate); tl.kill(); };
}
```

Add Escape, focus entry and restoration, and modal focus containment when the menu is modal. Keep the open/closed target independent of timeline completion. Clicking during entry reverses current progress.

**Route version:** use `scaleX` strips. Cover from the left, commit the next route when fully covered, then switch origin to the right and collapse. Persistent navigation stays outside the moving content. Save the most recent requested destination during a cover. Route readiness determines reveal, not a guessed timeout.

**Variations:** rotate two oversized halves around their shared seam; unfold stacked strips from a side; translate the page down by a viewport while revealing the menu. These are separate geometries with the same state progression.

## R3. Click a slide, move its mask and image separately

**Construction:** viewport with `overflow: hidden`, outgoing and incoming absolute layers, an image inside each layer, a title strip inside a one-row mask, previous and next buttons. Decode the next image before revealing it.

```js
function slideTransition({ oldLayer, newLayer, direction, gsap }) {
  const sign = direction === 'next' ? 1 : -1;
  const closed = sign === 1 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
  const distance = oldLayer.clientWidth * .25;
  gsap.set(newLayer, { clipPath: closed });
  gsap.set(newLayer.querySelector('img'), { x: sign * distance });
  return gsap.timeline()
    .to(newLayer, { clipPath: 'inset(0 0 0 0)', duration: 1, ease: 'power4.inOut' }, 0)
    .to(newLayer.querySelector('img'), { x: 0, duration: 1.2, ease: 'power4.out' }, 0)
    .to(oldLayer.querySelector('img'), { x: -sign * distance, duration: 1.2, ease: 'power4.out' }, 0);
}
```

The image and the cut edge travel at different rates. Crossfading the two images loses that mechanism. Split Click Slider uses a source-specific custom curve, 1.5 second image and mask transitions, and 500 px image travel. Scale travel to the new frame unless reproducing that source exactly.

For the title and counter, move a strip to `-index * measuredRowHeight`. Keep the strip's row height stable. Recompute after fonts or responsive changes. Commit active controls immediately, settle the scene, then remove the outgoing layer. Keep at most the outgoing and incoming layers plus an optional prepared next layer. On a new request, finish or retarget coherently and retain the latest index.

**Variations:** divide the frame into two offset clip polygons; counter-rotate the outgoing and incoming image; let the title arrive from the same direction as the picture. Each variation needs the same source of truth for index and direction.

## R4. Scrub a multi-phase scene

**Construction:** tall section, sticky viewport-height stage, absolute layers inside the stage. Native scrolling supplies progress; the stage does not advance on its own.

```css
.story { position: relative; height: 400svh; }
.story-stage { position: sticky; top: 0; height: 100svh; overflow: clip; }
```

```js
const clamp01 = x => Math.max(0, Math.min(1, x));
const mix = (a, b, p) => a + (b - a) * p;
const phase = (p, start, end) => clamp01((p - start) / (end - start));
// start is the section top in the actual scroller's content coordinates.
const progress = (scrollTop, start, sectionHeight, viewportHeight) =>
  clamp01((scrollTop - start) / Math.max(1, sectionHeight - viewportHeight));

function renderScene(p, { aperture, image, title, cards }) {
  const opening = phase(p, 0, .25);
  const reading = phase(p, .2, .55);
  const departure = phase(p, .7, 1);
  aperture.style.clipPath = `inset(${mix(42, 0, opening)}% ${mix(35, 0, opening)}%)`;
  image.style.transform = `scale(${mix(1.35, 1, opening)})`;
  title.style.opacity = String(reading * (1 - departure));
  title.style.transform = `translateY(${mix(30, 0, reading) - departure * 40}px)`;
  cards.forEach((card, i) => {
    const q = phase(p, .35 + i * .08, .65 + i * .08);
    card.style.transform = `translateY(${mix(110, 0, q)}%) rotate(${mix(8, 0, q)}deg)`;
  });
}
```

Measure section height and scroll start on setup and resize. For an element scroller, derive start from `sectionRect.top - scrollerRect.top - scroller.clientTop + scroller.scrollTop`. For the window, use `sectionRect.top + window.scrollY`. Call the render function initially and on coalesced scroll frames.

Every property is calculated for every progress value. Flinging directly to the end works; reverse recovers the beginning. Avoid one-way `onEnter` state changes for a reversible scene.

**Threshold variation:** `index = Math.min(count - 1, Math.floor(p * count))` selects a project; the index change triggers a timed image/title transition. It is not continuous scrub. **Repeated cycle:** keep `local = p * count - index`, clamped at the final endpoint, to animate the active project within its portion. Cycle Scrub Showcase uses this integer-plus-fraction construction.

## R5. Build a card stack with depth

**Layers:** pinned or sticky card shells, inner image, darkening overlay, optional back face. The shell and image need separate transforms.

For each card, define progress from when its successor starts covering it to when the successor settles:

```js
function renderStackCard(q, shell, image, shade, tilt = 10) {
  shell.style.transform = `scale(${1 - .5 * q}) rotate(${-tilt * q}deg)`;
  image.style.transform = `scale(${1 + .5 * q})`;
  shade.style.opacity = String(.35 * q);
}
```

This adapts Pushup Card Stack's shell shrink to .5 and image counter-zoom to 1.5. The different scales make the frame retreat while the photo remains visually present. A uniform scale on the whole card produces a different effect.

For a hinged stack use parent perspective, `transform-origin: center top`, `rotateX`, and negative `translateZ`. For a two-sided flip, add front and back faces with `backface-visibility: hidden`; rotate the back 180 degrees and rotate the shell through 180. Keep text on an actual face, not mirrored.

Give the last card an explicit end state and scroll exit. Keep enough section height for the final content to remain readable. In reduced motion, show the cards in document order.

## R6. Move a horizontal story and its minimap

**Construction:** sticky clipped viewport, a flex track, oversized images inside clipped panels, and a small progress indicator. Measure the track, not an assumed number of screens.

```js
const travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
track.style.transform = `translateX(${-p * travel}px)`;
indicator.style.transform = `translateX(${p * (rail.clientWidth - indicator.clientWidth)}px)`;
```

Use the same `p` for both, with their own travel distances. For each image, derive its panel's distance from the viewport center, clamp it to a useful range and translate the image against that motion. An image at scale 1.35 has extra crop room for parallax; limit movement to that room so no blank edges appear.

If the story is pinned, derive pin length from required travel plus reading holds. If it is a draggable rail, feed the shared position from R10. A minimap click maps back to the same progress rather than running a second independent scroll state.

## R7. Rearrange the same objects with FLIP

**Construction:** one collection with stable IDs. Layout classes describe the final geometry. Record the current rectangles, apply the new layout, record final rectangles, animate the inverse difference to zero.

```js
function flipLayout(items, changeLayout) {
  // Read before writing. Capture the currently rendered state on interruption.
  const before = items.map(el => el.getBoundingClientRect());
  items.forEach(el => el.getAnimations().forEach(a => a.cancel()));
  changeLayout();
  const after = items.map(el => el.getBoundingClientRect());
  return items.map((el, i) => {
    const a = before[i], b = after[i];
    if (!b.width || !b.height) return null;
    return el.animate([
      { transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${a.width / b.width},${a.height / b.height})`, transformOrigin: 'top left' },
      { transform: 'none', transformOrigin: 'top left' }
    ], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
}
```

This kernel assumes the item's transform is dedicated to FLIP and its ancestors have no scaled coordinate system. Use an outer wrapper or the incumbent layout engine for transformed ancestors, border-radius correction and nested scale correction. Scaling text can look wrong; animate a shell and preserve the content's size where needed.

Flip Layout Gallery records with `Flip.getState`, swaps its CSS layout class, then runs `Flip.from`. Its column layout deliberately has zero stagger. For a selected tab, move one measured pill instead of FLIP-transforming the text labels.

## R8. Make hover and pointer movement spatial

A hover reveal is a state change. Pointer following is a continuously changing target. Use separate values for the two.

```js
// clientX/clientY come from the event; rect is the component's current viewport rect.
const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - .5) * 2));
const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - .5) * 2));
const targetX = nx * 10;
const targetY = ny * 6;
// Run in a frame callback. dt is seconds, bounded after a pause.
const alpha = 1 - Math.exp(-12 * dt);
currentX += (targetX - currentX) * alpha;
currentY += (targetY - currentY) * alpha;
visual.style.transform = `translate(${currentX}px,${currentY}px) rotateX(${-currentY}deg) rotateY(${currentX}deg)`;
```

Keep the hit area still and move its inner visual, otherwise moving away from the pointer can trigger hover flicker. On leave set targets to zero. Fine-pointer hover can reveal a preview; keyboard focus must offer the same useful information, and touch needs an explicit activation path.

For the folder effect, a stationary folder contains three clipped preview cards. Raise the folder shell 25 px, lift images one image-height out of its mouth, rotate left/center/right cards in different ranges, and stagger by 25 ms. Folder Preview Hover uses `back.out(1.7)` and 250 ms for this playful pop. Reuse a seeded rotation per card if stable repeated behavior is desired.

## R9. Spawn a trail by distance, not event count

**Construction:** decorative absolute overlay with `pointer-events: none`; reusable image nodes; last spawn position; smoothed pointer position; a finite live set.

```js
const dx = pointer.x - lastSpawn.x, dy = pointer.y - lastSpawn.y;
if (Math.hypot(dx, dy) >= spacing && inside) {
  spawnAt(smoothed.x, smoothed.y, pointer.x, pointer.y);
  lastSpawn = { ...pointer };
}
```

Cursor Image Trail uses 150 px spacing, ten horizontal mask slices and center-out slice delays. Place each image at the smoothed position, move it toward the live pointer and uncover slices. Reverse the slice order on removal. A simple scale-and-fade trail is a legitimate alternative, but does not reproduce the slicing mechanism.

Keep a bounded pool and recycle old entries. Stop when the pointer is outside or the effect is suspended. Account for the component rect and scrolling in the same coordinate system. Cancel each spawned entry's animations and delayed removals on teardown. Keep these decorative images out of the accessibility tree.

## R10. Drag directly, coast on release, snap when appropriate

**State:** position, velocity, pointer ID, last pointer/time, start pointer, bounds, and optional snap target. The same position feeds wheel, buttons and drag; inputs must not fight different controllers.

```js
// During drag: update directly, without a trailing entrance tween.
const dx = event.clientX - lastPointerX;
const dt = Math.max(.001, (event.timeStamp - lastPointerTime) / 1000);
velocity = dx / dt;
const proposed = position + dx;
position += dx * (proposed > max || proposed < min ? .35 : 1);
// After release: advance with seconds, then decay velocity.
position += velocity * frameDt;
velocity *= Math.exp(-8 * frameDt);
// Optional predicted snap, constrained to valid content.
const snap = Math.max(min, Math.min(max, Math.round((position + velocity * .12) / step) * step));
```

Use pointer capture; handle `pointercancel` and lost capture. A movement threshold distinguishes a click from a drag. Pixelgrid uses 5 px and 35% movement beyond bounds. On cancel, settle without activating the link. Use `touch-action: pan-y` for a horizontal rail when vertical page scrolling should survive; use `none` only for a truly two-dimensional manipulation region.

On release, choose one policy: coast freely, spring back to bounds, or approach the predicted snap. Stop below a position and velocity threshold. New pointer input cancels settling immediately. An accessible previous/next button updates the same target, and a keyboard-activated link still works.

A snapping project wall can wait briefly after wheel input stops. Snap Parallax Projects uses 100 ms idle detection, a 500 ms snap and `1 - (1 - t)^3`. Its per-frame following factor is a source detail; use frame-time-aware following in a new implementation.

## R11. Loop without a visible reset

For a time-driven marquee, duplicate one complete sequence, including its trailing gap. Measure its total width `W`, use constant pixels per second, and wrap within one sequence:

```js
const wrap = (x, size) => ((x % size) + size) % size;
offset = wrap(offset + speed * dt, W);
track.style.transform = `translateX(${-offset}px)`;
```

The duplicate is decoration, so hide it from assistive technology and remove its descendants from keyboard navigation. If contents are interactive, offer a stable interaction mode. Suspend or pause autonomous travel when appropriate.

For a scroll-driven strip use `x = mix(startX, endX, p)` instead. Flip Marquee Horizontal is scroll-driven even though its name contains marquee. Marquee Carousel Scroll combines a ten-second looping title with scroll-driven slide changes. Keep those clocks separate.

For an infinite indexed gallery, retain an unbounded logical index and map content with `((index % count) + count) % count`. Recycle a bounded set around the visible region. When rebasing a track, shift both current and target coordinates so interpolation does not jump across a full sequence.

## R12. Draw a path or deform a sheet

For line drawing, use the real SVG path length:

```js
const length = path.getTotalLength();
path.style.strokeDasharray = String(length);
path.style.strokeDashoffset = String(length * (1 - p));
```

The drawing's position is already encoded in the path. Synchronize `p` with when the path reaches the related content, not with an unrelated page-wide percentage. Rounded caps and joins affect the visible endpoints. Preserve the supplied path data for exact-source work.

For an elastic curtain, animate a quadratic control point separately from the edge:

```js
// y is the main edge; sag is how far the center bends past it.
const d = `M0 0 H${width} V${y} Q${width / 2} ${y + sag} 0 ${y} Z`;
path.setAttribute('d', d);
```

Move `y` to cover the viewport, overshoot `sag`, then settle `sag` to zero. Reverse the edge to close. Elastic Curtain Menu shapes the sheet with power4.in then power4.out; its elastic.out curve belongs to the arriving link characters. A rectangular panel with a bounce translation does not create the same sheet.

## R13. Roll, scramble or wipe text changes

**Rolling digits:** one fixed-size clipped cell per digit, a vertical strip of numerals inside it, tabular numbers on the container. Animate strip translation by whole row heights. Handle wrap deliberately, such as appending a duplicate zero after nine. Derive displayed values from real state.

**Scramble:** retain the final text separately. Each character has a reveal deadline. Before that deadline draw from a bounded glyph set; after it, write the final character. Use a shared clock so completion is bounded. Keep the accessible text stable and reserve width to prevent layout jitter.

```js
const characters = Array.from(text);
const settled = Math.floor(clamp01(elapsed / duration) * characters.length);
const frame = characters.map((char, i) =>
  i < settled || /\s/.test(char) ? char : glyphs[Math.floor(random() * glyphs.length)]
).join('');
```

**Block wipe:** animate a cover's `scaleX` from 0 to 1 with origin left. Reveal the text while covered, switch origin to right, then scale the cover to 0. This yields a bar that passes through instead of retracting toward its entry point.

Use these for short titles or changing values. A paragraph does not need an unreadable decode sequence on every visit.

## R14. Turn a loader into the hero

A loader sequence has dependencies as well as timing. Keep asset readiness separate from a short authored opening. Wait for the assets essential to the first revealed frame; handle failure with usable content. Do not hide a complete page for an arbitrary fake percentage.

Build a timeline with one shared object surviving the handoff:

```text
0.00 counter + framed image start together
0.60 supporting strips begin aligning
1.10 outer strips leave, center image expands
1.25 title lines enter over the expanding image
1.45 navigation appears
```

The times above are an illustrative composition, not source values. Landing Image Reveal supplies the mechanism: scattered images align, outer pairs leave, the center becomes the hero, and masked text arrives over it. Odometer Load Hero coordinates digit reels to finish together. Their visual continuity is more important than copying a long loading duration.

For a real route, preserve the center image's identity through the size change using R7 or a shared layer. Ensure essential navigation is available promptly and avoid replaying the entire opening on routine internal navigation.

## R15. Give a physical object anticipation and follow-through

Use distinct parts. The main object hops, loose flaps continue to move, and particles follow their own trajectories. A single scale spring on the whole group cannot express those relationships.

Surprise Box's hop lasts 560 ms, peaks at 38% of the timeline and lands into a small squash at 72%. Repeated clicks increase power; five pokes separated by at most 400 ms open the box. That combo behavior is specific to the toy, not a rule for ordinary buttons.

```js
// Physical particles, dt in seconds. Spawn once, update until out of bounds.
particle.vy += gravity * dt;
particle.x += particle.vx * dt;
particle.y += particle.vy * dt;
particle.rotation += particle.spin * dt;
```

Change front/back layering at the apex if particles rise behind an object and fall in front. Remove expired particles and stop the loop when none remain. Use a collision engine when objects must pile up and remain grabbable, as in Physics Tag Footer. Match boundaries to the container after resize.

**Variation controls:** throw direction, gravity, restitution, drag, mass, delayed secondary motion, and the point at which layering changes. More bounce is not a substitute for these decisions.

## R16. Distort the image coordinates, not the whole element

A shader effect usually has a fixed mesh or full-screen plane, the original texture, a progress or pointer uniform, and a fragment function that chooses which texture coordinates to sample.

Pixel Smear Wordmark subtracts pointer positions rather than translating the element. For a velocity-like response that decays when motion stops, keep the previous rendered position and update it after each frame. The source retains the previous event target, so its remaining displacement is not proof of a zero-at-rest velocity signal. This adaptation shows the intended distinction:

```glsl
// uv, pointer and previousPointer are normalized in the same coordinate system.
vec2 direction = pointer - previousPointer;
float falloff = 1.0 - smoothstep(0.0, radius, distance(uv, pointer));
vec2 displacedUV = uv - direction * strength * falloff;
vec4 colour = texture2D(image, displacedUV);
```

For a dissolve, compare a noise field with progress:

```glsl
// noiseValue comes from the chosen noise texture or function.
float edge = smoothstep(progress - softness, progress + softness, noiseValue);
vec4 colour = mix(nextImage, currentImage, edge);
```

Handle progress 0 and 1 explicitly so the endpoints are complete images. The actual look depends on noise scale, threshold direction, edge colour, aspect-correct texture sampling and softness. Match those before adjusting speed. UV-origin mismatches invert the pointer response; a convex lens and a concave lens are different sampling functions.

Drive progress through R3 or R4. Use R8 for a follower, or a velocity field for a fluid simulation. A fluid field needs ping-pong buffers and a solver, not just a displaced CSS image. Keep render resolution bounded and dispose resources. Provide the original image when the renderer is unavailable.

## R17. Arrange objects in depth, then move through them

Keep object placement, camera movement and focus scaling separate. For an image ring:

```js
const angle = index / count * Math.PI * 2;
position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
```

For a helix add `height = index * spacing`. For a tunnel, arrange rings along Z and wrap each depth relative to a shared travel value. Keep each image's real aspect ratio. Choose whether planes face the camera, face the center, or stay tangent to the path; that decision changes the entire composition.

Curve Gallery samples a closed path with `getPointAt(t)`. Wheel, drag, keyboard and autoplay all change one progress target. It follows progress with `1 - exp(-7 * dt)`, camera position with `1 - exp(-5 * dt)`, and focus scale with `1 - exp(-9 * dt)`. The different response rates create depth without disconnecting the input.

For DOM 3D cards, establish perspective on an ancestor and preserve 3D on the appropriate wrappers. For a real mesh, use the existing renderer and avoid projecting a 2D imitation when depth or lighting is part of the requested effect.

## R18. Let real state drive feedback

A video playhead is `currentTime / duration`. A seek maps pointer position into the same ratio and clamps it. A story timer needs its own pause/resume state. Do not let clicking the seek bar also activate the enclosing play/pause handler. Filmstrip Video Player explicitly stops that propagation.

For a copy action, animate the check only after the clipboard promise resolves. Keep the label's width stable. Preserve a visible error path on failure. The repository's code-block copy button uses a 600 stiffness / 30 damping icon spring and a .95 press scale, with zero-duration icon motion under reduced motion.

For changing data, briefly mark the changed object while its position remains stable. Types Viz flashes a 5% white overlay over 50 ms and fades it over 1.5 seconds; it does not flash on first mount. This illustrates a fast acknowledgement followed by a slow disappearance. It is not a reason to flash every text update.
