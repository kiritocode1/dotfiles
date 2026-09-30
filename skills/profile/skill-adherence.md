# Skill adherence audit

## Pre-change baseline, 30 September 2026

The historical [`bin/audit`](../bin/audit) reports user-prompt frequencies, not agent behavior. [`bin/audit-adherence`](../bin/audit-adherence) reads Pi, Claude and Codex action histories, groups events by user turn, and emits safe locators with **candidate** observations. It exports no prompt text, tool arguments or secrets. An automated source candidate may be a catalog URL, not an inspected original. A runtime candidate may be unrelated to the requested behavior. None of the automated fields establishes that a result was useful.

Run from this checkout:

```sh
python3 skills/bin/audit-adherence --before 2026-09-30 --limit 20 --json
python3 -m unittest discover -s skills/tests -v
```

The cutoff excludes tasks started on 30 September, when the rule changes were prepared. The last 20 completed heuristic candidates include 8 Claude, 7 Pi and 5 Codex turns. The candidate extractor marked 2 discovery calls before an obvious edit, 11 possible source inspections and 11 possible runtime checks. **These are not success rates.** The candidate pool includes questions, follow-up fixes and existing-UI adjustments; the heuristic cannot establish eligibility. OpenCode and Grok assistant histories were not scored.

Manual review of the user-turn locators identified two clearly eligible open-direction requests among those 20. Their outcomes are deliberately kept separate from the 18 rejected or ambiguous candidates:

| Agent and locator | Why eligible | Discovery before first choice | Source / decision / verification | Follow-up |
| --- | --- | --- | --- | --- |
| Pi `2026-09-29T16-54-54-997Z_01a0ee17-3b14-732b-a576-9f7ef2be1f12.jsonl`, event 6 | New presentation motion design, open visual direction | No. Direction was read later and discovery followed the user's reminder | Some original research was attempted; whether the inspected source changed the final motion design is unknown without a visual review | User explicitly redirected the agent to BLANK |
| Claude `50f00c80-4350-4ebd-94e3-dfa7ca96c246.jsonl`, event 34 | Replacement careers-page layout | Unknown from the bounded manual pass | Unknown | Not scored as an outcome |
| Claude `d57c7361-7f43-45d4-b30b-e3b82962ab1d.jsonl`, event 2093, outside the 20 but inspected as a sensitivity check | Services-page revamp | Unknown | Unknown | Unknown |

The September 24 six-pillars SVG request at `fa2d6502-4048-4eb5-a4cd-08d005a4d395.jsonl`, event 2018, changes an existing section after a correction; do not call that an eligible new visual system without seeing the preceding design. The Paper carousel task names the existing deck; it also is not a new open visual direction. These exclusions matter. A regex-hit count would incorrectly score them as failures.

There are **not 20 defensibly eligible and completed recent tasks** in this bounded sample. Do not substitute older pre-rule tasks or unrelated skill reads to manufacture that denominator. The baseline establishes one clear timing failure and a sampling gap, not a population success percentage. A deeper retrospective can expand the window and review the original scenarios; record that cohort separately.

## Repeat after new work exists

1. Run `bin/audit-adherence --before <tomorrow> --limit 60 --json` to generate a candidate pool. Review tasks in descending timestamp order. Collect the next 20 **eligible completed** tasks without selecting on their outcomes, and include explicit negative controls for fixed-source work. Preserve only session basename and event ordinal in the report.
2. Score each manually as `yes`, `no` or `unknown`: eligible, trigger before first choice, original source inspected, decision changed by that source, task-specific runtime or context evidence, and a same-task correction. A skill read is neither inspection nor adoption. A catalog hit is neither. Do not infer absence from a missing tool when the host had other tool surfaces.
3. Report per-field numerators and denominators by agent and task type. Keep unknown separate. Compare with this baseline only for matching eligibility and agent cohorts. Review cases with corrections for causal relevance. Do not announce improvement immediately after rebuilding generated rules.
4. Keep the routers until eligible Claude tasks demonstrate that the underlying skills are found without them. A low invocation count is not enough to retire a router, and the Pi host does not install all Claude-only router skills.

The audit does not inspect production Direction feedback or claim user acceptance from terminal traces. Existing uncommitted Compronents work was preserved.
