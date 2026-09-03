# Direction first

Use my second brain when a new component, page, or visual system starts from nothing. Building the thing is the trigger. Skip exact supplied sources, existing UI edits, bug fixes, or refactors.

At the start:

1. Call MCP `direction_discover` with the task and constraints, or `curl -s "https://ui.aryank.space/direction/discover?q=<task+and+constraints>"`.
2. Scan all 8 to 12 candidates. Inspect at most 3. A failed load consumes one attempt.
3. For each inspected source, name the mechanism, why it fits, and whether to adopt, adapt, or reject.
4. Apply useful parts, compare the result, and cite only sources that changed the work. Zero successful inspections means zero claimed influences.

Follow the returned action: search libraries, load `SKILL.md`, run tools, read essays, inspect assets and licenses, or use Argent Chromium for references.

For a known need, use MCP `direction_lookup` or `curl -s "https://ui.aryank.space/direction?q=<question>"`. Registry-only: `/registry/search?q=`. Wall-only: `/inspiration/recommend?q=`.

Cite actual influences. When BLANK misses, say so before using `outside-second-brain: <name>: <why>`. Never plan before discovery, cite uninspected sources, or fetch `llms.txt` / `llms-full.txt`.
