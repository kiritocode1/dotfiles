# Fewer weak deliveries, less supervision

## Goal

Agents currently deliver work that misses references, requires finishing corrections, or consumes too much review time.
Make problem definition, deep source study, creative iteration and evidence-based finishing part of the existing workflow; remove Impeccable.
Verify installation separately from quality, then measure outcomes on the next five eligible tasks.

## Current and proposed workflow

Current failure pattern observed in sampled threads, not a claim about every task:

```text
References → broad interpretation → large draft → user finds defects → repeated repairs
```

Proposed workflow:

```text
Understand the problem → study and experiment → compare a developed proof → one approval → expand and verify → concise delivery
```

This changes agent instructions and skill installation, not a product UI. The following scenario is the proposed behavioral preview. No UI/video prototype is needed for this instruction change.

### Creative standard and research scope

The goal is a developed idea competitive with the best relevant inspirations, not fast production of many easy alternatives. Creative work may take substantial time. A good idea can come from anywhere: the existing wall, people, marketplaces, component implementations, other disciplines, or outside sources when they answer the problem better. Treat saved sources as a starting point, not an exclusive whitelist or a permanent house style. Inspora, Vercel and any individual designer are examples, not mandatory influences.

Use the existing wall and component registry before asking the user to resupply resources. Search different axes when initial results are poor. Follow individual works and original sources, inspect interactions and read relevant component implementations end to end. An entry in a catalog is not completed research. Three limits presented choices, not research depth, experiments or iteration time. Retain explicit user selections without inventing approval of every item in a collection.

Before designing sections, state the audience problem, what each section must communicate, and its evidence or demonstration. Inspect the component library for implementation standards, interaction/state models, composition, responsive behavior and accessibility. Reuse suitable code; justify new mechanisms by task needs, not novelty alone. Preserve the existing Direction skill's discovery bypasses for fixed-source and narrow work.

### Scenario: vague brief with several inspirations

1. User supplies references and says “I like this, make ours feel like that.” Agent inspects them before assigning roles.
2. Agent asks a small set of concrete questions about the unresolved choices. It can ask “Is it the image treatment or the page composition you want from this one?” It accepts informal answers and translates them into specific decisions. It asks again when ambiguity would materially change the result, rather than guessing or requiring the user to write a design brief.
3. Agent records the working interpretation in the existing plan: source relationship, reference roles, composition, real assets, motion/audio requirements, allowed departures, and named verification scenarios. Unconfirmed interpretations remain marked as assumptions.
4. Agent tests the requirement most likely to invalidate the approach. A film uses a representative short scene with an actual narrator candidate. A website uses a representative section with real imagery and the difficult interaction. This stays in the isolated preview directory before approval.
5. Agent develops the preview at the intended quality, comparing actual renders or playback against selected works and the brief. Record a concrete weakness, the experiment intended to address it, and the observed result. Review both execution defects and missed opportunities to explain the product better. Keep research and iteration evidence inspectable without streaming every attempt into chat. Show one recommended result by default. When a real decision needs alternatives, show at most three strong, relevant examples unless the user asks for more. Three is a ceiling, not a quota. Reuse examples the user has already liked when relevant; don't assert that new examples match their taste without feedback.
6. User approves the direction in Plannotator. Agent expands it, inspects actual output, fixes material defects, and delivers the result with evidence and any unresolved limitations. Settled direction, palette and layout decisions are not reopened as separate approval requests.

### Scenario: exact source or small existing adjustment

Keep the current discovery bypass. Exact-source work follows `fidelity-first`; it is not an invitation to explore alternatives. A narrow adjustment preserves what is already approved. A typo or obvious one-line change does not acquire a new planning ritual.

### Scenario: self-review fails

Agent compares actual output to the accepted brief, repairs concrete defects, and checks again. It does not silently replace a difficult ingredient or mark temporary narration/assets as finished. Continue while experiments resolve uncertainties or produce meaningful improvements within the user's budget. Escalate when the same weakness persists without progress, a required capability is unavailable, or the remaining choice requires the user's judgment. There is no arbitrary two-attempt cap on creative work. Report the specific gap and smallest decision needed; do not silently downgrade the brief.

If playback, visual inspection, or audio listening is unavailable, say which quality claim cannot be verified. Metadata and successful rendering do not prove motion or voice quality.

## Source and installation model

Baseline revision: `9c7595df0cd889e36f4b6030420e0ed9b36fdd68`. Working tree was clean before this plan.

Current source responsibilities:

```text
rules + tiers → bin/build → build outputs → bin/install → agent instructions
vendored patches → bin/patch → installed skill copies and links
```

Source links:
- [Direction trigger](../../skills/rules/core/direction-first.md)
- [Exact-source fidelity](../../skills/rules/core/fidelity-first.md)
- [Plan and approval](../../skills/rules/shared/plannotator.md)
- [Runtime verification](../../skills/rules/shared/ui-verification.md)
- [Skill deletion implementation](../../skills/bin/patch)
- [Manifest inventory](../../skills/manifest.toml)

The manifest is inventory, not the input to a skill installer in the inspected scripts. Removing its entry alone does not uninstall a skill. `bin/patch` already supports deleting installed copies and symlinks across six skill homes. Reuse that mechanism; do not add another installer.

## File changes

Paths are relative to `/Users/blank/dotfiles` unless absolute.

| Source | Today | Proposed responsibility/change |
| --- | --- | --- |
| `skills/rules/core/direction-first.md` | Discovery trigger and separate closeout requirement | Add reference-role clarification, preference for relevant previously liked examples, maximum three presented examples by default, and explicit precedence. Fold source evidence into one final closeout. |
| `skills/rules/core/direction-first.grok.md` | Compressed discovery trigger | Preserve the same clarification, relevance and authority semantics within its existing budget. |
| `skills/rules/core/fidelity-first.md` | Pinning, mechanism extraction and diff requirements | Preserve all fidelity guarantees; connect them to the task acceptance brief and shared verification/tool selection. |
| `skills/rules/shared/plannotator.md` | Full review procedure loaded on every task | Keep a concise trigger, approval safeguards and pointer to the on-demand procedure. |
| `skills/reference/plan-review.md` | Absent | Move the existing procedure here, consolidate it around one representative proof and approval, add audience/section intent and acceptance, preserve requested media and substantial implementation review. |
| `skills/rules/shared/argent.md` | Detailed device procedures always loaded | Replace with a trigger pointing to the preserved on-demand reference and existing platform skills. |
| `skills/reference/argent.md` | Absent | Preserve moved device procedures without changing their safety constraints. |
| `skills/rules/shared/portless.md` | Full server procedures always loaded | Keep named-URL requirement and pre-start trigger; move operational detail to reference. |
| `skills/reference/portless.md` | Absent | Preserve the full operational procedure and fallback constraints. |
| `skills/rules/shared/webreel.md` | Full recording procedure always loaded | Keep recording trigger and tool-boundary rule, point to reference. |
| `skills/reference/webreel.md` | Absent | Preserve recording setup, validation and recovery procedure. |
| `skills/rules/shared/ui-verification.md` | Tool routing and runtime evidence | Own private inspect/fix/reinspect, audience-level scenarios, honest inspection limitations, bounded escalation and one concise closeout. Include motion/audio when present without imposing unrelated checks. |
| `skills/skills/blank-mode/SKILL.md` | Router with duplicated/stale discovery and planning procedures | Replace duplicated procedure with canonical rule pointers. Route vague creative briefs through clarification, not blind source copying. |
| `skills/rules/agent/codex.md` | Heavy-browser-check default can conflict with visible verification | Clarify that focused acceptance checks for visible changes remain required; avoid broad unrelated QA. Read the whole source before editing. |
| `skills/manifest.toml` | Registers `pbakaus_impeccable` | Remove that complete registration. Do not rewrite unrelated historical counts. |
| `skills/vendored/impeccable/patches.toml` | Absent | Add the existing supported `delete` declaration so post-install patching removes the skill. |
| `skills/profile/skill-adherence.md` | Historical baseline and adherence methodology | Preserve baseline; add a five-task prospective quality trial with unknowns and user verdicts distinct from tool adherence. |
| `skills/README.md` | Workflow documentation | Document on-demand references, rule ownership and Impeccable removal. Replace the unsupported claim that shallow work is only a model/effort problem with outcome-based evaluation. |

Installed state, separately from repository source:

- Resolve the named Impeccable entries before removal. Remove only the `impeccable` skill directories/links from the six homes already enumerated in `bin/patch`.
- Remove only `skills.impeccable` from `/Users/blank/.agents/.skill-lock.json`, after reading the whole file and verifying its actual structure. Preserve every other entry.
- Inspect `bin/patch --check` before execution. If unrelated pending patches exist, apply only the requested deletion rather than changing unrelated installed skills.
- Rebuild generated instructions and install through the existing scripts. Inspect install dry-run first.
- Active sessions may retain previously loaded skill text. Verify discovery in a fresh session; do not claim this conversation forgets Impeccable after file removal.

Generated outputs: `skills/build/claude/rules/*.md` and `skills/build/{codex,grok,pi,opencode}/AGENTS.md`, plus their installed copies/links. These are not hand-edited.

## Decision-bearing text

### Reference understanding and selection

Add to the existing Direction rule:

```diff
+ For vague creative briefs, inspect supplied references and ask focused follow-up
+ questions about the choices that would change the result. Translate informal
+ answers into a concrete working interpretation; confirm unresolved material
+ assumptions before production. Do not make the user author the specification.
+ Research the existing wall, registry and component code before asking for resources.
+ Good ideas can come from anywhere; collections and named designers are starting
+ points, not a fixed shortlist or house style. Follow originals and inspect the work.
+ Define audience problems and section purpose before selecting effects.
+ Present one developed recommendation;
+ when alternatives help resolve a real choice, show at most three strong examples
+ unless asked for more. Keep rejected experiments and research logs out of chat.
+ Explicit user requirements and approved sources govern aesthetic decisions,
+ followed by the incumbent system, task-specific guidance, then generic defaults.
+ Preserve explicit user prohibitions and higher-priority safety constraints.
```

### Acceptance and the hardest requirement

Add to the existing plan workflow, replacing duplicate approval prose:

```diff
+ Record a short acceptance brief in the plan: reproduction/adaptation/original,
+ reference roles, required composition/assets, motion/audio intent, allowed
+ departures, and concrete verification scenarios. Include only relevant fields.
+ Before expanding production, preview the requirement most likely to invalidate
+ the approach. Use representative real assets and actual behavior where feasible;
+ identify simulated or temporary material. Self-review before human presentation.
+ Consolidate creative decisions into one approval. Reopen for a material departure,
+ not a separate palette, layout or implementation milestone already covered.
```

### Private finishing and delivery

Add to shared verification, consolidating overlapping closeouts:

```diff
+ Compare actual renders or playback with relevant inspected benchmarks and the
+ accepted brief. Record weaknesses, experiments and observed changes in artifacts.
+ Use focused runtime checks and fidelity diffs where applicable; introspection alone
+ cannot certify quality. Preserve evidence without presenting every discarded attempt.
+ Inspect the rendered or played result against the accepted brief, repair material
+ defects, and inspect again before presenting it as complete. Exercise the normal
+ audience scenario, not only the implementation mechanism.
+ For motion, inspect the actual transition. For voice, listen when supported;
+ otherwise mark performance quality unverified. Do not infer either from metadata.
+ Deliver the result, a compact evidence link, material deviations and any blocker.
+ Keep detailed research, discarded attempts and routine QA in linked artifacts.
```

### Impeccable removal

```diff
- [pbakaus_impeccable]
- ...entire registration block...
```

New persistent deletion declaration:

```toml
[[patch]]
skill = "impeccable"
op = "delete"
```

This protects the repository's patch workflow. It cannot prohibit someone explicitly reinstalling the skill with an unrelated external command.

## Implementation and verification sequence

1. Read every edited source end to end, inspect build/install/check scripts and current symlinks, preserve unrelated changes, and confirm exact installed lock structure. Save a local recovery copy of the targeted installed skill and lock outside all skill discovery paths before deletion.
2. Make the scoped source edits, remove Impeccable registration/install state, and apply its deletion declaration. No new global quality skill or panel.
3. Build and inspect generated diffs. Reduce always-loaded characters, measuring each agent's before/after counts. Move operational detail to `skills/reference/` reached through explicit absolute-path triggers, retaining requirements and verifying that every pointer resolves. No installer change is needed because this machine uses the dotfiles checkout as source. Add focused pointer/rendering validation only if an existing check cannot cover it.
4. Run existing tests and checks: `python3 -m unittest discover -s skills/tests -v`, `skills/bin/build --check`, `skills/bin/install --dry-run`, `skills/bin/patch --check`, and `skills/bin/check`. Read command implementations first and report unrelated pre-existing failures separately.
5. Verify exact absence of Impeccable from active manifest registration, the shared lock and all six skill homes, including dangling symlinks. A textual mention in the deliberate deletion declaration or historical plan is expected. Re-run removal checking to confirm idempotency. No broad deletion regression-test suite or new enforcement framework.
6. Install the generated instructions and inspect the diff in Plannotator as currently required. This is implementation review, not a second request to choose the creative direction.
7. In a fresh agent session, verify the installed instructions and skill discovery. Record what was actually checked. The current session's skill inventory can remain stale.

### Quality trial after installation

Use the next five eligible substantive creative tasks, consecutively rather than selecting successes. At least one exact-source task should be included when it naturally occurs; do not manufacture work for the trial.

Record task/session locator, first review verdict, repeated-requirement corrections, defects found after claimed verification, approval interruptions, and time to acceptance where timestamps support it. Missing user verdicts remain unknown. Separate new preferences from ignored requirements. Do not score skill/tool invocation as quality.

Record whether each result was kept without major rework, user-found finish defects, and turns to first showable artifact as primary outcomes. Creative time is not a failure when it produces a better accepted result. A provisional pilot target is at least four of five kept without major rework, no repeated ignored requirements, and no added approval interruptions; ask the user to judge usefulness rather than infer it. Five tasks are a pilot, not proof of general improvement. Missing judgments remain unknown.

An optional blind replay can compare one historically rejected task under old and new rules at matched model/tool/budget conditions before the live trial. This is a separately authorized experiment, not hidden extra generation. No reviewer model or automated aesthetic score is installed by this change.

## Scope left out and limits

- No new inspiration archive, mandatory multi-agent council, automatic taste score, or large variant generation. Retain existing sources without promoting any single source to a universal standard.
- Opus advised external evidence, fewer always-loaded instructions and replacing rather than stacking gates. Those changes are incorporated. Its claim that prose rules caused robotic audio is not adopted: the transcript identifies macOS TTS before the complaint. Generic automated checks cannot certify taste; there is no new universal completion hook without a concrete app-specific contract.
- No changes to projects, historical transcripts, unrelated skill installations, model providers or credentials.
- No modification to the separate Compronents checkout that owns the external `blank-direction` skill. Dotfiles owns the clarification/presentation policy; if its installed procedure conflicts in practice, report the conflict before proposing a separate source change.
- Preserve source pinning, exact diffs, requested previews, runtime verification, no-arrow preference, and existing safety rules.
- Instruction installation can be verified immediately. Improved taste and fewer rejected results cannot; they require the prospective trial.
