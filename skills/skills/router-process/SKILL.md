---
name: router-process
description: Index of the slash-only engineering skills, which cannot fire on their own. Read when picking an approach for planning, reviewing, refactoring, triage, TDD, writing, or applying an engineering principle, so a skill that already exists is used instead of improvised.
---

# Process router

56 installed skills carry `disable-model-invocation: true`, so nothing but a typed
`/name` starts them. This index makes them reachable: read the entry, then follow that skill's
SKILL.md directly.

## poteto/plugins pstack

- **architect** — Sketch types, signatures, and module structure before code, then stay in the loop while implementation fills in. Use for /architect, 'architect this',
- **arena** — Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in
- **automate-me** — Use for \"automate me\", \"create/update/refresh my -mode skill\", \"turn/capture my preferences or working style into a skill\", or wanting agents to
- **figure-it-out** — Design an auditable playbook when no narrower one fits: a large migration, an ambitious multi-part change, or work a human reviews after stepping away
- **interrogate** — Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tea
- **poteto-mode** — poteto's agent style for concise, detailed responses, deliberate subagents, unslopped prose, simple code, and verified work. Use for poteto, /poteto-m
- **principle-boundary-discipline** — Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); tr
- **principle-build-the-lever** — Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, gen
- **principle-encode-lessons-in-structure** — Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata flag, 
- **principle-exhaust-the-design-space** — Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare side 
- **principle-experience-first** — Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over mor
- **principle-fix-root-causes** — Apply when debugging. Trace each symptom to its root cause and fix it there; reproduce first, ask why until you reach it, resist nil-check guards that
- **principle-foundational-thinking** — Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get the
- **principle-guard-the-context-window** — Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thr
- **principle-laziness-protocol** — Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest chang
- **principle-make-operations-idempotent** — Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regar
- **principle-migrate-callers-then-delete-legacy-apis** — Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving
- **principle-minimize-reader-load** — Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse o
- **principle-never-block-on-the-human** — Apply when tempted to ask 'should I do X?' on reversible work. Proceed, present the result, let the human course-correct after the fact; reserve confi
- **principle-outcome-oriented-execution** — Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate s
- **principle-prove-it-works** — Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not
- **principle-redesign-from-first-principles** — Apply when integrating a new requirement into an existing design. Redesign as if the requirement had been a foundational assumption from day one, inst
- **principle-separate-before-serializing-shared-state** — Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when
- **principle-sequence-verifiable-units** — Apply to multi-step work (sweeps, migrations, runs of similar edits) and to how you stack commits and PRs. Break work into small units that each end i
- **principle-subtract-before-you-add** — Apply when sequencing an addition, refactor, or rewrite. Remove dead weight, redundant validators, and stub references first, then build on the simple
- **principle-type-system-discipline** — Apply when designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, bra
- **pstack-tdd** — Use only when the user explicitly asks for TDD, a failing test, or a regression test, OR when the bug has an obvious cheap local test target. Skip whe
- **reflect** — Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when 
- **show-me-your-work** — Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision (what, why, evidence, result). Local by defa

## mattpocock/skills

- **ask-matt** — Ask which skill or flow fits your situation. A router over the skills in this repo.
- **claude-handoff** — Hand the current conversation off to a fresh background agent that picks up the work immediately.
- **edit-article** — Edit and improve articles by restructuring sections, improving clarity, and tightening prose. Use when user wants to edit, revise, or improve an artic
- **grill-me** — A relentless interview to sharpen a plan or design.
- **grill-with-docs** — A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **handoff** — Compact the current conversation into a handoff document for another agent to pick up.
- **implement** — Implement a piece of work based on a spec or set of tickets.
- **improve-codebase-architecture** — Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **loop-me** — Grill me about specs for the workflows I want to build, within this workspace.
- **setup-matt-pocock-skills** — Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use o
- **setup-ts-deep-modules** — Wire dependency-cruiser into a TypeScript repo so each package is a deep module — implementation hidden in subfolders, reachable only through its entr
- **teach** — Teach the user a new skill or concept, within this workspace.
- **to-spec** — Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
- **to-tickets** — Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tr
- **triage** — Move issues and external PRs through a state machine of triage roles — categorise, verify, grill if needed, and write agent-ready briefs.
- **ubiquitous-language** — Extract a DDD-style ubiquitous language glossary from the current conversation, flagging ambiguities and proposing canonical terms. Saves to UBIQUITOU
- **wayfinder** — Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on your issue tracker, and resolve them one at 
- **wizard** — Generate an interactive bash wizard that walks a human through a manual procedure — third-party setup, a one-off migration, an A→B state transition — 
- **writing-beats** — Writing, exploit — assemble raw material into a journey of beats, grounding each term before a beat leans on it.
- **writing-fragments** — Writing, explore — mine raw fragments, no structure yet.
- **writing-great-skills** — Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable.
- **writing-shape** — Writing, exploit — shape raw material into an article, paragraph by paragraph.

## dmmulroy/.dotfiles

- **bro** — Restate the last message in plain human language, with no jargon.
- **cloudflare-composition-root** — Composition roots for Hono and Cloudflare. Use when adding a binding-backed service or refactoring raw runtime dependencies out of inner code.
- **coding-standards** — Correct-by-construction TypeScript and Effect standards. Use for TypeScript engineering, Effect code, or when another skill needs the user's coding st
- **herdr** — Control Herdr, a terminal multiplexer for coding agents. Use only when the user explicitly mentions Herdr or asks to use Herdr to inspect or control p
- **recipe-diagrams** — Recipe diagrams: convert any recipe into a high-resolution Cooking for Engineers-style PNG process-flow table with aligned ingredient streams, prepara
