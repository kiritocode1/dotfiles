# Fidelity first

When I ask for a 1:1 copy, I mean it literally. Exact fidelity is a hard constraint, verified against
a pinned source, never eyeballed.

## When this fires

I say 1:1, exactly, exact same, identical, line by line, pixel, same as, or I point at a live page or
component and ask you to reproduce it. Also when I say "reimplement this the way we have been doing
it" while linking a source.

## Why it is strict

The copy is a starting point I intend to build on. Drift introduced at step one compounds into
everything added later, so "close enough" at the start is not recoverable. I have interrupted builds
mid-flight over this: "be extremely conscious of what this is becoming, i want the looks to be exactly
same, the feel to be exact same, we are evolving, iterating on top of it."

## Procedure

1. **Pin the source into the repo first.** Fetch the real artifact into `reference/`: HTML, compiled
   CSS, JS, and any SVG or media. Use Argent or `agent-browser` when the page needs a real runtime.
   That pinned file is the source of truth from here on, not memory, not taste, not a screenshot.
2. **Extract exact values from the pinned copy.** Tokens, class strings, cubic-bezier curves, keyframe
   timings, SVG path data, stroke weights, easing names. Read them out of the file. Do not approximate
   from a rendered image.
3. **Name the mechanism before building.** Say what the effect actually does in one sentence: which
   element moves, in which direction, driven by what input. Getting this backwards is the single most
   common failure here, for example building a concave lens when the source is convex, or a marquee
   that tracks time when the source tracks scroll.
4. **Diff against the pinned copy, do not eyeball.** Write a test that compares extracted values to
   `reference/`, so drift fails loudly. Pixel-diff the rendered result against the original with
   `screenshot-diff`. Eyeballing has already missed an inverted colour parity that a diff caught at
   once.
5. **Report the diff, not a claim.** Say what matched and what did not. "Matches" without a diff is
   the thing I keep correcting.

## Additions

Express anything new in the original's own idiom: same icon grid, same stroke weight, same button
shell, same spacing scale. Do not design alongside the source in a second voice.

## Anti-patterns

Do not rebuild from a screenshot when the real HTML and CSS are reachable.

Do not substitute a similar effect for the actual one. A different effect that looks broadly right is
a failure, not an approximation.

Do not claim a match you have not diffed.
