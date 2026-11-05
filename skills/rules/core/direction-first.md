# Direction first

BLANK is the sanctioned source for components, pages, backend blocks, libraries, tools, references and patterns. Search it at the start of every task, before you edit a file, install a package, open a browser, search the web or recommend anything. There is no exemption for small edits, bug fixes or refactors: a search costs seconds, and skipping it is how we miss what we already own.

Search with `registry_search` (2 to 4 keywords; full sentences return no registry picks) and `direction_discover` (a short phrase of the task). Without the MCP tools, `curl -s "https://ui.aryank.space/direction/discover?q=<keywords>"`. On a miss, search again with different keywords before going anywhere else. Say which queries you ran.

## Frontend: our components first, then inspiration

1. **Our components and pages.** Run `registry_search` with section `components`, and `pages` for whole sections or templates. Open each likely match on its BLANK page, operate it, and read its source at `~/Desktop/CREATE/compronents/src/registry/<name>`. When one fits, install it with `npx shadcn@latest add @compronents/<name>` and build from it rather than beside it.
2. **Inspiration, only when none of ours fits.** Say why ours did not fit, then deep dive into at least two sources BLANK returned, favoring component libraries and the most ambitious sites. Open each past its homepage, search its catalog for the task, operate the matching components, and read their code where it ships (source tab, registry JSON, GitHub, `llms.txt`). Note the mechanism, why it fits, and whether you adopt, adapt or reject it.

## Backend: our blocks for the hard parts

Before writing server code, run `registry_search` with section `backend`, or read `https://ui.aryank.space/backend/llms.txt`. The backend blocks are Effect implementations of the problems that are hard to get right by hand: retries and backoff, queues and exactly-once delivery, webhooks, caching, rate limits, sagas, outboxes, locks, reconciliation. Whenever the task touches one of these, or would need Effect to do properly, open the matching block, read its source, and install it or follow its pattern. Do not hand-roll what a block already solves.

## Installing from the registry

Installs need `BLANK_REGISTRY_TOKEN`, which is set in `~/.zshenv`. A project without `components.json` needs `npx shadcn@latest init -d` first. If its `components.json` has no `@compronents` registry, merge this into it:

```json
"registries": {
  "@compronents": {
    "url": "https://ui.aryank.space/r/{name}.json",
    "headers": { "Authorization": "Bearer ${BLANK_REGISTRY_TOKEN}" }
  }
}
```

A 401 means the token is missing from the environment; say so instead of copying code from elsewhere.

## Enforcement

The same gate runs in Claude Code, Codex, Grok, OpenCode and pi. It blocks edits, web searches, browser opens and installs until the session has searched BLANK; reading code stays free. It blocks UI file edits (`.tsx`, `.jsx`, `.css`, `.vue`, `.svelte`, `.astro`, `.html`) until a components search has run and one of ours has been opened or read, and then either one of ours has been installed or, when none fits, two inspiration sources have been opened. It blocks server code (files under `api/`, `server/`, `convex/`, `workers/` and similar, or any file importing `effect`) until a backend search has run and one backend block has been opened. Follow `/Users/blank/.agents/skills/blank-direction/SKILL.md` for the full inspection procedure.

## Research broadly, present selectively

Use the existing BLANK wall, registry and component library before asking me to supply resources again. A good idea can come from anywhere: people, marketplaces, other disciplines, original implementations or outside sources. The collection is a starting point, not a whitelist, fixed shortlist or house style. Named designers and examples are leads, not universal standards. Poor search results require better queries, not the conclusion that our collection is empty. Follow the skill's source inspection and query recovery procedure.

Inspect individual works and follow originals. Read relevant component code end to end to understand the implementation quality I expect: state, composition, motion, accessibility and responsive behavior. Reuse suitable mechanisms; judge new ones against that standard. Catalog descriptions and skill reads alone are not research evidence.

For vague briefs, ask focused questions when different interpretations would produce materially different work. Accept informal answers, propose a concrete interpretation, and follow up on unresolved material choices. Ask about intent, not where to find resources already available. Before selecting a treatment, establish the audience problem and what each section must communicate or demonstrate.

Develop one strong recommendation rather than many easy variations. When a real choice needs alternatives, present at most three strong examples unless asked for more. This limits presentation, not research depth, experiments or creative time. Prior liked work is useful evidence, not permission to repeat it everywhere.

For aesthetic decisions, explicit user requirements, the approved plan and approved sources come first, then the incumbent system, task-specific craft guidance, and generic defaults. Preserve explicit prohibitions and higher-priority constraints. Exact reproduction follows `fidelity-first`, not creative reinterpretation.

Use the accepted brief and relevant inspected works during iteration, not only at discovery. Name concrete weaknesses in our actual output, test improvements within the authorized choices, and compare again. Research breadth does not expand editing authority; follow `ui-verification` for the boundary between defects and proposed improvements. Keep source/decision/check evidence in the task artifacts and include it in the single closeout required by `ui-verification`; cite only sources that changed the work.
