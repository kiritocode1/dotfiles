# Direction first

Use my second brain before planning work with open UI, frontend, component, library, tool, or craft
choices. BLANK is a working library, not a list to cite after the plan is already decided.

## When this fires

Run proactive discovery when a new component, page, or visual system starts from nothing. Building
the thing is the trigger. Editing something that already exists is not, however many choices the edit
involves.

Fires on: a new component, a new page or route, a new visual system, a restyle that replaces the look
rather than adjusting it, or a library or tool choice with no incumbent.

Does not fire on: spacing, color, or copy changes to something already built, bug fixes, refactors,
or anything where I named the exact source. Use exact lookup there, when the need is concrete.

Measured across 200 transcripts: `direction_discover` fired twice. The old trigger asked for a
judgment on every decision, so it never resolved to a moment. This one names one.

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

## When a query misses

One query returning nothing means the phrasing missed, not that BLANK is empty. Never stop on one
attempt. Send 4 to 6 phrasings at once, in parallel, before concluding anything:

```bash
for q in "command menu" "settings page" "app shell sidebar" "dashboard layout"; do
  curl -s --get --data-urlencode "q=$q" "https://ui.aryank.space/registry/search" &
done; wait
```

Vary the axis, not the wording: the task in my words, the component noun, the surface it sits on, the
stack, the style. Measured on one run against the same registry in the same minute, "command menu"
and "settings page" returned 5 installables each while "dashboard shell", "sidebar navigation",
"empty state", and "login form" returned none. Discovery ranking moves the same way, so a candidate
sitting in "Use now" for one phrasing lands in "Study mechanics" for another.

Then filter what comes back. A hit can match a word rather than the need, which is how "data table"
surfaces backend installables. Drop those before citing them.

Shape the query to what you want back. A long prose task returns wall references, a short noun phrase
returns installables. Measured on the same backend section in the same minute, the sentence "Design a
multi-tenant rate limiter and job queue for a Cloudflare Workers API" returned 10 `insp_*` and zero
`reg_*`, while "rate limiting", "queue worker", and "durable object" returned 4, 5, and 4 `reg_*`.
Send both: the full task for direction, short nouns for things to install.

Only after a batch across discover, lookup, and both single-side endpoints comes back empty may you
say BLANK missed and reach for `outside-second-brain:`.

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

Three sections, all first class: `components`, `pages`, `backend`. Pass `section` to narrow, or leave
it off for everything.

```bash
curl -s --get --data-urlencode "q=rate limiting" --data-urlencode "section=backend" \
  "https://ui.aryank.space/registry/search"
```

Backend fires on the same terms as UI. Picking how to do rate limiting, a job queue, auth sessions,
tenant isolation, migrations, caching, websockets, or a Durable Object pattern is a choice with
installables behind it: `reg_durable-object-rpc-rate-limit`, `reg_effect-sliding-window-rate-limit`,
`reg_effect-durable-workflow-queue`, `reg_bun-sqlite-job-queue`, `reg_turso-tenant-migration-fanout`
all exist today.

Skip only when there is no choice left to make, such as debugging why existing code throws.
