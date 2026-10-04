# Plan review with Plannotator

Read this before preparing a nontrivial implementation plan. Plannotator is the human approval surface. Preview preparation is allowed before approval; production changes are not. Questions about existing systems stay read-only.

## 1. Understand the decision

Read affected code and current behavior. Use Direction's research and clarification procedure when the task has open choices. Inspect the existing wall and relevant component implementations rather than asking the user to supply them again. Record a compact acceptance brief in the plan, including only relevant fields:

- Audience problem, desired outcome, and what each section communicates or demonstrates.
- Exact reproduction, adaptation or original work; the role of each selected reference.
- Required composition, real assets, copy, motion and audio intent.
- Allowed departures, what must stay unchanged in each affected part, unconfirmed assumptions, and named verification scenarios.

Translate informal answers into specific decisions. Ask again where ambiguity materially changes the result. Technical acceptance and creative judgment are separate; automated checks cannot certify taste.

## 2. Develop the representative proof

Identify the requirement most likely to invalidate the approach and demonstrate it at the intended quality before expanding production. For a film, use a representative scene with an actual narrator candidate. For a page, use real content and imagery with its difficult interaction. For backend work, show the named scenario and execution path.

Creative development can take substantial time. Compare actual renders or playback with the accepted constraints and relevant original works. Identify a concrete weakness, test a change, and inspect the result. Study both defects and missed opportunities within the choices left open by the brief; preserve fixed requirements even in exploratory work. Continue while experiments make meaningful progress within the user's budget. Escalate when a weakness persists without progress, capability is unavailable, or the next choice needs human judgment. Do not silently downgrade a difficult requirement.

Present one developed recommendation. Show up to three strong alternatives only when a real decision benefits from them. Research and experiments are not restricted to three. Keep intermediate evidence available, not streamed into chat.

### Match evidence to the decision

| Decision | Review material |
| --- | --- |
| Layout, styling or responsive composition | Current screenshot when available beside the proposed result at matched viewport sizes; show affected desktop/mobile arrangements. |
| Interaction, navigation, state or motion | Runnable representative preview and short recording of trigger, transition and outcome. Include relevant failure/cancel/keyboard/reduced-motion states. A frame strip or storyboard makes key states inspectable. |
| Backend behavior, data flow or architecture | Focused before/after diagram and source-linked walkthrough of the named scenario. Load `subsystem-modeling` when boundaries or dependencies need inspection. |
| Mixed work | Visible scenario linked to its actual code path. |

The representative proof supplies the preview package, not an additional gate beside another mock. A layout-only change does not need a video. Preserve explicitly requested image, SVG or video formats. For browser behavior, use the webreel procedure; native/device/CDP recordings use Argent. Ordinary web interaction checks use Agent Browser. The shared `ui-verification` rule owns surface selection.

Keep previews, fixtures, screenshots, storyboard/poster and recording config under `.plannotator/<change>/` or an isolated checkout. Never wire them into production routes or alter live data before approval. Record named portless URLs and explicit viewport sizes. Label material Current, Proposed preview or Verified implementation. State simulated behavior, temporary assets and unbuilt integrations.

Verify images render, links open and video plays before review. If the renderer cannot embed a format, keep a visible still plus a direct playable link. A proposed preview is not proof that the implementation works.

## 3. Put the plan in front of the user

Save `.plannotator/<change>/plan.md`, normally with these five parts:

1. Goal in three lines: problem, intended result, proof.
2. Visual explanation: overview with at most six nodes, then relevant preview or walkthrough.
3. File responsibilities before and after; identify generated outputs separately.
4. Real decision-bearing diffs and why they matter to the named scenario.
5. Deliberate omissions, preview limitations and unresolved evidence.

Scale file tables and code excerpts to the decision; do not pad obvious changes with boilerplate. Reuse approved material after checking for drift. A subsystem diagram cannot replace visible evidence for a UI decision.

Load the installed `plannotator-annotate` skill, then run:

```sh
plannotator annotate <plan-path> --gate --json
```

Use `--require-approval` when exit status must encode approval. Plain annotate has no Approve button. Wait for the returned JSON. A closed window or successful process exit is not approval. Never submit a human decision through Agent Browser or Argent.

If annotated, revise the same plan and affected proof, then reopen. Approved-with-notes means implement with those notes; do not demand another approval for non-blocking guidance. Consolidate palette, composition and motion choices into this approval. Reopen before applying a material departure or acting on an unresolved blocking choice.

If Plannotator is absent, report once, install with `curl -fsSL https://plannotator.ai/install.sh | bash`, and retry. Keep the plan available.

## 4. Implement and verify

Expand the approved treatment without inventing a second visual language. Leave approved and existing work outside the plan unchanged, even where you see a better option. Prototype a material departure in isolation and reopen before applying it. Review the final diff against the allowed changes and preserved parts; fix defects introduced by the authorized change without treating unrelated dissatisfaction as permission to redesign. Operate the real product and follow shared `ui-verification` for evidence-based finishing. Reuse the same named scenario and viewport; rerun the browser recording config when applicable and label it Verified implementation. Also exercise the flow interactively.

After substantial implementation, load `plannotator-review` and run `plannotator review --json`. Make the implementation evidence and relevant model changes available beside the diff. Fix returned annotations. This reviews the implementation, not the already approved direction.

Deliver one concise closeout with result, evidence, material differences and remaining limitations. Detailed research and iteration records stay in linked artifacts. Do not claim parity from source edits, a build, or an authored walkthrough alone.

## Exceptions

Skip the approval gate for a tiny obvious edit with no design choice, or when the user says "just do it" or "skip planning". Explicitly requested visualizations still apply. An existing approved direction does not need fresh concept exploration for a narrow adjustment. Exact-source tasks follow `fidelity-first` and do not need invented alternatives.
