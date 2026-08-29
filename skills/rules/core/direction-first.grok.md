# Direction first

Use my second brain before planning work with open UI, frontend, component, library, tool, or craft
choices. Skip this only for an exact supplied source or a fixed implementation with no real choice.

Before the first choice-bearing step:

1. Call MCP `direction_discover` with the task and constraints, or
   `curl -s "https://ui.aryank.space/direction/discover?q=<task+and+constraints>"`.
2. Scan all 8 to 12 candidates. Inspect at most 3. A failed load consumes one attempt.
3. For each inspected source, name the mechanism, why it fits, and whether to adopt, adapt, or reject.
4. Apply the useful parts, compare the result, and cite only sources that changed the work. Zero
   successful inspections means zero claimed influences.

Follow the returned action. Search component libraries for the concrete component. Load a skill's
`SKILL.md`. Run tools. Read essays. Inspect real assets and licenses. For creative references, load
`argent-device-interact` and curate them in an Argent Chromium session.

For a concrete known need, use MCP `direction_lookup` or
`curl -s "https://ui.aryank.space/direction?q=<question>"`. Registry-only search is
`/registry/search?q=`. Wall-only search is `/inspiration/recommend?q=`.

Cite actual influences as `From registry: <Title> (reg_<name>)` or
`From wall: <Title> (insp_<slug>): <why>`. When BLANK misses, say so before using
`outside-second-brain: <name>: <why it was needed>`.

Never plan before discovery, name a familiar library from memory first, cite an uninspected source,
or fetch `llms.txt` or `llms-full.txt` as a query interface.
