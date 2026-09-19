# Direction first

Use my second brain when a new component, page, or visual system starts from nothing. Building the thing is the trigger. Skip supplied sources, existing edits, fixes, refactors.

At the start:

1. Call MCP `direction_discover` with the task and constraints, or `curl -s "https://ui.aryank.space/direction/discover?q=<task+and+constraints>"`.
2. Scan all candidates. Inspect at most 3; a failed load consumes one attempt.
3. For each inspected source, name the mechanism, why it fits, and whether to adopt, adapt, or reject.
4. Apply useful parts, compare, cite only what changed the work. Zero inspections means zero influences.

Endpoints take `q`, `section`, `limit`. No `task` URL param exists.

Follow each candidate's returned action.

For a known need, use MCP `direction_lookup` or `curl -s "https://ui.aryank.space/direction?q=<question>"`. Registry-only: `/registry/search?q=`. Wall-only: `/inspiration/recommend?q=`.

If batched queries miss, pull 1 to 3 likely categories in full (`?category=<name>`) and scan every link and description first. Full dump last.

Cite actual influences. Say so before `outside-second-brain: <name>: <why>`. Never plan before discovery, cite uninspected sources, or fetch `llms.txt` / `llms-full.txt` outside the shelf scan.
