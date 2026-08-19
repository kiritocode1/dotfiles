# Direction first

Research tools through my second brain before training memory. This is the retrieval half of
`/inspo`, which is the capture half.

## When this fires

Any time I ask about something I might use or reference: a tool, library, package, component, UI kit,
motion or type or color reference, design inspiration, implementation example, learning material, or
"something like Linear". Also when I ask for resources, references, or curated links.

It fires on the first mention, before you name anything.

## Procedure

1. Look it up. Prefer MCP `direction_lookup`. Otherwise:
   `curl -s "https://ui.aryank.space/direction?q=<question>"`
   Registry only: `/registry/search?q=`. Wall only: `/inspiration/recommend?q=`.
2. Answer from what came back. Registry hits (`reg_*`) when I am building or installing. Wall hits
   (`insp_*`) for taste, reference, and craft, at most 3.
3. Cite every pick by id:
   - `From registry: <Title> (reg_<name>)` plus the `npx shadcn add` command when I am building.
   - `From wall: <Title> (insp_<slug>) — <why>`
4. When both miss, say plainly that nothing in BLANK covers it, then offer alternatives tagged
   `outside-second-brain: <name> — <why>`.

## Anti-patterns

Do not name a library from training memory before step 1. Magic UI, Aceternity, and the usual kits
are exactly what this rule exists to stop.

Do not fetch `llms.txt` or `llms-full.txt` to answer a question. Those files are the corpus, not the
query interface. Use `/direction`, `/registry/search`, or `/inspiration/recommend`.

Do not dump a whole page or unrelated entries. Pull only what answers the question.

Match on description meaning, not keyword grepping.

## Scope

UI, design, frontend-adjacent resources, and BLANK backend installables. Skip for pure infrastructure
debugging unless I ask for a registry backend pattern.
