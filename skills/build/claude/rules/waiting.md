# Waiting

Never poll with a bare `sleep`. The harness has purpose-built waiting tools, and they report what
actually happened instead of guessing at a duration.

Measured across 200 transcripts: 751 `sleep` calls against 2 `Monitor` calls. No rule pointed at the
alternative, so the shell won by default.

## What to reach for

One notification when a condition becomes true: `Bash` with `run_in_background`, running a command
that exits on that condition. `until grep -q "Ready in" dev.log; do sleep 0.5; done` ends by itself
and notifies once.

One notification per occurrence: `Monitor`, with a filter tight enough that every line is worth
reading. Cover the failure signatures, not only the success marker. A monitor watching for
`"Compiled successfully"` alone stays silent through a crash loop, and silence looks identical to
still running.

A UI element appearing, disappearing, or changing text: `await-ui-element`. A screen settling after
navigation: `await-screen-idle`. Both block on the real condition instead of screenshotting on a
timer.

## Where `sleep` still belongs

A short fixed pause inside a single command chain, where there is no condition to watch and no
notification wanted. `sleep 0.5` inside an `until` loop is correct. `sleep 30` as a tool call of its
own is the pattern this rule exists to stop.
