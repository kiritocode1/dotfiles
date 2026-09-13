---
name: animation-fundamentals
description: Build expressive web animations and complete UI interactions from construction recipes extracted from BLANK components and pages. Use when building frontend UI even without an explicit animation request, or recreating scroll scenes, click transitions, hover effects, drag galleries, masked text, page choreography, physics and shader effects.
---

# Animation fundamentals

Make motion decisions as part of building the interaction. The user should not have to ask for easing, enter and exit states, scroll behavior, or a response to clicking. Choose these from the component's job and the surrounding design. Ask about missing product behavior only when it changes what the control does.

The outcome is working animation with the same kinds of construction found in BLANK's components and full pages. You do not need access to that repository to use this skill. The recipe book includes the layer structure, geometry, input mapping and code needed to construct those effects. Source paths are provenance and optional deeper reading.

## Build from a mechanism

Read the relevant recipes in [construction recipes](references/construction-recipes.md) before implementing. Do not stop at recommending an effect or attaching a generic fade to the result.

For complete dependency-free examples, open [motion-lab.html](assets/motion-lab.html) in a browser and read its source. It implements masked lines, a reversing curtain, shared-layout movement, a pointer follower, scroll phases and a draggable rail. Use it to understand event wiring and intermediate states; adapt individual mechanisms rather than copying the whole example into a product.

| What the user is building or describing | Start with |
| --- | --- |
| Text that rolls up, uncovers, interlocks or scrambles | R1 and R13 |
| Full-screen menu, curtain, folding panel or page wipe | R2 and R12 |
| Project slider that changes on click | R3; R13 for coordinated titles and indices |
| A pinned hero that unfolds as you scroll | R4; R5 or R6 for cards and horizontal travel |
| Cards that stack, shrink, tilt, flip or separate | R5 |
| A gallery that changes layout or an image becoming the hero | R7 |
| Hover previews, magnetic elements or pointer-responsive objects | R8; R9 for trails |
| Drag gallery, wheel-controlled rail, inertia or snap | R10; R11 for wrapping |
| Marquee or continuously recycled image field | R11 |
| A line drawing through content or a bending SVG sheet | R12 |
| A loader that becomes the page | R14 with R1, R7 or R13 |
| A toy, falling tags, confetti or reacting objects | R15 |
| Distortion, refraction, dissolves or fluid motion | R16 |
| A ring, helix, depth tunnel or camera traveling through images | R17 |
| Buttons, selections, changing data or video controls | R18 and the timing defaults below |

Choose the mechanism yourself from the request and visual context. The user should not need to know these names. For ordinary product UI, selection and feedback may be sufficient. For an expressive portfolio or animated hero, choose a specific spatial idea and build it; do not reduce every reference to slide-up-and-fade.

### Compose related effects

Use one main progression for a scene and let its parts respond differently. For example:

- A scroll-led project section can combine a sticky stage, shrinking card shells, counter-zoomed images and rolling indices. Their values all derive from the same scroll progress.
- A click-led gallery can combine a directional mask, an image sliding behind it, a title strip and a moving selection marker. The same destination index controls all four.
- A pointer-led hero can combine a direct hit region, a slower follower, a velocity-sensitive distortion and a distance-spaced trail. Position, velocity and spawn distance have different jobs.

Tune the things that change the effect: origin, direction, travel, relative scale, layer order, phase overlap and input response. Easing comes after that construction. A rounded reveal mask and a counter-scaling image can produce a lens-like opening; changing only the easing on a flat crossfade cannot.

When adapting, preserve the source's useful relationships while fitting the new content. Keep shared identity in a layout morph, the counter-motion in a parallax slide, and the reveal direction in a wipe. Change copy, assets and dimensions to suit the product. Preserve exact values when the user requests an exact reproduction.

## Start with the interaction

Read the component, its styles and the code that owns its state. Follow imported motion tokens, scroll containers and animation helpers. For a new design, follow the project's source-discovery workflow before choosing a visual direction. If reproducing an exact source, preserve its mechanism and values rather than replacing them with these defaults.

For each interaction you are building, decide this internally before coding:

```text
input -> state or target -> motion driver -> visible result
```

Name the moving element, the property and direction, the trigger, and what happens on interruption. For example, "Selecting a tab moves the existing background pill to the new tab; another selection retargets that pill from its current position."

Inspect every input the component exposes. Use the relevant sections of [interaction patterns](references/interaction-patterns.md):

| Input or change | Decide before implementation |
| --- | --- |
| Hover and focus | What previews, what stays selected, and what returns on leave or blur |
| Pointer down and release | Immediate press response, activation, cancellation and disabled state |
| Click, tap or keyboard activation | Target state, direction, repeat input, success and failure |
| Scroll | Reveal, continuous scrub, threshold selection, velocity response, or navigation |
| Drag, swipe or wheel | Bounds, capture, click threshold, release velocity, snap and cancellation |
| Mount, unmount or data change | Stable identity, enter, exit, layout continuity and final content |
| Navigation | Persistent elements, cover, route commit, reveal, focus and scroll restoration |
| Time, media or physics | Authoritative clock, pause, resume, bounds and stop condition |

Keep stillness when no state or visual idea needs motion. Do not add a reveal to every section or a hover response to noninteractive content merely because this skill loaded. Preserve a chosen expressive design; restraint does not mean flattening it into opacity fades.

## Choose the driver before the curve

| Situation | Driver | Reason |
| --- | --- | --- |
| Colour, underline, small fixed hover | CSS transition | Retargets when the state changes without a JS timeline |
| Selection pill, changing size, direct manipulation settling | Existing spring system | Can follow a new target without waiting for a fixed sequence |
| Wipe, masked text, coordinated scene change | Tween or timeline | Related events need an explicit order and overlap |
| Continuous scroll | Normalized scroll progress | Scrolling backward must recover the earlier visual state |
| Pointer or inertial following | Target plus a frame-time-aware follower | Input changes faster than a timed entrance completes |
| Falling, collision or particles | Integrator or existing physics engine | Velocity and forces determine the trajectory |
| Playback or determinate progress | Actual media or operation state | The indicator must describe what is happening |

Use the tool already present. A simple button does not justify adding a motion package. Give each animated property one owner. Separate wrappers when scroll moves a card and hover tilts its contents. Do not let CSS, a spring and a timeline all write the same transform.

## Timing and easing are decisions you own

First reuse existing tokens. In Compronents, `src/lib/springs.ts` supplies these duration-based springs in seconds:

| Tier | Enter duration | Bounce | Exit tween duration |
| --- | ---: | ---: | ---: |
| fast | 0.08 | 0 | 0.06 |
| moderate | 0.16 | 0.08 | 0.12 |
| slow | 0.24 | 0.12 | 0.16 |

These are source settings, not measured settling times. They suit the shared controls, not every motion in the library. Use physics parameters or duration-based spring parameters intentionally; do not mix both expecting every field to control the result. Verify the installed engine's precedence when necessary.

If a project has no tokens, use the following starting choices, then judge them at the actual size and frequency. These are recommendations synthesized from the source, not corpus averages.

| Job | Starting choice |
| --- | --- |
| Press or frequently repeated feedback | Start immediately; 80 to 160 ms response, little or no overshoot |
| Small popup or selection change | 160 to 240 ms or a restrained spring; position and size may settle after opacity |
| Removal or dismissal | Shorter than entry, usually 60 to 160 ms for small UI; no unnecessary bounce |
| Readable section entrance | 450 to 850 ms when an entrance fits; group related content instead of making a long queue |
| Large authored wipe or scene | Source-specific timeline; account for the whole sequence before choosing its parts |

Choose by movement, not by writing `ease` everywhere:

- **Responding and arriving:** an ease-out decelerates into the target. Dither Studio's `cubic-bezier(0.16, 1, 0.3, 1)` is a concrete strong-out curve, not a universal substitute for all easing names.
- **Moving between visible positions or closing a large curtain:** an in-out curve can make both ends deliberate. Overlay Menu uses `power3.inOut` for its panels and `power3.out` for arriving links.
- **Exiting:** shorten the duration first. Accelerating departure can fit an object leaving the screen; a local dismissal need not acquire a slow wind-up.
- **Scrubbing or constant travel:** use linear progress or `ease: "none"` for direct mapping. Linear is appropriate for a marquee, progress sweep or clock. "Always ease everything" is wrong.
- **Elastic material or playful response:** overshoot belongs to a defined physical idea, such as a hanging sheet or bouncing object. Opacity, progress ratios and ordinary text do not need to bounce.

Use separate transitions per property. The shared tabs use a moderate spring for geometry and an 80 ms fade. A copy control can acknowledge success immediately while its icon settles. Shorten or remove motion the user encounters repeatedly.

## Continuity makes the change understandable

Keep the same element or stable identity when it is the same object changing position. Measure before changing layout. Reserve the label or image's space so the animation does not move unrelated content. A tab's background travels; it need not disappear and respawn at each destination.

Choose a meaningful origin. A menu opens from its trigger or edge. A card hinges at the intended side. A line of text emerges from its own mask. A wipe's mask and the image behind it can move separately. Read the geometry before calling two effects equivalent.

Use distance relative to the thing that moves. A masked line often travels one line height; a tiny icon should not travel the same distance as a full-screen panel. Keep controls usable while secondary content settles.

## Choreograph the whole transition

Use a timeline or state progression when parts depend on one another. Start secondary motion when its container exposes it, not after every preceding animation has finished. Compute the end of a stagger as `delay + duration + (count - 1) * stagger`. A 50 ms stagger over 60 items adds almost three seconds before the last item even starts. Group or cap it.

Separate logical state from visual completion. Handle a new target while moving. For hover, selection and menus, reverse or retarget from the current appearance. For a scene swap that must finish covering before committing content, keep the latest requested destination. A brief lock can protect a real indivisible operation; it should not discard ordinary UI input for the length of an ornamental animation.

Tie success to success, loading to actual pending work and a finished state to the actual result. A mock percentage in an authored intro must not become a fake network-progress indicator.

## Reduced motion is an implementation path

Respect the preference without asking. Render the final readable content, preserve selected states and controls, and remove travel, large zooms, parallax and decorative loops. Reflow a pinned story into ordinary content if the pin exists only to support motion. A nonessential fade can be instant too.

Handle both the preference at startup and changes while mounted. Stop JS animation owners as well as CSS animation. Check focusability of hidden content: opacity zero and clipped pixels do not remove links from keyboard navigation. Keep the initial static document usable if initialization fails; only hide content once a functioning reveal owns it.

## Build for the lifecycle

Use transforms and opacity where they express the mechanism. Size animation is justified when content actually expands, such as an accordion. Contain it and check its cost rather than banning it or scaling readable text into distortion.

Batch geometry reads, then writes. Recompute after fonts, images or container dimensions change. For continuous effects, update refs, motion values or uniforms rather than React state every frame. Clamp frame deltas after a pause, stop at rest where possible, and suspend decorative work offscreen or in a hidden tab.

Own cleanup locally: timelines, delayed callbacks, listeners, observers, frame loops, temporary DOM, split text, textures and render targets. A late asset promise must not restart an unmounted effect. A component must not kill another component's scroll triggers or alter global ticker settings without an owner that restores them.

## Verify the behavior you changed

Use the project's browser or device tooling for a meaningful runtime pass when changing motion. Exercise the actual input, not just a screenshot of the resting state:

- Hover and leave rapidly, activate twice, switch targets mid-transition, and dismiss before entry finishes.
- Scroll slowly, fling, reverse, cross the start and end, and resize at mid-progress for scroll work.
- Drag beyond bounds, release outside, cancel, then activate the same item from the keyboard for drag work.
- Check reduced motion and remount or navigation cleanup. Inspect for invisible overlays that still catch input.
- For complex continuous work, compare frame timing and resource counts during repeated use. A screenshot cannot prove smoothness.

Report what input you exercised, what it did, and anything unverified. Do not describe code inspection as visual validation.

## Source evidence and specialized work

Read [source patterns](references/source-patterns.md) for exact source paths, values, mechanisms and qualifications. It distinguishes reviewed implementations from the automated inventory of all source files.

For detailed scroll, click, hover, drag, route, text, physics, shader and media decisions, read only the relevant sections of [interaction patterns](references/interaction-patterns.md). These complement the defaults above.

When refreshing the extraction, run `python3 scripts/inventory.py /path/to/compronents --help`. The inventory reads source only. `references/coverage.json` is a searchable audit artifact, not a document to load into every UI task.
