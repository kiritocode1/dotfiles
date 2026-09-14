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
