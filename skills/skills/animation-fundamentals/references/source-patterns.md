# Source patterns and extraction coverage

Extracted on 2026-09-14 from `kiritocode1/compronents`, HEAD `1e67667005a9d9512b74405df50fbf054cb41925`, plus the working tree recorded in `coverage.json`. The two Moneybee page additions were uncommitted at capture time. They are included in scan coverage, not used as immutable published examples.

The recipes are self-contained. Access to this repository is optional when using the skill. To inspect an original, resolve the path below inside Compronents, or use `https://github.com/kiritocode1/compronents/blob/1e67667005a9d9512b74405df50fbf054cb41925/<path>` for a file present at that commit. The inventory's SHA-256 is the exact scanned working-tree content.

## What was covered

The inventory read all 1,017 supported text files under `src/`, totaling 313,214 lines at capture time. That includes 547 registry files, 382 component files, 31 app files, 54 library files, two hooks and the proxy. It includes static wrappers and backend source rather than silently excluding files with no motion matches. Reference captures, tests, dependencies, generated builds and binaries are outside this source census.

The scan records exact line numbers for 17 kinds of evidence: timing, springs, scroll, viewport entry, pointer, activation, keyboard/focus, drag, presence/layout, navigation, text/SVG, frame loops, physics, shaders/3D, media, reduced motion and lifecycle. Signals overlap. A word can occur in a comment or in unrelated backend code. An absent signal can mean a wrapper delegates to another file.

This is a complete automated source census plus targeted reading of motion implementations, page entrypoints and their helpers. It is not a claim that every line was manually reviewed, every component was rendered, or the source has passed an accessibility audit. The table below names the implementations whose code informed the recipes. Descriptive header surveys were used to locate further families, not to certify their behavior.

## Implementations that informed the skill

Paths start at the repository root. Search the named symbol or exact value; the inventory also records relevant line numbers.

| Path and anchor | Observed construction or setting | What the skill takes from it |
| --- | --- | --- |
| `src/lib/springs.ts`, `spring` | Duration-based fast/moderate/slow springs .08/.16/.24 seconds; bounce 0/.08/.12; exit tweens .06/.12/.16 | Small controls have a shared vocabulary and quicker exits. These are configuration values, not measured durations. |
| `src/components/ui/tabs-subtle.tsx`, selected and hover pills | Measured left, top, width, height; geometry springs; opacity .08 seconds; returning hover pill uses .06 | Selection continuity, independent property timing, separate hover/focus/selection. |
| `src/hooks/use-proximity-hover.ts`, `measureItems`, `handleMouseMove` | Layout offsets plus live scroll, border and ancestor scale conversion; batched frames | Keep measurements and pointer coordinates in a consistent space. |
| `src/components/animate-ui/primitives/buttons/button.tsx`, `Button` | Hover 1.05, tap .95 | Press and hover are separate states. Magnitudes are examples, not universal settings. |
| `src/components/ui/code-block.tsx`, `CopyButton`, `ICON_SPRING` | .95 press scale, 600 stiffness / 30 damping, zero-duration reduced-motion icon | Result feedback with a static fallback. |
| `src/components/animate-ui/components/buttons/copy.tsx`, `handleCopy` | Waits for clipboard success, then changes icon; .25 second scale/blur transition | A check confirms actual success. The source's untracked reset timeout is not a cleanup model. |
| `src/components/animate-ui/primitives/radix/accordion.tsx`, `AccordionContent` | Height 0 to auto, opacity, mask stop and y 20 to 0 over .35 seconds | Expanding content legitimately changes layout; coordinate mask and size. |
| `src/registry/dither-studio-page/reveals.tsx`, `TextReveal`, `MonoReveal` | .85 second mask/transform, cubic-bezier .16,1,.3,1; .08 second line stagger; ghost label | Masked typography, reserved layout, static reduced-motion path. |
| `src/registry/pixelgrid-studio-page/scripts/reveals.ts`, `initReveals` | Waits for fonts; groups rendered words by offsetTop; .1 second line spacing; observer .1 threshold | Responsive line construction and observer ownership. |
| `src/registry/pixelgrid-studio-page/scripts/scroll-adapter.ts`, `getScrollParent` | Finds overflow ancestor; reads its scrollTop and clientHeight | Preview containers can own scroll instead of the window. |
| `src/registry/overlay-menu.tsx`, timeline and `onToggle` | Four scaleY panels .75 seconds / .1 stagger; surface overlap .6; delayed links | R2 layered geometry. Source blocks toggles during animation and launches links separately; the recipe uses one reversible owner. |
| `src/registry/block-page-transition.tsx`, `navigate` | ScaleX cover, route scene commit, opposite transform origin, uncover | Route replacement occurs behind coverage. |
| `src/registry/split-click-slider.tsx`, `animateSlide`, `onClick` | Local half-frame click direction; 500 px image counter-motion; 1.5 second mask; rolling title and index | R3 separate mask and image motion tied to one index. |
| `src/registry/scroll-scrub-slider.tsx`, `animateNewSlide`, trigger `onUpdate` | Progress selects a slide; .5 second opacity and 1 second scale; .75 second line reveal | Threshold-triggered tweens differ from continuous scrub. |
| `src/registry/flip-marquee-horizontal.tsx`, `onUpdate`, `Flip.from` | Scroll pans strip; first .05 changes colour, first .2 FLIPs a clone, .2 to .95 moves track; `ease: none` | A marquee can be scroll-driven. Phase mapping and shared geometry. |
| `src/registry/drag-timeline-scroll.tsx`, `Draggable.create` | Bounded x handle maps progress into a horizontal track; a 1 second power3.out content tween | R6 input-to-progress mapping. Preserve direct handle response and avoid accumulating follower tweens. |
| `src/registry/flip-layout-gallery.tsx`, `switchLayout` | Capture rects, swap CSS class, Flip.from; column stagger 0; other layouts .025 | R7 identity-preserving layout change; settle coordinate space before capture. |
| `src/registry/folder-preview-hover.tsx`, `onEnter`, `onLeave` | Folder y 25 to 0; images y -100%; .25 second back.out(1.7); .025 entry stagger | R8 spatial preview with a different origin per card. Source width cutoff is not a universal input-capability test. |
| `src/registry/cursor-image-trail.tsx`, `render`, `createTrailImage` | 150 px spawn threshold, ten masks, distance from center controls delay; .1 per-frame interpolation | R9 distance-spaced trails. Adapt interpolation to elapsed time and own timers. |
| `src/registry/pixelgrid-studio-page/scripts/carousel.ts`, `onDown`, `onMove`, `up` | Pointer capture, 5 px click threshold, .35 overdrag resistance, velocity and snapping | R10 separate click/drag/cancel paths. Source .94 decay is per frame, not frame-rate independent. |
| `src/registry/snap-parallax-projects.tsx`, `updateSnap`, `animate` | 100 ms idle before snap; 500 ms cubic-out snap; retained panels around logical index | Inertia, settling and bounded virtualization are distinct from an entrance animation. |
| `src/registry/marquee-carousel-scroll.tsx`, looping title tween | Ten-second infinite title tween alongside scroll-driven slide changes | Separate time and scroll clocks inside one composition. |
| `src/registry/curve-gallery.tsx`, input handlers and `render` | Wheel/drag/keys/autoplay share target progress; delta cap .05; exponential rates 7,5,4.4,9 | R8/R17 frame-time-aware response and independent camera/plane/scale rates. |
| `src/registry/surprise-box.tsx`, `hop`, `poke`, `step` | 560 ms hop, apex .38, squash .72; five-poke combo with 400 ms gaps; dt-limited particles; layering flips at apex | R15 physical sequencing and stateful playful click response. |
| `src/registry/physics-tag-footer.tsx`, `CONFIG`, Matter setup/cleanup | Gravity y 1, restitution .5, friction .15, air friction .02, grabbable bodies | Collision-based falling and piling needs simulation, not merely tweens. |
| `src/registry/pixel-smear-wordmark.tsx`, fragment and pointer uniforms | Shader subtracts smoothed current position and previous event target; distance falloff shapes displacement | R16 sampling differs from element translation. The portable recipe updates previous position per frame for a zero-at-rest signal. |
| `src/registry/filmstrip-video-player.tsx`, `onTimeUpdate`, `onTimelineClick` | Actual media time maps playhead; seek stops propagation; .5 second linear marker interpolation | R18 use media state and prevent conflicting enclosing clicks. |
| `src/registry/sunlit.tsx`, reduced-motion stylesheet | Stops leaf loop and several spatial transitions | Ambient motion has a deliberate static presentation. CSS alone does not stop unrelated JS loops. |
| `src/components/site/types-viz.tsx`, `FlashBox` | .05 opacity, 50 ms rise / 1500 ms fade; first key does not flash | R18 acknowledgement tied to a value change. |
| `src/components/site/effect-viz.tsx`, spring constants | Default 180/25/.8; slide .5 visualDuration with zero bounce; dot .5 with .4 bounce | Different roles within one visualization can have different physical responses. Mixed spring fields need engine-precedence care. |
| `src/registry/settlement-layer-page/index.tsx`, `useSmoothScroll`, `useFadeIn` | One Lenis/ticker relationship, font/load refresh, static reduced-motion reveals | Full-page coordination and correct scroller ownership. |
| `src/registry/neoteric-page/index.tsx`, route render | AnimatePresence wait, keyed route, scaleX entry and exit covers | Presence-driven transition is a strategy distinct from native View Transitions. |
| `src/registry/clip-mask-transition-page/index.tsx`, `navigate` | View Transition feature guard; named persistent navbar; immediate fallback | Preserve persistent content. The comment assuming React batching fits snapshot capture is not a guarantee to teach. |
| `src/registry/polite-chaos-page/source/useViewTransition.ts` | Function directly calls the supplied route callback | An API name does not prove the effect exists. Trace actual implementation. |
| `src/registry/dark-catalog-page/providers/TransitionProvider.tsx`, `navigate` | 2-by-5 cover grid, 1 second power4.inOut, .1 stagger, route commit then uncover | R2 route choreography. Global getAll().kill is not reusable component cleanup. |

## Additional families located in the full survey

The root component and page-entrypoint survey located these constructions. Their names and descriptions guided recipe coverage; these rows are not claims of a complete implementation review.

| Family | Further source examples |
| --- | --- |
| Card depth and succession | `pushup-card-stack.tsx`, `sticky-flip-cards.tsx`, `tilt-card-stack.tsx`, `split-card-scroll.tsx` |
| Scroll phases and path drawing | `cycle-scrub-showcase.tsx`, `drawn-path-features.tsx`, `ribbon-stroke-scroll.tsx`, `converging-search-scroll.tsx` |
| Text and loading | `line-rise-text.tsx`, `skew-char-header.tsx`, `block-reveal-text.tsx`, `landing-image-reveal.tsx`, `odometer-load-hero.tsx` |
| Alternative menu geometry | `elastic-curtain-menu.tsx`, `rotating-halves-menu.tsx`, `folding-panel-menu.tsx`, `push-down-overlay-menu.tsx` |
| Continuous galleries | `wrapped-drag-index.tsx`, `infinite-drag-canvas.tsx`, `parallax-drag-rail.tsx`, `minimap-scrubber.tsx` |
| Shader and 3D | `webgl-dissolve-scroll.tsx`, `cappen-fluid-simulation.tsx`, `shader-grid-gallery.tsx`, `spiral-gallery.tsx`, `scroll-tunnel-3d.tsx` |
| Integrated pages | `dining-room-page/index.tsx`, `interior-studio-page/index.tsx`, `film-studio-page/index.tsx`, `pixelgrid-studio-page/index.tsx`, `content-architecture-page/index.tsx` |

All paths in this last table are under `src/registry/`. Inspect their actual implementation before treating a descriptive comment as an exact specification.

## Refresh or locate evidence

Run from the skill directory:

```sh
python3 scripts/inventory.py /path/to/compronents --check references/coverage.json
python3 scripts/inventory.py /path/to/compronents --family scroll --path src/registry/ --context 1
python3 scripts/inventory.py /path/to/compronents --family activation --path page --context 2
python3 scripts/inventory.py /path/to/compronents --output /tmp/motion-coverage.json
```

The check reports added, removed and changed source and scanner drift. It does not rewrite this evidence snapshot. Refresh the snapshot deliberately after reviewing changes. A working-tree hash identifies the capture; it does not make uncommitted source publicly retrievable.

## Validation of the teaching example

The bundled `assets/motion-lab.html` was exercised in Chromium through Agent Browser on 2026-09-14. Ten checks passed: mid-entry curtain reversal, Escape/focus restoration, FLIP element identity, completed masked text, pointer response/return, forward/reverse container scrolling, shared rail button/keyboard state, captured drag release, live reduced-motion switching and a 390 px layout without horizontal document overflow. The browser reported no page errors.

These checks validate the bundled example, not all original components or all 18 recipe kernels. The source census and inventory drift detection were tested separately with a temporary Git fixture. No independent cross-model evaluation or frame-rate benchmark is claimed.
