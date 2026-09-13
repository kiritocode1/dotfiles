# Connect the recipes to real input

Use this after selecting a construction recipe. It covers the points where an attractive animation can implement the wrong interaction.

## Scroll has five different jobs

| Job | State | Construction |
| --- | --- | --- |
| Entering view starts an animation | `unseen -> revealing -> shown` | Observer starts a timed R1 reveal once |
| Scroll controls every intermediate frame | `p` between 0 and 1 | R4 renders transforms from progress |
| Crossing a boundary changes a project | Integer index | R3 runs when `floor(p * count)` changes |
| Fast scrolling bends or accelerates something | Velocity as well as position | Distortion or extra motion derived from delta over time |
| Completing a region navigates | Progress plus navigation state | Explicit completion action with a usable alternate control |

A `scrub` option alone does not make every callback tween scrubbed. Scroll Scrub Slider reads trigger progress to select an integer slide, then starts time-driven image and title tweens. Direct scrubbing requires a paused animation whose progress is set, or a render function like R4.

Find the real scroller. FullscreenPreview and studio previews can scroll an ancestor while the window remains stationary. Use that scroller for listeners, observers, viewport height, measurements and restoration. An animation working on a standalone page may otherwise fail inside its preview.

Choose pin duration from scene travel and reading time. Recompute after font or image changes. Preserve stable start and end values at progress 0 and 1. Test reverse, skipped phases, deep-link or restored scroll and resize in the middle.

Scroll-triggered navigation is an authored behavior, not a default for footers. Provide a visible next-project action. Reduced-motion or keyboard use must not require a three-viewport gesture to reach the destination.

## Click, press and focus are separate

A press animation acknowledges pointer down. The click commits an action. Completion confirms the result. Keep these separate so a failed operation cannot display a success check.

Use actual buttons for actions and links for navigation. Preserve focus-visible feedback independently of pointer hover. Keyboard activation follows the same action path. A drag ending over a link is not automatically a click.

For a full-frame click slider, localize the left/right split to the frame's rectangle. Exclude nested controls from that handler. Keep previous/next buttons available even when the frame itself accepts clicks. For video seeking, stop the seek event from also toggling playback.

For tabs, separate hovered, focused and selected items. Hover previews should not erase selection. Move a shared indicator using measured item geometry, and reserve label space when weight or text visibility changes. In active-label tabs, the label expansion and indicator width need to follow the same measurement updates.

## Hover previews and continuous pointers

Pointer enter starts a state transition. Pointer move updates a target. Pointer leave resets that target and clears the preview. Mixing all three into repeated entrance tweens causes queues and restarts.

Keep the hit region stationary. Animate an inner element. Map coordinates into the element's local space. A scaled ancestor requires converting viewport and layout distances consistently; the shared proximity hook explicitly accounts for this.

Use a focus or click path for useful preview content. Decorative trails can disappear on coarse pointers. Test capability with hover and pointer media queries, rather than treating a narrow window as proof of touch input.

For new followers, use elapsed time. `current += (target - current) * .1` on every frame converges twice as often on a 120 Hz display as on 60 Hz. Use `1 - exp(-rate * dt)` or convert a 60 Hz factor with `1 - (1 - factor) ** (dt * 60)`.

## Dragging and wheel input

At pointer down, stop the previous settle and capture the pointer. During dragging, the directly manipulated object follows the pointer. Secondary images or decorations may lag, but the handle itself should stay attached.

Use a small movement threshold for click suppression. On pointer cancel or lost capture, release drag state and settle without activating a destination. On release, use a current velocity estimate; a sample from before a long pause should not launch a fling.

Keep horizontal gallery input compatible with vertical document scrolling. Normalize wheel delta modes when building a wheel-based controller. A browser may report pixels, lines or pages. Do not suppress browser zoom gestures or hijack wheel events outside the intended region.

Bounds and snap destinations follow the measured content. Handle fewer items than fit, one item and empty input. With an infinite list, keep stable logical indices and bound live DOM or meshes. Returning to the beginning must not require traversing an ever-growing list.

## Routes, presence and layout

Choose one route-transition strategy: a cover timeline around the route commit, presence-driven outgoing/incoming layers, or the browser View Transition API. Do not stack all three accidentally.

With View Transitions, ensure the actual DOM update completes inside the update callback before its promise resolves. Do not assume a scheduled React state update has committed merely because the callback returned. Use the framework's supported integration or a deliberate synchronous commit when appropriate. Unsupported browsers navigate normally.

Keep route history, focus, scroll and data readiness separate from the decorative cover. An internal demo router that only changes component state is not a complete application router. Preserve modified link clicks and external navigation.

For exits, keep the visual node alive until its exit completes while making hidden interactive content inert. For changing layout, preserve object identity and measure the current appearance on interruption. Do not rebuild the whole collection merely to animate a selected state.

## Text, SVG and sequences

Keep one semantic reading of text. Hide decorative duplicates and reserve their geometry. Font readiness and wrapping are inputs to line splitting. Rebuild when the container changes; tear down old splits and observers.

A path's shape, cap and join are part of the animation. Trace actual path length. For a mask, distinguish the mask geometry from the moving content below it. For a stagger, calculate the last completion time and keep long collections from creating long waits.

A timeline should own its dependent callbacks. Track and cancel delayed jobs if the component leaves. A timer that removes a stale slide must not remove the newest slide after another interaction.

## Clocks, physics, shaders and media

Use seconds consistently in frame calculations. Clamp an abnormally large delta after suspension; reset the previous timestamp on resume. Direct manipulation, camera following and shader displacement can have different response rates but should share the same input state.

Suspend costly decorative loops when not visible. A CSS reduced-motion override does not stop a WebGL frame loop. Listen for preference changes, dispose textures and buffers, and guard asynchronous loads from mounting after teardown.

Tie media UI to media events, including failed playback, pause and ended. Tie progress UI to real work. Generated particles have a lifetime and a maximum count. A physics pile needs bounded collision geometry and a stop or suspension policy.

## Practice requests

These examples show what the skill should let an agent decide without another animation prompt. They are behavior expectations, not claims of an independent model evaluation.

| Request | Construction the agent should produce |
| --- | --- |
| "Build a project showcase where the image takes over as I scroll" | R4 sticky stage plus R7 shared geometry or R5 counter-zoom; a defined progress interval and complete reverse state |
| "Make this menu feel like the layered ones in BLANK" | R2 panel, surface and masked-link layers on one reversible progression, with origins and overlap specified |
| "Build an image gallery I can throw around" | R10 direct drag and release velocity plus R11 bounded recycling; click threshold and keyboard controls |
| "Have the text reveal as I read" | Choose observer-triggered R1 or scroll-controlled words from context; preserve semantic text and real line wrapping |
| "Make this page's hover treatment more expressive" | R8 local pointer mapping and a distinct preview construction, potentially R9 trails; not a generic lift on every element |
| "Add a changing background image with fluid distortion" | R16 texture sampling and displacement driven by R3's progress; actual shader or fluid solver when the effect requires it |
| "Build a settings panel" | Short shared-control feedback and measured selection movement; no full-screen curtain, scroll pin or decorative loader |
