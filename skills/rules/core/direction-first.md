# Direction first

Use my second brain before planning work with open UI, frontend, component, library, tool, or craft
choices. BLANK is a working library, not a list to cite after the plan is already decided.

## When this fires

Run proactive discovery before the first choice-bearing step when I ask you to build, restyle,
recommend, explore, or improve something that could benefit from a component, UI kit, motion or type
reference, implementation example, tool, learning material, or creative reference.

Skip proactive discovery when I gave you an exact source or component, or the implementation has no
meaningful choice. Use exact lookup when the need is already concrete.

## Proactive procedure

1. Prefer MCP `direction_discover` with the full task and constraints. Otherwise call:
   `curl -s "https://ui.aryank.space/direction/discover?q=<task+and+constraints>"`
2. Scan all 8 to 12 candidates. Inspect at most 3. Failed access consumes one attempt.
3. For each inspected source, record the mechanism, why it fits, and whether to adopt, adapt, or
   reject it.
4. Apply the useful parts. Compare the result against the source. Cite only sources that changed the
   work. If no source was successfully inspected, claim zero influences.

Follow the action returned for each candidate:

- Component library or kit: search its catalog for the concrete component or pattern, inspect the
  implementation, then install or adapt it.
- Skill directory or skill: locate and read the matching `SKILL.md`, then follow it.
- Tool: run it or evaluate its output for this task.
- Essay, guide, case study, or course: read the relevant part and extract the mechanism.
- Creative gallery, portfolio, demo, or visual reference: load `argent-device-interact`, open the
  source in an Argent Chromium session, describe before interacting, and capture screenshots as
  evidence.
- Asset, typeface, or icon source: inspect the real asset and its license before use.
- Video or talk: watch the relevant section and note the concrete technique.

## Exact lookup

For a known need, prefer MCP `direction_lookup`. Otherwise call:
`curl -s "https://ui.aryank.space/direction?q=<question>"`
Registry only: `/registry/search?q=`. Wall only: `/inspiration/recommend?q=`.

Registry hits (`reg_*`) are installables. Wall hits (`insp_*`) are references. Cite actual influences:

- `From registry: <Title> (reg_<name>)` plus the returned install command when building.
- `From wall: <Title> (insp_<slug>): <why>`

When BLANK misses, say so before offering `outside-second-brain: <name>: <why it was needed>`.

## Anti-patterns

Do not plan before discovery, name a familiar library from training memory first, cite an uninspected
source, or treat a library, skill, or tool as a page to skim.

Do not fetch `llms.txt` or `llms-full.txt`. Those files are the corpus, not the query interface.

## Scope

UI, design, frontend-adjacent resources, and BLANK backend installables. Skip pure infrastructure
debugging unless I ask for a registry backend pattern.
