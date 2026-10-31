No tools are available in this run, so the complete artifact for `/Users/blank/dotfiles/.plannotator/agent-output-quality/claude-boundary-advice.md` is below. I edited no files and ran no tests.

# Boundary advice: exact work, approved work and agent improvements

Reviewer: Claude Opus 5.5 (`claude-opus-5-5`), taken from the runtime's model statement. This is a read-only review of the source texts in the handoff.

## Verdict on the parent proposal

Keep two of the four ideas and drop two.

- **Four-mode taxonomy.** Drop it as a new section. plan-review §1 already records "Exact reproduction, adaptation or original work". Its Exceptions cover narrow adjustments and existing approved direction. direction-first already skips discovery for narrow and exact work. Modes also apply to parts of a task, not whole tasks. "Copy this hero 1:1 and add a pricing section" is two modes in one request, and a single label would misclassify half of it. A per-part preserve list handles mixed work better.
- **Missing fidelity evidence blocks fidelity claims.** This is already stated twice, in fidelity-first step 5 and in ui-verification ("missing required evidence block an unqualified completion claim"). A third copy adds nothing. The gap is the word "unqualified", which lets "looks identical" or "near pixel-perfect" pass as a qualified claim.
- **Allowed versus must-preserve boundary.** Keep it as one field change. plan-review §1 has "Allowed departures" but no field for what must stay unchanged.
- **Unsolicited improvements are proposals.** Keep it. This change matters most, but it belongs where the rules currently authorize improvements.

## Findings from the source texts

1. **The finish loop authorizes redesign of approved work.** ui-verification says "Identify concrete weaknesses, test changes and inspect again. Check both finish defects and missed opportunities to explain the product." That loop runs at every UI delivery, including exact and narrow tasks. Nothing limits "test changes" to the brief. direction-first repeats the same permission ("test improvements, and compare again"). This is the most likely cause of the behavior the user is worried about.
2. **"Preserve correct existing work" lets the agent decide what is correct.** This is in plan-review §4. An agent that thinks a section is weak will treat it as incorrect.
3. **Departures are handled after the fact.** "Reopen only for a material departure" says when to ask. It does not say to ask before applying the change. Preview isolation covers only work done before approval.
4. **Nothing forbids fixing the source while copying it.** fidelity-first's Additions section constrains new material but says nothing about "improving" the original.
5. **The approved plan is missing from direction-first's aesthetic priority order.** An agent could read "task-specific craft guidance" as outranking it.

These three are hypotheses I have not verified:
- "Within the user's budget" is undefined, so agents may treat it as unlimited.
- The fidelity value test is partly circular, because the agent writes it from its own extraction. The pixel diff is the independent check.
- The trigger phrase "same as" may fire the full pin-and-diff procedure for trivial token matches.

## Recommended edits

There are five small edits in four files, and the last one is optional. After editing, rebuild the generated copies under `skills/build/`. I did not confirm the build command.

**A.** In `skills/rules/shared/ui-verification.md`, Finish section, replace "Check both finish defects and missed opportunities to explain the product." with:

> Fix finish defects, meaning places where the output fails the accepted brief, the source or a check. Missed opportunities to explain the product are proposals unless the brief leaves that choice open. Prototype them in isolation and list them in the closeout. Do not apply them to approved or reproduced work.

**B.** In `skills/reference/plan-review.md`, make two replacements.
- In the §1 bullet, replace "Allowed departures, unconfirmed assumptions, and named verification scenarios." with:
  > Allowed departures, what must stay unchanged, unconfirmed assumptions, and named verification scenarios.
- In §4, replace "Preserve correct existing work." with:
  > Leave approved and existing work outside the plan unchanged, even where you see a better option. Prototype a material departure in isolation and reopen before applying it.

**C.** In `skills/rules/core/fidelity-first.md`, make two edits.
- Add to Anti-patterns:
  > Do not fix, modernize or tidy the source while copying it. Reproduce it as it is and list proposed changes in the closeout.
- In step 5, replace `"Matches" without a diff is unsupported.` with:
  > Without a pixel diff, report fidelity as unverified. "Matches", "looks identical" and "close" are all unsupported.

**D.** (optional) In `skills/rules/core/direction-first.md`, replace "explicit user requirements and approved sources come first" with "explicit user requirements, the approved plan and approved sources come first".

## Keeping ingenuity

These edits move improvements from the deliverable into the closeout. The agent still has and develops its ideas.
- Open exploration and work before approval keep the full research and iteration loop. direction-first discovery and plan-review §2 are unchanged.
- After approval, the agent builds an idea in `.plannotator/<change>/`, which the rules already reserve for previews. The user then makes one decision instead of reverting an unwanted diff.
- Defects stay fixable without asking. This prevents the opposite failure, where an agent ships a known overflow because it was "out of scope".

## Behavioral tests (not run)

1. **Flawed source.** The prompt is "Copy this pricing card 1:1." The source uses 23px padding where everything else uses 24px.
   - Pass: the output keeps 23px, a pixel diff is attached, and the closeout proposes 24px.
   - Fail: 24px appears in the diff.
2. **Unreachable source.** The prompt is "Make it exactly like this" with only a screenshot of a WebGL scene.
   - Pass: the closeout says the source could not be pinned and fidelity is unverified.
   - Fail: the closeout says "matches" or "visually identical".
3. **Narrow change to an approved page.** The prompt is "Bigger CTA on mobile." The hero copy is weak, and the CTA text overflows at 320px.
   - Pass: the CTA is resized, the overflow is fixed, the hero is unchanged in `git diff`, and the hero idea is listed as a proposal.
   - Fail: the hero is edited, or the overflow is left because it was "out of scope".
4. **Open brief.** The prompt is "New onboarding page, figure it out."
   - Pass: discovery runs, the agent presents one developed recommendation with at most three alternatives, and it applies improvements freely inside the preview before approval.
   - Fail: the agent stalls or files every idea as a proposal. This test checks that the edits did not overcorrect.

## Residual risks

- "Material" and "defect" still need judgment. Test 3 is the check for that.
- The pixel-diff threshold is unspecified, so an agent could loosen it after seeing the results.
- The generated `skills/build/` copies will drift if they are not rebuilt.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Memo critiques all four parent proposals against quoted source lines (ui-verification finish loop, plan-review §1 and §4, fidelity-first step 5 and Additions, direction-first priority order), gives exact replacement wording with file and section, separates source-supported findings from hypotheses, gives 4 behavioral tests, and lists residual risks."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [],
  "validationOutput": [
    "No commands or tests run. The review used only the source texts supplied in the handoff."
  ],
  "residualRisks": [
    "'Material' and 'defect' remain judgment calls even after the edits",
    "Pixel-diff threshold is unspecified and could be loosened after the fact",
    "Generated skills/build copies drift unless rebuilt; build command not confirmed",
    "Behavioral tests are proposed, not executed"
  ],
  "noStagedFiles": true,
  "diffSummary": "No diff. Advisory memo only, returned in the response for the runtime to persist.",
  "reviewFindings": [
    "major: skills/rules/shared/ui-verification.md Finish section - 'missed opportunities' plus 'test changes' authorizes unscoped changes to approved and reproduced work",
    "minor: skills/reference/plan-review.md §4 - 'Preserve correct existing work' lets the agent judge what is correct",
    "minor: skills/rules/core/fidelity-first.md step 5 - 'unqualified' wording allows hedged visual-match claims",
    "no blockers"
  ],
  "manualNotes": "Model identity is from the runtime statement (Opus 5.5, claude-opus-5-5). No tools were available, so the artifact is returned inline. I staged nothing but could not inspect the git index. The parent's four-mode taxonomy is not recommended because plan-review already records the classification and modes apply per part, not per task."
}
```