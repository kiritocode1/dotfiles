<!-- GENERATED FILE. DO NOT EDIT.
     Source: dotfiles/skills/rules/
     Rebuild: dotfiles/skills/bin/build && dotfiles/skills/bin/install
     Editing this file directly loses your changes on the next build. -->


# Please remove all mannered prose.

Mannered prose substitutes metaphor and flourish for direct statement. Instead
of "a parameter worth varying," the mannered writer produces "a dial worth
turning." Instead of "this point still matters," they write "this point earns
its keep."

The phrases exist to display the writer, not to convey the idea, and readers can
tell. That is why mannered prose irritates: it makes the reader work harder so
the writer can perform.

It is also imprecise. Metaphors drag in connotations the writer did not choose
and cannot control.

The fix is to say what you mean. When a literal phrase is available, use it.

# About me

Hii, im Aryan (https://tldr.aryank.space), you're my agent x (https://tldr.aryank.space).

BACKEND AND PLATFORM-FOCUSED ENGINEER WITH 4+ YEARS OF EXPERIENCE BUILDING PERFORMANCE-SENSITIVE
SYSTEMS, EDGE INFRASTRUCTURE, AND PRODUCTION-GRADE WEB APPLICATIONS.

STRONG BACKGROUND IN SYSTEM DESIGN, OPTIMIZATION, AND DEVELOPER TOOLING, WITH HANDS-ON EXPERIENCE
ACROSS CLOUD, EDGE, AND ON-DEVICE ENVIRONMENTS.

ENJOYS FRONTEND-HEAVY WORK AND HAS STRONG PRODUCT SENSE AND UI/UX EXECUTION, BRIDGING DESIGN AND
ENGINEERING.

I'm a highly visual person, always looking for new ways of productive work.

I love to build. I focus on building complex things as simple as possible. I love to find ways to
reduce complexity when solving problems.

I treat agent verification as engineering infrastructure. Agents should be able to operate the real
product, inspect what happened, and keep working until they have evidence that the result is correct.
The codebase is the source of truth, with compact maps and tools that help agents navigate it without
guessing.

I wanted to share some of my preferences here so we can be more aligned as we work together.

## Coding preferences

- Keep things simple. Channel "yagni" energy unless told otherwise.
- Typesafety is useful, take advantage of it.
- Don't be scared to propose bold ideas if they can meaningfully benefit our work.
- Be careful with destructive actions that are not explicitly requested by the user.
- Tests are good! Endless smoke tests, "regression tests" for feature deletions, etc, much less good.
  Tests should be focused, not slop.
- Comments are a great way to clarify functionality and how code is used. Don't comment every line,
  but feel free to describe (concisely) how functions are used above function definitions, classes,
  etc.
- Keep comments up to date! When making changes, it's important to keep things in sync.

## Coding preferences (TypeScript focused)

- `any` is the enemy. Inferred types are our friend. Our systems should adapt to changes, instead of
  requiring changes everywhere.
- If your TS code looks like a Python dev wrote it, it is bad TS code.
- Avoid one-line functions that are just casting wrappers.
- Write TypeScript in ways that Matt Pocock and Theo would be proud of.
- If not already specified in project, I generally like to use the following tech: Convex, Tailwind,
  React, Vite, pnpm.
- When building more complex web and react native apps, I like to pull in Zustand, React Query,
  Tanstack Start, Clerk (or better-auth if selfhosting), and ArkType (or zod if perf isn't an issue).

I really respect good Effect code, specifically useful when mixed with patterns from
https://www.effect.website/ and https://www.effect.solutions/.

## Design preferences

- Never use the northeast/up-right arrow, U+2197, anywhere in my design work. This includes
  buttons, links, cards, CTAs, external-link indicators and decorative graphics, across all projects.
  Do not recreate the same shape with SVGs, icon libraries, CSS, images or rotated arrows.
  Use plain labels instead, even when a reference design uses this arrow.

## Agent workflow preferences

- Give agents the tools to close their own verification loop. A task is not done because the code
  compiles. The agent should operate the product, inspect runtime state, and show evidence suited to
  the change, such as screenshots, traces, logs, or focused test output.
- Treat each active product's verification skill as critical infrastructure. Keep it tested, improve
  it when a workflow is awkward, and maintain it frequently so it matches the current product.
- Prefer a small, app-specific control CLI over markdown instructions or throwaway interaction
  scripts. It should cover health checks, inspection, navigation, interaction, screenshots,
  performance traces, network and console logs, feature flags, waiting, and cleanup where relevant.
- Make control CLIs easy for agents to use: composable subcommands, gradual disclosure through
  subcommands, rich `--help`, machine-readable output, specific recovery-oriented errors, and
  `--dry-run` for actions with destructive side effects.
- Make the development environment reproducible. Document and automate dependency setup, app
  startup, seeded data, test users and auth, feature flags, and test or staging API configuration.
- Keep a searchable Feature Map beside the verification skill. Describe each feature from the user's
  point of view, how to reach it, exact control commands, account or entitlement conditions, and
  recovery steps for known gotchas. Link detailed feature files from a short index.
- Treat the Feature Map as a compact projection of the codebase, not an independent source of truth.
  Update it alongside product changes and run regular maintenance to catch drift.
- Once one agent can produce a verified change reliably, parallelize in isolated environments. Prefer
  cloud agents for high parallelism when available, and use local worktrees when they are the simpler
  fit. Keep coordinator agents free to supervise, review evidence, and dispatch follow-up work.
- Measure performance before and after a targeted change. Use repeated independent runs when results
  are noisy instead of treating one trace as proof.
- Reuse mature verification flows in routines and automations. Reproduce incoming user reports first;
  only consider automatic fixes when reproduction and verification are reliable.

## Questions are read-only

- A question is a request for an answer, not for changes. If the message opens with "how hard would
  it be", "what are your thoughts", "why does", "should we", "is it possible", "can X do Y", or
  otherwise asks rather than instructs: answer it, and do not edit files.
- If the answer is obvious and the change is trivial, still answer first and offer the change. Ask
  before making it.

## Match ceremony to the task

- Do not spawn subagents or a multi-agent panel for work a single agent finishes in one pass.
  Delegation is for breadth or adversarial review, not for ordinary tasks.
- When several agents do work in parallel, state file ownership up front so they do not collide.

# Unslop

Cut AI tells from any writing. This always applies, to prose and to code comments and to
commit messages. Vendored from poteto/plugins pstack `unslop`; edit upstream, not here.


Edit text to remove AI patterns and add human voice.

## Process

1. Scan for the patterns below.
2. Rewrite. Preserve meaning, match intended tone.
3. Add soul (see next section).
4. Self-audit: "What makes this obviously AI generated?" Fix remaining tells.

## Adding soul

Removing patterns is half the job. Sterile, voiceless writing is just as obvious.

- **Have opinions.** React to facts instead of neutrally listing pros and cons.
- **Vary rhythm.** Short sentences. Then longer ones that take their time. Mix it up.
- **Acknowledge complexity.** "Impressive but also kind of unsettling" beats "impressive."
- **Use "I" when it fits.** First person isn't unprofessional.
- **Let some mess in.** Perfect structure feels algorithmic.
- **Be specific.** Not "this is concerning" but "there's something unsettling about agents churning away at 3am."

## Patterns to detect and fix

### Content

1. **Significance inflation.** "pivotal moment", "testament to", "evolving landscape", "setting the stage for", "indelible mark", "deeply rooted". Cut puffery, state what happened.
2. **Notability name-dropping.** Listing media outlets without context. Pick one, say what was said.
3. **Superficial -ing phrases.** "highlighting...", "ensuring...", "reflecting...", "showcasing...", "fostering...". Delete or expand with real sources.
4. **Promotional language.** "nestled", "vibrant", "breathtaking", "groundbreaking", "renowned", "stunning", "must-visit". Use neutral descriptions.
5. **Vague attributions.** "Experts believe", "Industry reports suggest", "Some critics argue". Name the source or delete.
6. **Formulaic challenges.** "Despite challenges... continues to thrive." Replace with specific facts.

### Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, vibrant. Replace with plain words.
8. **Copula avoidance.** "serves as", "stands as", "boasts", "features". Just say "is" or "has".
9. **Negative parallelisms.** "It's not just X, it's Y." State the point directly.
10. **Rule of three.** Forcing ideas into groups of three. Use the natural number.
11. **Synonym cycling.** Protagonist, main character, central figure, hero all in one paragraph. Pick one, repeat it.
12. **False ranges.** "from X to Y" where X and Y aren't on a meaningful scale. List topics directly.

### Style

13. **Em dash overuse.** Avoid em dashes entirely. Use periods or commas only (no parentheses, no en dashes, no hyphen-as-dash substitutes). Em dashes are an AI tell, and reaching for parentheses instead just trades one tell for another. If a thought needs separation, end the sentence or use a comma.
14. **Colon overuse.** Colons are fine before a list or example. Not as mid-sentence connectors. "If you're coming from traditional automation: instead of registering event handlers, you describe conditions" adds nothing with the colon. Rewrite to let the point stand on its own without comparison framing. "Describing when the scheduler should fire works best as plain English." Same meaning, no crutch punctuation.
15. **Boldface overuse.** Don't bold every proper noun or acronym.
16. **Inline-header lists.** The tell is a bold label and colon that restates the line: "**Performance:** Performance improved...". Convert those to prose. A bold lead-in that ends in a period, names the item, and is followed by genuinely new detail ("**Schema in TypeScript.** Tables live in one file.") is fine, not a tell.
17. **Title case headings.** Use sentence case.
18. **Decorative emojis.** Remove from headings and bullets.
19. **Curly quotes.** Replace with straight quotes.

### Communication artifacts

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of course!", "Certainly!", "Found the smoking gun!" Remove.
21. **Cutoff disclaimers.** "While specific details are limited..." Find sources or remove.
22. **Sycophantic tone.** "Great question! You're absolutely right!" Respond directly.

### Filler

23. **Filler phrases.** "In order to" becomes "To". "Due to the fact that" becomes "Because". "It is important to note that" gets deleted.
24. **Excessive hedging.** "could potentially possibly be argued that it might" becomes "may".
25. **Generic conclusions.** "The future looks bright." State specific plans or facts.

### Jargon

26. **Abstract metaphor nouns.** Substrate, wedge, vector, locus, vantage, nexus, primitive (as noun), harness (as metaphor), surface (as in "API surface"), bedrock, scaffolding (as metaphor), modality, paradigm, gold-plating. These read as technical but usually have a plainer concrete word. "Substrate" becomes "base". "Wedge in" becomes "add". "Vector" becomes "way" or "method". "Gold-plating" becomes "more than the job needs". Pick the concrete word.

### Plain speech

27. **Say the concrete thing.** Don't wrap a simple point in abstract framing, and don't describe how something feels instead of what it does. "the database stays close at hand", "SQL you can read", "types that follow your schema" name a feeling. The fix names the mechanism or a number: "`.toSQL()` returns the exact string sent to the database", "a column rename fails the build". Ask what the sentence tells the reader to do or know, then write that. If you can't restate it as a concrete instruction, fact, or number, cut it.
28. **Shorten or split dense sentences.** If the reader has to backtrack to parse a sentence, break it in two or drop clauses. One idea per sentence.
29. **Active voice.** Prefer it. Catch "is/are/was/were + past participle" and name the actor: "queries are validated" becomes "the compiler validates queries", "the file is parsed by the loader" becomes "the loader parses the file". Passive is fine only when the actor is unknown or genuinely doesn't matter.
30. **Cut adverbs, or use a stronger verb.** "runs quickly" becomes "is fast" or the number. "significantly improves" becomes the measured delta. An adverb propping up a weak verb means the verb is wrong.
31. **Prefer the plain word.** "utilize" becomes "use", "leverage" becomes "use", "facilitate" becomes "help", "numerous" becomes "many", "in the event that" becomes "if". The fancier synonym is rarely clearer.

# Aryan voice

Before writing or editing website copy, component text, client replies, emails, or paste-ready wording, load the `aryan-voice` skill. This includes copy written during UI implementation. If skill discovery misses it, read `/Users/blank/dotfiles/skills/skills/aryan-voice/SKILL.md`. Follow its voice guide and relevant examples before drafting.

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

## Call shapes

Every endpoint takes `q` with the full text, URL-encoded. There is no `task`
URL parameter. The MCP tools use different input names for the same idea:
`direction_discover` takes `{ "task" }`, the rest take `{ "query" }`.
`section` is one of `components`, `pages`, or `backend`; leave it off for
everything. `limit` widens the pool. Recommend returns at most 3 picks, search
about 12, more with `limit=25`.

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

Only after a batch across discover, lookup, and both single-side endpoints comes back empty, stop querying and read instead. Pull the one to three most plausible categories in full and scan every link with its description for anything that might work:

```bash
curl -s "https://ui.aryank.space/inspiration/search?category=Component%20demos%20and%20micro-interactions"
```

URL-encode the category name. One category fits in context where the whole corpus does not; the small index at `/inspiration/llms.txt` lists all 51 with counts. The full dump at `/inspiration/llms-full.txt` holds everything at around 500KB and truncates on fetch, so it is the last resort: shelves first, full dump only when no shelf fits. Only then may you say BLANK missed and reach for `outside-second-brain:`.

## Exact lookup

For a known need, prefer MCP `direction_lookup`. Otherwise call:
`curl -s "https://ui.aryank.space/direction?q=<question>"`
Registry only: `/registry/search?q=`. Wall only: `/inspiration/recommend?q=`.

Registry hits (`reg_*`) are installables. Wall hits (`insp_*`) are references. Cite actual influences:

- `From registry: <Title> (reg_<name>)` plus the returned install command when building.
- `From wall: <Title> (insp_<slug>): <why>`

Verify each pick still fits before recommending it. A catalog line is a lead, not an influence.

When BLANK misses, say so before offering `outside-second-brain: <name>: <why it was needed>`.

## Anti-patterns

Do not plan before discovery, name a familiar library from training memory first, cite an uninspected
source, or treat a library, skill, or tool as a page to skim.

Do not fetch `llms.txt` or `llms-full.txt`. Those files are the corpus, not the query interface. The whole-shelf scan above is the only exception.

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

# Read before edit

Read the whole thing before you change part of it.

pstack's `principle-fix-root-causes` covers debugging. This covers editing, where the file compiles,
nothing is obviously broken, and you change a piece of it anyway without having read the rest.

## When this fires

Before the first edit to any file you have not read end to end in this session. Also before editing a
component whose behavior I described as wrong, since the cause is usually somewhere you have not
looked.

## Procedure

1. Read the file end to end. Not a grep window, not the function you think is responsible. If it is
   too large to read whole, read it in full passes and say which parts you skipped.
2. Follow the values you are about to change to where they come from and where they go. A token, a
   prop, a class string, or a state variable usually has a source and other consumers.
3. Say what is causing the behavior before proposing the fix. One sentence. If you cannot write that
   sentence, you have not read enough.
4. Then edit, changing only what that sentence names.

## Anti-patterns

Do not edit a file you have only seen through search results.

Do not fix a symptom in the component where it appears when the value arrives from somewhere else.

Do not rewrite surrounding code you did not need to touch. What was already right stays right. I have
corrected this exactly: "what you did for all 92 products were perfect. I asked you to remove ui that
was explaining the ui, but the ui was perfect."

Do not guess at cause. "Read the entire component first, figure out why this happens" is the
correction this rule exists to prevent.

# UI verification: Argent or Agent Browser

Two different tools. Pick by surface, not by habit. Argent drives devices, native and RN apps, and
Chromium runtimes already on CDP. Agent Browser is the web-page CLI.

## Decision, first match wins

1. **Argent** (MCP `mcp__argent__*`). The thing under test is an iOS simulator, Android emulator,
   physical Android device, React Native app (Metro, Hermes, component tree, profilers), native iOS
   or Android app, Electron app, Apple TV or Android TV or Vega (Fire TV), or a Chromium browser
   already exposing CDP (`chromium-cdp-*` in `list-devices`). Also Argent when the request says
   simulator, emulator, device, tap, swipe, Metro, permissions, or "on the phone".
2. **Agent Browser** (CLI `agent-browser`). The thing under test is a public URL, a local web app with
   no device in play, live-page evidence after fetch and search both failed, or a disposable Chrome
   session (auth vault, HAR, `eval`, cloud browsers).
3. Both could work, for example a local Next or Vite app on desktop. Use Agent Browser for a fast
   web-only check against the named `https://<name>.localhost` URL. Switch to Argent the moment a
   simulator, emulator, RN runtime, real device, or Electron and CDP Chrome enters the picture.

Do not use `agent-browser -p ios` or Appium Safari as a substitute for Argent. That path drives Safari
web pages on a simulator. It cannot launch native apps, describe UIKit, grant permissions, or talk to
Metro.

Do not use Argent to open a random public URL unless a CDP Chrome session is already the intended
surface.

## Argent workflow, devices and CDP apps

Follow the Argent skills, starting with `argent-device-interact`. Argent is available when
`mcp__argent__*` tools are present or `command -v argent` succeeds. When Argent is absent, say so once
and ask whether to continue without it.

1. `list-devices`. Prefer devices already running. Do not boot a second simulator when one matching
   the platform is already up.
2. Boot only when nothing matching is ready, with `boot-device`.
3. `launch-app` or `open-url`. Never tap home-screen icons.
4. Discover before every tap: `describe` on iOS, Android, and Chromium, or `debugger-component-tree`
   on React Native. Never derive tap coordinates from a screenshot.
5. Interact through gesture, keyboard, or `run-sequence`, using coordinates or refs from that
   discovery.
6. Screenshot for a baseline, for visual proof, or after a delay. Not as the navigation method.
7. Report the device, the app bundle id or URL, the flow exercised, and any failures.

Do not call `xcrun simctl`, raw `adb`, or simulator-server directly for anything Argent covers.

## Agent Browser workflow, web pages

1. `agent-browser open <url>`
2. `agent-browser wait --load networkidle`, or wait on a specific element or URL.
3. `agent-browser snapshot -i`
4. Interact through snapshot refs (`@e1`, `@e2`) or semantic locators (`find text`, `find label`,
   `find role button --name`).
5. Re-snapshot after any navigation, modal, submit, or dynamic DOM change. Refs go stale.
6. Screenshot when layout, responsive behavior, or rendering correctness matters.
7. `agent-browser close`, or `close --all`, when the task finishes.

Use fixed waits only as a last resort.

## After starting a local dev server

Confirm the app loads on the surface that matches the product.

Web-only desktop goes to Agent Browser against the named portless URL. Mobile, RN, simulator,
emulator, Electron, or CDP Chrome goes to Argent.

Report the exact URL or the device plus app, the flow, and any failures.

---
description: Argent iOS Simulator and Android Emulator Agent, always-on guidance for methodology and tools for working with, interacting, testing and profiling mobile app work
alwaysApply: true
---

<description>
If argent is installed and configured in this environment, its MCP tools are the preferred form of interaction with the application for iOS simulator, Android emulator, Chromium (CDP) app, and Vega (Amazon Fire TV) device control; otherwise see `<availability_check>` below before attempting any argent workflow. A "Chromium (CDP) app" is any Chromium runtime exposing a Chrome DevTools Protocol endpoint: an Electron app, or any Chromium-family browser (Chrome/Brave/Edge) launched with `--remote-debugging-port`; all are driven through the same tool surface and tagged `platform: "chromium"`. A "Vega device" is a virtual device (VVD) or physical unit, driven by tv-remote (D-pad) and tagged `platform: "vega"`.
Running MCP server and managing the Argent toolkit utilises `argent` command - if asked use `argent --help` for reference.
To check current version of MCP server run `argent --version` command.

Use cases:

- User mentions iOS simulator, Android emulator, device, or app interaction
- The app user is working with is a mobile application which can be run in a simulator/emulator
- Any tapping, swiping, typing, screenshotting, or inspecting a running app
- Any code change that affects visible mobile UI, layout, styling, copy, navigation, or screen composition
- Any request to execute manual QA, UI QA, or visual behavior validation for a mobile app
- Running, debugging, or testing a React Native app (iOS, Android or Vega)
- Profiling performance or diagnosing re-renders in a React Native app (iOS or Android)
- Running, debugging, or testing a Chromium (CDP) app: an Electron app (boot with `boot-device` + `electronAppPath`) or a Chromium browser exposing CDP (auto-discovered on port `9222` / `ARGENT_CHROMIUM_PORTS`); on Chromium scroll with `gesture-scroll` and drag with `gesture-drag`. `gesture-swipe` is touch-only
  </description>

<availability_check>
<important>Run this check once per session, before the first argent tool call or `argent` command. Do not re-probe before later calls.</important>

Confirm argent is available:

1. Are `mcp__argent__*` tools in your tool list? If none are present, argent is not available.
2. If still unsure, run `command -v argent`. A non-zero exit means the CLI is not on PATH.

If argent IS available, ignore the rest of this block and follow this rule normally.

If argent is ABSENT, treat it as an expected state, not an error to retry. Do not call `mcp__argent__*` tools, do not run `argent` commands, and do not attempt any argent workflow. Tell the user once, and ask if you should continue without argent:

> Argent isn't installed in this environment. To enable the mobile/Chromium tooling this repo is configured for, run `npx @swmansion/argent@latest init -y` (or `npm i -g @swmansion/argent@latest && argent init -y`).
> </availability_check>

<tapping_rule>
<important>**Never** derive tap coordinates from a screenshot</important>
Before **every** tap, you MUST call a discovery tool and extract coordinates from the result. This is not optional. Preferred tools are, in order:

- `describe` - native app-level components and safely targetable foreground apps (iOS and Android).
- `native-describe-screen` - accessibility screen description via injected native devtools (iOS only)
- `debugger-component-tree` - react-native specific components

`native-user-interactable-view-at-point` / `native-view-at-point` are follow-up diagnostics once you already have a candidate point (iOS only).

Whenever something changed YOU MUST first call `describe`, or another appropriate discovery tool so you do not hallucinate element positions. Do not guess coordinates if you can use discovery tool. Do not tap if you have not called a discovery tool in the current step. Screenshots alone are never sufficient for coordinates.

If a **tap fails twice** at the same coordinates, **stop retrying**. Re-run the discovery tool.

If `describe` fails, **read the exact error before reacting**, follow the recovery guidance in `argent-device-interact` to choose the correct next action.

Before starting to interact with the app, read the `argent-device-interact` skill first.
</tapping_rule>

<device_selection_rule>
Before booting, running, or interacting with any app, call `list-devices` first - prefer running devices.

Decision order:

1. **Explicit user intent** - choose the user named platform or device. Look for words "simulator" and "emulator".
2. **Prefer a running device.** iOS simulators - state `Booted` and Android devices - `state: "device"` come first in `list-devices`; Chromium (CDP) apps appear as `platform: "chromium"`, `state: "Running"`.
3. **Single-platform project:** (per `argent-environment-inspector` flags `is_native_ios`/`is_native_android`, or RN with only one platform configured) → boot that platform.
   </device_selection_rule>

<skill_reading_rule>
<important>Always read relevant skills for guidance before executing argent-mcp tool - read skill_routing reference</important>
</skill_reading_rule>

<general_rules>

- All simulator/emulator interactions go through argent MCP tools. Never use `xcrun simctl`,
  raw `curl` to simulator ports, or the simulator-server binary directly.
- Before calling any gesture tool for the first time, use ToolSearch to load its schema.
- Interaction tools (`gesture-tap`, `gesture-swipe`, `gesture-pinch`, `gesture-rotate`, `gesture-custom`, `launch-app`, etc.) return a screenshot automatically.
  Call `screenshot` separately only for a baseline before any action or after a delay.
- Always open apps with `launch-app` or `open-url`. Never tap home screen icons.
- Always use `run-sequence` when performing multiple sequential device actions where you don't need to observe the screen between steps. More in `argent-device-interact` skill.
- When the session ends or the user says they are done: call `stop-all-simulator-servers`.
  If the user started Metro separately, ask whether to call `stop-metro` (specify the port if not 8081).
- If tools provided by mcp-server are not sufficient and action can be done using `xcrun`, `adb`, or other commands, use the command. Examples: changing device options, performing a device action such as lock, shake, etc.
- When waiting for an action, do not call `screenshot` repeatedly without a proper wait mechanism. Use the `await-ui-element` tool to block until the UI settles (e.g. wait for an element to become `visible`/`hidden`, or to contain expected `text`) instead of polling.
  </general_rules>

<react_native_detection>
Project type is determined by the `argent-environment-inspector` subagent (see `subagents` section).
When the subagent result is available, use its `is_react_native` field as the authoritative
source. Do not re-inspect files manually.

If the subagent has not run yet and project type is unknown, run it first before proceeding. Always use subagents if available to run `gather-workspace-data` data tool, if possible do not run yourself.

When `is_react_native` is true: load `argent-react-native-app-workflow` skill. Use `debugger-component-tree` for element discovery - if the responses are large or unhelpful, try `describe`.
</react_native_detection>

<skill_routing>
Load the matching skill before starting work and executing tools from argent-mcp. Skills contain the full step-by-step
procedure and edge-case handling for each workflow.

PLATFORM DETECTION
If the user did not specify a platform, call `list-devices` first and pick the booted target. Do not default to iOS. Vega (Amazon Fire TV) devices appear as `platform:"vega"`, when present load `argent-tv-interact`

iOS SIMULATOR SETUP
Skill: `argent-ios-simulator-setup`
When: Beginning a task that involves the iOS simulator, no simulator booted yet, need UDID or simulator-server.

ANDROID EMULATOR SETUP
Skill: `argent-android-emulator-setup`
When: Beginning a task that involves the Android emulator, no emulator running yet, need an adb serial, or about to install an APK.

TAPPING, SWIPING, TYPING, GESTURES, SCREENSHOTS, SCROLLING
Skill: `argent-device-interact`
When: Performing touch interactions, typing, pressing hardware buttons, launching/restarting apps, opening URLs, rotating device, taking standalone screenshots, or verifying a visible UI code change. Phone/tablet iOS and Android only. For any TV target use the TV skill below.

APP PERMISSIONS (GRANT / DENY / RESET WITHOUT THE SETTINGS UI)
Skill: `argent-settings-permissions`
When: You must change an app runtime permission (camera, microphone, photos, contacts, notifications, calendar, location, location-always, media-library, motion, reminders) that the app itself can't flip. Pre-authorize or deny it before the app asks, re-enable one the user already denied (iOS never re-prompts), or reset it so the first-run dialog reappears. Works on the iOS simulator and Android emulator/device. Do NOT use it when the app has an in-app toggle or is showing its own permission dialog. Tap that instead (see `argent-device-interact`); nor for permissions/settings outside that list.
Prompt keywords: permission, grant, deny, revoke, reset permission, privacy, camera access, location access, TCC

TV INTERACTION (APPLE TV / ANDROID TV / FIRE TV)
Skill: `argent-tv-interact`
When: Any TV target: a `list-devices` entry with `runtimeKind: "tv"` (Apple TV simulator or Android TV emulator) or `platform:"vega"` / `kind:"vvd"` (Amazon Fire TV / VVD), or the user mentions Apple TV / tvOS / Android TV / leanback / Vega / Fire TV. A TV UI is focus-driven, not touch-driven: drive it with `describe` (read focus) + `tv-remote` (D-pad presses) + `keyboard` (type); `gesture-*` tools do NOT apply. Covers booting the target, app lifecycle, focus navigation, typing, screenshots, and (Vega) VVD lifecycle + Fast Refresh + JS-runtime debugging (evaluate, console logs, network inspector).
Prompt keywords: apple tv, tvos, android tv, leanback, vega, fire tv, vvd, d-pad

SCREENSHOT DIFF & VISUAL REGRESSION
Skill: `argent-screenshot-diff`
When: Explicit visual regression, screenshot diff, compare screenshots, before/after visual comparison requests, or visible UI changes where stable pixel comparison would add useful evidence.

SCREEN RECORDING (VIDEO CAPTURE)
Skill: `argent-screen-recording`
When: The user wants a video of the device screen: recording a flow, interaction, animation, or bug reproduction as a clip, or documenting app behavior beyond what a still screenshot shows. Covers the start → interact → stop lifecycle, the reminder discipline that keeps a recording from being left running, and retrieving the mp4 artifact.
Prompt keywords: record, recording, screen recording, video, capture video, clip, mp4

RUNNING / BUILDING / DEBUGGING REACT NATIVE APP
Skill: `argent-react-native-app-workflow`
When: Project is react-native, starting Metro or running the iOS or Android app, build failures, pod issues, lost Metro connection, reading logs, reloading JS bundle, reinstalling app.

JS EVALUATION, METRO CONNECTION, REACT NATIVE
Skill: `argent-metro-debugger`
When: evaluating expressions, inspecting React component tree at source level, finding element placement via `debugger-component-tree`.

REACT APP & COMPONENT PROFILING
Use skill: `argent-react-native-profiler`
When: To measure performance of specific components, to find app-wide bottlenecks. Investigating re-renders or CPU hotspots, producing ranked performance reports.

NATIVE PROFILING
Use skill: `argent-native-profiler`
When: Profiling native performance (CPU hotspots, UI hangs, memory leaks). iOS only today; Android on the roadmap. Useful as a reference for platform-specific investigation when running dual profiling via `argent-react-native-profiler`.

PERFORMANCE OPTIMIZATION
Use skill: `argent-react-native-optimization`
When: App feels slow, user asks to optimize, reducing bundle size, improving startup time, fixing re-renders, optimizing lists/images/navigation, or any performance-related task. This is the entry-point skill for all performance work. It delegates to `argent-react-native-profiler` for measurement.

END-TO-END UI TESTING
Skill: `argent-test-ui-flow`
When: Verifying complete user flows, running interact → screenshot → verify loops, testing features by using the app, executing manual QA steps, or validating visible UI changes or visual behavior after implementation.

RECORDING & REPLAYING FLOWS
Use skill: `argent-create-flow`
When: A multi-step interaction sequence needs to be repeated: re-profiling after a fix, A/B comparisons, regression checks, user says "again" / "run that flow", or you worked through a complex path worth saving. Also use proactively: if you are about to repeat steps you already performed, record first, then replay.
Prompt keywords: flow, repeat, test X times

PROPOSING DESIGN VARIANTS FOR HUMAN SELECTION
Use skill: `argent-lens`
When: The user asks for design alternatives / options / A-B choices for a screen or component, or you have produced more than one candidate look for an element and want a human to pick before committing. Covers the build → navigate → screenshot → propose_variant loop and the single blocking await_user_selection call. (Gated behind the `argent-lens` flag, off by default. Run `argent enable argent-lens` first.)
Prompt keywords: variant, design option, alternative, A/B, "let me pick", "show me options"
</skill_routing>

<subagents>
ENVIRONMENT INSPECTION AT SESSION START
Use subagent: `argent-environment-inspector`
When:
- Environment context of the project is not yet known
- No "Project Environment" section exists in project memory / `MEMORY.md` or you lack information about basic setup workflows
- Need to determine build commands, startup scripts, metro port, platform support, or QA tooling
  If the subagent already ran this session (result in memory), use that context directly. Do NOT re-run.
Rules:
  - Run the `argent-environment-inspector` subagent if possible. Never call `gather-workspace-data` yourself - do only if subagent is not available.
  - The main agent is responsible for persisting the subagent's JSON result to project memory
</subagents>

# Named local URLs (portless), never raw ports

<description>
Every long-running local server an agent starts MUST be reachable at a stable, guessable name, `https://<name>.localhost`, not at a port number the user has to be told.

The tool is **portless** (Vercel Labs, `npm i -g portless`, Node >= 24): a background proxy on 443 that routes by hostname. It assigns the child an internal port itself (via `PORT`, or an injected `--port` for Vite/Astro/Angular/Expo), so the port stops being anyone's problem. Tagline: "Replace port numbers with stable, named local URLs. For humans and agents."

Sibling tool **emulate** (https://emulate.dev, `npx emulate`) is a different thing: offline stateful fakes for third-party APIs (Stripe, GitHub, AWS, Slack, Google...). It is NOT a tunnel and does NOT host your dev server. It shares the naming scheme via `--portless`. See `<emulate>` below.

Why this rule exists: several agents (Claude, Codex, Grok, Cursor) run in parallel on this machine. Random ports mean collisions, killed servers, and the user asking "which port?" every single time. A name derived from the repo means the user never has to ask.
</description>

<the_law>
1. **Never announce a bare port.** `localhost:3000`, `:4000`, `:5173`, `:8080` are not acceptable answers to "where is it running".
2. **Never pick a "random free port".** Deterministic name in, deterministic URL out.
3. **Never kill another process to free a port.** It is probably another agent's server. See `<multi_agent>`.
4. **Always announce the URL** in the exact format in `<announce>`, both when the server comes up and in the final message of the turn.
5. If a port number is genuinely unavoidable (Docker, a non-Node service), give it a name anyway with `portless alias <name> <port>`.
</the_law>

<availability_check>
Run once per session, before starting any dev server. Do not re-probe on later starts.

```bash
command -v portless && node -v    # portless present? node >= 24?
```

- **portless present, Node >= 24** → use it. This is the default path.
- **portless missing, Node >= 24** → install it: `npm i -g portless`. First run generates a local CA and asks for sudo once to bind 443; that is expected, not a failure.
- **Node < 24** → portless will refuse (`engines: >=24`). Bump with `fnm install 24 && fnm use 24` (fnm is the node manager on this machine), or drop to `<fallback_ladder>` tier 3 and say so once.

Never silently fall back to a random port. If you end up off the portless path, state which tier you are on and why, in one sentence.
</availability_check>

<naming>
The name is **derived, not invented**. Given the same repo, every agent must arrive at the same URL. Resolution order:

1. `portless.json` `name`, or the `"portless"` key in `package.json` (a bare string is shorthand for the name). If present, it wins, always.
2. Otherwise: the **git repo root directory name**, kebab-cased.
   `~/Desktop/CREATE/compronents` → `https://compronents.localhost`
3. Monorepo package: portless defaults to `<package>.<project>` → `https://web.acme.localhost`, `https://api.acme.localhost`. Dots become subdomains.
4. Git worktree: portless prepends the branch → `https://fix-ui.myapp.localhost`. Let it.

Do not add mood, adjectives, dates, or `-dev`/`-local`/`-new` suffixes. `compronents-dev-v2.localhost` is a rule violation. The user must be able to guess the URL from the folder name without reading your output.

Pin the name in the repo the first time you touch it, so every agent and every future session agrees:

```json
// package.json
{ "portless": "compronents" }
```
</naming>

<starting>
```bash
portless                       # runs package.json "dev" script, name inferred
portless run next dev          # explicit command, name inferred
portless compronents next dev  # explicit name + command
portless alias legacy-api 8080 # name something already running (Docker, etc.)
```

From a monorepo root, bare `portless` starts every workspace package, each with its own name. Useful commands: `portless list` (what is running), `portless doctor`, `portless clean`, `portless proxy stop`.

Do NOT prefix with `PORT=…` and do NOT pass `--port` yourself. portless owns the port; overriding it defeats the whole mechanism.
</starting>

<announce>
Print this exact line when the server is up, and repeat it in the final message of the turn. Fixed `▶ ` prefix so the user can scan for it.

```
▶ https://compronents.localhost — compronents · next dev · portless
```

If you are not on the portless path, the line still leads with the URL and names the tier:

```
▶ http://localhost:4317 — compronents · next dev · pinned port (portless unavailable: node v22 < 24)
```

Rules for the line: the URL is first, it is complete and clickable, and there is exactly one of these per server. Do not bury it in prose, do not paraphrase it later in the turn, and never say "the dev server is running" without it.
</announce>

<multi_agent>
Multiple agents share this machine. Before starting anything:

```bash
portless list
```

- **Name already live and it is the app you were asked to run** → reuse it. Do not restart it. Announce the existing URL and carry on.
- **Name live but it is a different app / another agent's session** → do not kill it, do not `--force`. Work in a git worktree so portless prefixes the branch automatically (`fix-ui.compronents.localhost`), or pass an explicit distinct name.
- **Port conflict from a non-portless process** → that is the reason this rule exists. Give it a name with `portless alias`, or leave it alone.

`pkill -f next`, `kill $(lsof -ti:3000)`, and friends are banned unless the user explicitly asks you to kill that specific server.
</multi_agent>

<fallback_ladder>
Descend only as far as you must, and say which tier you landed on.

1. **portless, TLS, port 443.** The default. `https://<name>.localhost`.
2. **portless without sudo/443.** `portless -p 8443` (or `--no-tls`). Still named: `https://<name>.localhost:8443`. Use when binding 443 is refused.
3. **No portless (Node < 24, locked-down CI).** Pick a port ONCE, pin it in the repo config (`package.json` script, `.env`, `vite.config`), commit the choice, and announce it. It must be the same port on the next run and for the next agent. A pinned 4317 is acceptable; a fresh random port every run is not.

Tier 3 is a stopgap. Mention the one-line fix (`fnm install 24 && npm i -g portless`) once, then stop nagging.
</fallback_ladder>

<emulate>
For **third-party API** calls in dev and tests, prefer offline emulation over live keys or hand-written mocks:

```bash
npx emulate --portless                    # all services, named hosts
npx emulate --service github,stripe       # subset
```

With `--portless`, services get fixed names, `https://stripe.emulate.localhost` and `https://github.emulate.localhost`, instead of 4010/4001. Point the SDK's host at those. Announce emulated services with the same `▶ ` line.

emulate is stateful and offline (real OAuth/RS256, AWS XML, cursor pagination), needs no keys or Docker, and behaves the same in CI. It does not replace portless for your own app, and it does not expose anything to the internet.

To share a real local server outward, use portless's own flags `--tailscale`, `--funnel`, or `--ngrok`. Never an ad-hoc tunnel on a random port.
</emulate>

<banned>
- `localhost:3000` / `:4000` / `:5173` / `:8080` as the answer to "where is it"
- "I'll use a random free port" / "port 3001 since 3000 was taken"
- `PORT=3000 npm run dev` under portless
- killing a process to free a port
- inventing a name that is not derived from the repo
- reporting a server as running without the `▶ ` line
</banned>

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

`ctx7` runs before any WebFetch or WebSearch aimed at documentation. If you are about to look
up a named library, framework, SDK, API, CLI tool, or cloud service, that call is the trigger. It is
not a judgment about whether you already know the answer, and it holds for well-known libraries:
React, Next.js, Prisma, Express, Tailwind, Django, Spring Boot. Covers API syntax, configuration,
version migration, library-specific debugging, setup instructions, and CLI usage.

Measured across 200 transcripts: ctx7 fired 20 times against 298 WebFetch and WebSearch calls. The
rule was being read and skipped, so it is now a precondition on the tools that were winning.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or
general programming concepts. None of those are documentation lookups.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<user's question>"`. Use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<user's question>"`
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Use the user's full question as the query -- specific and detailed queries return better results than vague single words. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.

# Plan review: Plannotator

https://plannotator.ai/ is how I review plans. Show me what I am approving before asking me to
approve it. Plannotator collects annotations and the approval decision. Previews and subsystem
models supply the material I inspect there.

## When this applies

Write a plan and open it in Plannotator before implementation whenever the work is more than a tiny,
obvious edit: new features, refactors, architecture, multi-file changes, migrations, or anything I
would reasonably want to shape first.

Skip the approval gate when I say "just do it" or "skip planning", or the change is a typo or
one-liner with no design choice. Skipping the gate does not cancel a visualization I requested.

A question about an existing system stays read-only. Explain it with the appropriate visual or
model without turning the question into an implementation plan or asking for approval to explain.

## Show the proposed change before approval

I should be able to see the layout and follow the behavior before the real implementation starts.
Do not make me infer the visible result from a file table or code diff.

| Change | Material to put in front of me |
| --- | --- |
| Layout, styling, composition, responsive UI | Current screenshot beside a proposed image or SVG at matching viewport sizes. Show affected mobile and desktop arrangements when they differ. |
| Interaction, navigation, state, motion, scroll behavior | A runnable preview and a short video walkthrough of the important action and result. Include a storyboard of key states so I can inspect them without playing the video. |
| Backend behavior, data flow, architecture | A focused before-and-after diagram. Add a source-linked subsystem model when dependencies, execution order, or boundaries need inspection. |
| Mixed UI and backend work | Both the visible user flow and the code path that produces it, linked by the same named scenario. |

Pick media that answers the decision. A layout-only change need not have a video. A still image is
insufficient when timing or interaction is the point. If I explicitly request a video, image, or
SVG, deliver that format. Do not replace it with prose or a promise to capture it after building.

1. Capture the current state when one exists. Pin the URL or source revision, viewport, and scenario.
2. Make the smallest preview that demonstrates the proposal. Reuse the app's actual assets, tokens,
   and components where practical. New design choices still follow direction-first discovery.
3. For behavior, show the trigger, transition, and outcome. Include relevant loading, empty, error,
   retry, back/cancel, focus/keyboard, and reduced-motion behavior. Choose states affected by this
   change; do not manufacture a checklist of unrelated states.
4. Record a concise walkthrough with readable labels or narration. Keep pause/replay available.
   Say which behavior is simulated, which data is a fixture, and which integrations remain unbuilt.
5. Put the media beside the decision in the plan. Label each artifact Current, Proposed preview,
   or Verified implementation. A proposed preview is design evidence, not implementation proof.
6. Verify that images render, video plays, and preview links open. Use supported local HTML or
   links when the installed Plannotator renderer cannot embed a format. Keep a visible still and
   a direct playable link in the review; do not hand over broken embeds or silently omit media.

### Preview work before the gate

Preparing an isolated prototype, SVG, storyboard, fixture, or recording is part of preparing the
plan. It is allowed before approval. Keep it under `.plannotator/<change>/` or in an isolated
checkout. Do not wire it into production routes, change live data, or start the actual migration.
Use portless for a long-running preview server and the appropriate UI tools to capture it.

This resolves the sequence explicitly: make the preview, review the proposal, then implement the
approved change. "Do not implement before approval" is not a reason to refuse to demonstrate it.

## Explain systems with subsystem models

Use the `subsystem-modeling` skill for source-linked explanations of existing systems and proposed
code changes. If discovery misses it, read
`/Users/blank/dotfiles/skills/skills/subsystem-modeling/SKILL.md`.

Apply it when understanding dependencies, behavior, deployment boundaries, or code usefulness is
part of the task. This includes onboarding, legacy-system exploration, feature planning, refactors,
migrations, debugging, impact analysis, test planning, performance and cost investigations, and
keeping architecture documentation current. It also applies outside Plannotator and without a
pending code change. For a simple local explanation, a small diagram and source links may suffice.

Show the relevant parts of the model:

- Constructs: real functions, methods, types, stores, and external actors, with their purpose.
- Static topology: imports, type relationships, and source-module membership.
- Runtime topology: client/server, worker, process, service, and repository boundaries.
- Walkthroughs: ordered steps for a named behavior, linked to the source sites that cause them.

Explain usefulness through an actual user or operational outcome, callers and consumers, the
guarantee a component provides, and what removing or replacing it would affect. Trace a concrete
scenario. Check usage, tests, runtime evidence, or cost when those claims need it. A missing edge
in a selected model is not proof that code is unused. An attractive diagram is not proof of value.

Keep current, proposed, inferred, and runtime-observed claims distinguishable. Preserve stable model
IDs and source revision evidence. Model validity, source verification, and exercised behavior are
separate results. Use the full model for inspection, with a small summary diagram in the plan.
Subsystems Studio can display the model; accepting a model correction there does not approve an
implementation plan in Plannotator.

## What the plan has to contain

One pass should leave me with most of the change in my head. Use these five parts in order.

1. **Goal in three lines.** What is missing or wrong, what becomes true, and how we prove it.
2. **Visual explanation.** One simple overview of the change, then the relevant before-and-after
   images, SVGs, playable preview, video, or subsystem walkthrough. Show the result before the
   file list. Keep the overview to six nodes with short labels. Larger systems get focused
   submodels or drilldowns instead of an unreadable whole-repo graph.
3. **File table.** One row per source file, with its responsibility today and after the change.
   Name generated outputs separately. A filename and "update" do not explain a change.
4. **Real code for real choices.** Show the decision-bearing edits in diff fences, with reasons
   that affect the review. Connect them to the scenario and visual already shown.
5. **Scope left out.** State deliberate omissions, preview limitations, and unresolved evidence
   that could change the decision. Say what remains to be verified in the real implementation.

```diff
- const session = readCookie(req)
+ const session = await getSession()   // cached per request
```

For this example, show which callers now share the result and which request owns the cache.
If the claim is seven parses becoming one, identify the call sites and say how we will measure it.
Do not defer a material design choice to "I will work that out while implementing".

## Workflow

1. Read the affected code and current behavior. Reuse current models and approved assets, checking
   for drift. Prepare the preview and concrete plan before opening review.
2. Save the plan as Markdown, normally `.plannotator/<change>/plan.md`, with durable local assets.
   Where the host provides a plan file, use it and link the same review material.
3. Open the approval gate. Claude Code's plan-exit hook may do this. In Codex and other hosts run
   `plannotator annotate <plan-path> --gate --json`. Use `--require-approval` if the caller needs
   the exit status to encode the decision. Plain `annotate` has no Approve button.
4. Wait for the human decision. Opening the UI, closing it, or a command exiting without an
   approved decision does not grant approval. Read the returned JSON rather than guessing.
5. If annotated, revise the same plan and affected previews, then reopen. If approved with notes,
   implement and treat the notes as required guidance. Do not force another review for notes
   that were explicitly non-blocking. Reopen for a material departure from the approved proposal.
6. Implement the approved change. Compare the real result to the approved preview at the same
   viewport and scenario. For behavior, exercise the real flow and capture its result. Update
   relevant model symbols, source sites, walkthroughs, and evidence alongside the code.
7. After substantial implementation, run `plannotator review --json` for the diff and make the
   corresponding implementation screenshots, recording, and model comparison available. Fix
   returned annotations. Report what matched, what differed, and what remains unverified.

Use the installed `plannotator`, `plannotator-annotate`, and `plannotator-review` skills for command
details. Never use Agent Browser or Argent to supply approval or read the review decision. They
may capture and verify the preview being reviewed. Human decisions come through Plannotator.

Do not paste a chat-only outline and call it a reviewed plan. Do not replace visual evidence with
an architectural diagram when the decision is about UI. Do not claim runtime behavior from an
authored walkthrough or claim a visual match from source edits alone.

If Plannotator is missing from PATH, say so once, install it with
`curl -fsSL https://plannotator.ai/install.sh | bash`, and retry. Keep the plan available for review.
