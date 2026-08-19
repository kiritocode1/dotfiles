<!-- GENERATED FILE. DO NOT EDIT.
     Source: dotfiles/skills/rules/
     Rebuild: dotfiles/skills/bin/build && dotfiles/skills/bin/install
     Editing this file directly loses your changes on the next build. -->


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

Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<user's question>"`. Use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<user's question>"`
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Use the user's full question as the query -- specific and detailed queries return better results than vague single words. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.

# anydoc (convert office docs to Markdown)

From wall: anydoc (insp_anydoc-github). Always available as the skill
`convert-documents-to-markdown`.

Whenever a task needs the contents of a Word, PowerPoint, Excel, OpenDocument,
RTF, EPUB, CSV, or PDF file that cannot be read as plain text, use anydoc.
Do not guess document contents from filenames, and do not skip the conversion.

## Default path

```bash
npx -y @firecrawl/anydoc <file>              # Markdown to stdout
npx -y @firecrawl/anydoc <file> -o out.md    # write to a file
npx -y @firecrawl/anydoc - --format csv < f  # read stdin
```

## Rules

1. Supported: `.doc`, `.docx`, `.docm`, `.odt`, `.rtf`, `.epub`, `.pdf`, `.ppt`,
   `.pps`, `.pot`, `.pptx`, `.pptm`, `.ppsx`, `.ppsm`, `.odp`, `.xls`, `.xlsx`,
   `.xlsm`, `.xlsb`, `.ods`, `.csv`.
2. Prefer the skill `convert-documents-to-markdown` when it is listed; the CLI
   above is the same tool.
3. Format is detected from content. Pass `--format <name>` only for CSV from
   stdin, or when the extension is missing or wrong.
4. Large docs: write with `-o` and read only the parts you need.
5. Scanned / image-only PDFs need OCR; anydoc cannot read those. Fall back to
   Firecrawl Parse (https://firecrawl.dev/parse) or tell the user.
6. In Node/Python/Rust app code prefer the library (`@firecrawl/anydoc`,
   `firecrawl-anydoc`, `anydoc`) over shelling out.

Plain `.md`, `.txt`, `.json`, source code, and other text files: read them
directly. anydoc is for binary / office formats only.

# Plan review: Plannotator

https://plannotator.ai/ is how I review plans. Chat is not the review surface. I annotate, cut scope,
and approve there. Do not start implementing a planned change until Plannotator returns Approve or
Approve with Notes.

## When this applies

Write a plan and open it in Plannotator before implementation whenever the work is more than a tiny,
obvious edit: new features, refactors, architecture, multi-file changes, migrations, "how should we
build this", or anything I would reasonably want to shape first.

Skip only when I say "just do it" or "skip planning", or the change is a typo or one-liner with no
design choice.

## Workflow

1. Write the plan as Markdown. In Claude Code that is plan mode's plan file. Elsewhere write a repo
   file such as `PLAN.md` or `.plannotator/<name>.md`. Include goal, approach, files to touch, risks,
   and what you will not do. A chat-only outline is not a plan I reviewed.
2. Hand it to me and stop.
   - Claude Code: exiting plan mode (`ExitPlanMode`) opens Plannotator through the plugin hook. Let
     it. If that hook is missing, run `/plannotator-annotate <path>`.
   - Codex, Grok, anywhere else: `plannotator annotate <path> --gate`, or the
     `$plannotator-annotate` skill when it is available.
3. Wait. Do not code, commit, or start the first step while the review is open.
4. If I send feedback, revise the same plan file, then open it again. Repeat until Approve or Approve
   with Notes.
5. Approve with Notes means implement, and treat the notes as required guidance, not optional colour.
6. After substantial implementation, open the diff the same way: `/plannotator-review`,
   `plannotator review`, or `$plannotator-review`. Stop again if I annotate the diff.

Manual commands: `/plannotator-annotate`, `/plannotator-review`, `/plannotator-last`.

## Anti-patterns

Do not use `agent-browser` or Argent to "review" a plan.

Do not paste the plan into chat and ask me to rubber-stamp it there.

A short status line is fine: "plan is open in Plannotator, waiting on your review".

If `plannotator` is missing from PATH, say so once and install it with
`curl -fsSL https://plannotator.ai/install.sh | bash`, then retry. Do not fall back to chat review.

# WhatsApp updates

Command: `wa send "…"`. The destination is already configured, so never ask for the number. It uses
the local WhatsApp.app; do not invent another API. Load the `wa-update` skill for the full contract
(exit codes, spool, inbox).

## On demand, `wa me`

When I write `wa me` anywhere in a message, send a WhatsApp status update before you finish the turn:
what you are working on, where it stands, and anything you need from me. One short chat-length
message, not a dump. This is in addition to your normal reply, not instead of it.

## Unprompted, only these three

1. You are about to block on me: a decision, a secret, a review.
2. Something long, over 5 minutes, finished or failed while I might be away.
3. I asked to be notified about this specific task.

Nothing else. No routine progress, no per-commit pings, no mid-task narration. One wrap-up beats a
drip. The cap is 8 per hour.

## Inbox

I can text the You chat with `@claude`, `@codex`, or `@grok`. `wa watch` routes that to the named
agent and sends the reply back. If this session started that way, your stdout is the WhatsApp reply,
so do not run `wa send`.

# Working with me here

You are the agent I dispatch to. My prompts here average 1,152 characters against 46 in Claude, they
usually carry attached files or images, and I delegate more (5.1 per 10k chars against 1.2).

What that means for you:

**Carry the work to closeout.** When I ask you to execute, build, migrate, or push, run the real
workflow to a verified end rather than stopping at a plan. This is the single strongest preference in
my history with you.

**Trace the actual path before theorising.** Read the real code, data, provider, and runtime path.
When I ask what is really happening, check live or database state rather than reasoning from the
source alone.

**Separate verified from assumed.** Say which is which, every time. Keep validation of what you
touched distinct from unrelated repo-wide lint and type debt, and report both accurately.

**Minimal edits for narrow requests.** For content-only or small UI work, make the direct edit. Keep
the existing taxonomy and layout, and leave unrelated references intact.

**Do not claim a visual change from source edits alone.** For font migrations and other UI-risky
work, audit the overrides and verify the rendered or computed result.

## Standing constraints

- Never retain credentials. Use pasted secrets once and never write them to a file or to memory.
- Never commit or push unless I ask.
- Skip heavy browser and dev-server checks by default. Use a live pass for complex, UI-risky, or
  runtime-dependent work.
