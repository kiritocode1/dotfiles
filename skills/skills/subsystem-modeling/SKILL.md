---
name: subsystem-modeling
description: Subsystem modeling for source-linked system explanations, code-usefulness analysis, proposed architecture, debugging, migrations, and model maintenance. Use when these tasks need inspectable dependencies, process boundaries, or execution walkthroughs, including from a Plannotator plan.
---

# Subsystem modeling

Explain a named behavior through its actual code. Use Principal AI's Subsystem Model format and
Subsystems Studio for interactive inspection. A small explanation may need only a focused diagram
and source links. Preserve the user's requested format.

## 1. Bound the question

Identify the target checkout, revision, dirty changes, entrypoint, and scenario. Read the source
that supplies and consumes the values involved. Reuse existing models after checking their source
revision. Keep one subsystem per model, usually 4 to 15 constructs, with linked submodels for
larger systems. Keep an existing-system question read-only except for its explanatory artifacts.

Finish with a named question, exact source scope, and the outcome the walkthrough must explain.

## 2. Select the views and evidence

Use constructs for declarations and purpose, static topology for imports/types/modules, runtime
topology for deployment boundaries, and walkthroughs for execution order. Read the relevant rows
of [Use cases](references/model-format.md#use-cases) for the evidence this task needs.

For code usefulness, trace the consumer, outcome, guarantee, and consequence of removal or
replacement. Check dynamic registrations, framework entrypoints, jobs, flags, and external
consumers when relevant. A scoped graph's missing edge does not establish dead code. Usage and
cost claims need usage and cost evidence; absent telemetry stays unknown.

Finish with the selected views, named scenarios, and evidence needed to answer the question.
Separate source facts, inferred intent, observed runtime behavior, and proposed changes.

## 3. Build the model

Before authoring JSON, read [Format](references/model-format.md#format) and its example. Use exact
declared symbols, stable IDs, repository-relative files, and the real repository/package identity.
Give each construct a verb-first purpose. Group file membership with `module` and deployment
membership with `process`; represent outside systems and non-code actors explicitly.

Put structural claims in `relations`. Put runtime behavior in `walkthroughs`, one named story
per path, with ordered call, read, write, registration, or handoff sites at real `file:line`
locations. Follow the values through the code; use separate stories for materially different
branches. Usually 2 to 8 steps make a story readable.

For design work, keep separate current/proposed models and retain IDs for unchanged constructs.
Mark future constructs `proposed: true`. Show future hops without real source sites in a proposed
diagram or isolated prototype instead of inventing locations. Proposed code follows the user's
Plannotator gate; inspecting or correcting a model is a separate action.

Finish when every component has a real anchor or explicit actor/proposal status, every endpoint
resolves, and every walkthrough step has a source site that explains the hop. Put reasoning,
measurements, source revision, and uncertainty in a companion note, outside the portable schema.

## 4. Validate and exercise

Validate JSON against the pinned schema and check unique IDs and every endpoint. Verify declared
symbols and source sites against the checkout. Use AST/Graphify evidence when available and report
parser/cache gaps. Read [CLI](references/model-format.md#cli) before creating or opening the model,
and [Verification limits](references/model-format.md#verification-limits) before reporting results.

Create or reopen the model with local root bindings, save its ID, and inspect the stored result
and supported audit findings. A successful save does not establish that the viewer opened.
Exercise the actual application when making runtime claims; a walkthrough is an authored account
until execution supplies evidence.

Finish with separate results for schema/endpoint validation, source checks, viewer opening, and
runtime verification where relevant. Correct demonstrated contradictions. For unavailable checks,
name what remains unverified instead of claiming success or silently substituting a weaker check.

## 5. Present the explanation

Show a short overview and the scenario's walkthrough with source links. Explain how each relevant
component contributes to the outcome and what evidence remains missing. For Plannotator, include
a readable model still and a way to inspect the full model, beside the decision they explain.
UI work also needs the layout and behavior previews required by the Plannotator rule.

Finish when the requested artifacts open, the source links resolve, and the explanation answers
the original question at the stated evidence level. Report any delivery failure explicitly.

## 6. Maintain affected models

Keep reusable portable models in the project, normally `docs/subsystems/<name>.json`, with a short
index or note recording the question, source revision, local model ID, evidence, and update command.
Keep proposal versions with their review plan. Preserve existing project conventions.

On an affected code change, update the model's locations and walkthroughs in the same work. Clear
`proposed` after code exists and source checks pass. Preserve model, component, and relation IDs.
Use correction proposals with rationale where review is needed; read the CLI reference first,
including its auto-accept behavior. Apply corrections only within the scope already authorized.

Finish when every affected model is updated and rechecked, with remaining gaps recorded. Maintain
during the task; recurring monitoring and public sharing require their own user request. Keep
local roots in unshared host bindings rather than portable documents.
