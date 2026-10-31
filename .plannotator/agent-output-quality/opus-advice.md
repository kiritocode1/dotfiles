Contents for `/Users/blank/dotfiles/.plannotator/agent-output-quality/opus-advice.md`. This run had no write tool, so the runtime needs to persist this text.

---

# Advisory review: agent output quality plan

**Model.** This run's system prompt names the model as Opus 5.5, ID `claude-opus-5-5`. I have no other way to check that.

**Scope.** This run had no tools. I could not open `.plannotator/agent-output-quality/plan.md` or the audited threads. I reviewed the plan from the handoff summary and the global rules loaded into this session from `skills/build/claude/rules/`. I had no line numbers, so pointers are file plus section heading. Anything marked as a hypothesis is my reasoning, not something the sources show.

## Verdict

The plan names the right symptoms but treats them as one problem. They are three, and each needs a different fix.

1. **Floor defects.** These are approximation despite exact references, and finish defects the user catches. Tools and blocking checks fix these. Instruction text already covers them and has not worked.
2. **Taste defects.** These are meaningless motion and repetitive imagery. Instructions help a little. Moving the human's choice earlier helps more.
3. **Voice defects.** This is the robotic narration. The current rules partly cause it.

The strongest evidence comes from the user's own measurements, and the plan underweights it:

- `context7.md`, opening section: "ctx7 fired 20 times against 298 WebFetch and WebSearch calls. The rule was being read and skipped, so it is now a precondition on the tools."
- `waiting.md`, opening section: "751 `sleep` calls against 2 `Monitor` calls."
- `fidelity-first.md`, Procedure steps 1 to 5, already requires pinning the source, extracting values, diffing, and "Report the diff, not a claim." The audit still found approximation despite exact references.

So a fidelity rule already existed and failed. From the summary, every proposed change is more instruction text, and none is a check that blocks completion.

## What holds up

- **Fewer examples.** Hypothesis: many references get averaged into output that resembles none of them, which matches the approximation finding. Sharpen the cap: one primary reference, plus at most two others, each tagged with the single attribute it contributes, such as type from one source and motion from another.
- **Hardest-part proof before expansion.** This is the best item in the plan. It should be real code at real fidelity, not a mock.
- **Impeccable removal.** I treat this as decided. The assumption around it still needs checking. Removing one design skill barely lowers the number of gates, because `direction-first.md`, `aryan-voice.md`, `plannotator.md`, `unslop.md` and the closeout section of `ui-verification.md` all still fire on a new UI task.

## What is weak

**Private self-review.** This is a hypothesis from general model behavior, not from these sources. Self-critique without an outside signal mostly approves its own work, because the critic shares the generator's context and blind spots. It filters well only when it has to check against something the generator did not write. Examples are a pixel diff against a pinned reference, a screenshot at a named viewport, or a script that lists overflowing elements. Making the review private makes it worse, because the user cannot audit it and the trial cannot measure it. A stronger version is a fresh-context reviewer that sees only the reference and the screenshots and is asked to list differences, not to approve. `about-me.md`, "Match ceremony to the task", explicitly allows delegation for adversarial review.

**Clarification.** The median prompt is 46 characters (`working-with-me.md`, opening). A clarifying question on every vague prompt adds a turn to most tasks. Ask only when two readings would produce materially different artifacts. Otherwise state the assumption in one line and build. A better option is to let the direction step do the clarifying, as in change 2 below.

**Gates stack instead of replacing each other.** Under the current rules, a new UI component goes through all of these:

- `direction_discover` (`direction-first.md`)
- loading the voice skill (`aryan-voice.md`)
- a current screenshot, a proposed SVG, a webreel video, a storyboard, and the Plannotator gate (`plannotator.md`, "Show the proposed change before approval")
- the implementation
- a webreel rerun, an interactive check, and `plannotator review --json` (`plannotator.md`, Workflow steps 6 and 7)
- current-versus-changed evidence (`ui-verification.md`, "Closeout evidence")
- naming the inspected source at closeout (`direction-first.md`)

That list is the "excessive ceremony" finding, traced to source. The plan's direction approval and hardest-part proof have to replace these gates. Added on top, they make the problem worse.

**The 5-task trial.** Five different tasks, with normal run-to-run variance, give a weak signal. Fix the metric before starting: whether the output was kept without major rework, how many finish defects the user finds, and how many turns it took to reach the first showable artifact.

## Instructions, tools, or capability

**Instructions can fix:**

- the order of work, so the hardest part comes first
- unmotivated motion, by requiring each animation to name the state change it signals
- reference pinning and the example cap
- narration length

**Tools have to fix:**

- **Fidelity.** Pixel diffs and comparisons of extracted tokens.
- **Finish defects.** A script run at two viewports that reports overflow, clipped text, contrast failures and console errors. `agent-browser eval` can run it.
- **Motion review.** The agent mostly sees still images. It needs frame strips, or easing curves extracted from the source.

**Likely capability limits (hypothesis):**

- **Taste.** By default the model produces a competent median, and its images drift toward common tropes, which matches the repetitive imagery finding. Telling it to be original does not change that. Specific references, deliberately different candidates, and a human pick do.
- **Expectations.** Rule and tool changes should raise the floor a lot and the ceiling a little. If the goal is to be impressed, the user stays art director at one early decision, and the job is to make that decision cheap.
- **Voice.** `unslop.md`, "Adding soul", turns voice into a formula: "Short sentences. Then longer ones..." My hypothesis is that the model applies this mechanically and produces a choppy rhythm that reads as robotic. Thirty-one bans plus punctuation bans define a voice only by what it avoids. Real samples of the user's own writing should work better. I did not read the `aryan-voice` skill, so I cannot say whether it already has them.

## Top three changes

1. **Replace self-review with checks that produce artifacts and block completion.** Run the finish script for every UI task and a pixel diff for every fidelity task. The completion message cites the artifacts. Enforce it with a hook, the same move `context7.md` describes.
2. **Move the user's choice to the start.** In one step, build two or three deliberately different proofs of the hardest part as cheap real code, and let the user pick one. This step replaces clarifying questions, replaces `direction_discover` when the user supplied references, and replaces Plannotator's mock-preview package for UI work. The 90% discard then happens at the cost of a quick proof, not a finished build.
3. **Cut the always-on rules instead of holding them flat.** This run is a read-only memo in a dotfiles repo, yet it loaded Argent tap rules, portless naming, webreel config and the full Plannotator workflow. Move argent, webreel, portless, the ui-verification workflow and subsystem modeling into on-demand skills. Hypothesis: the more rules are loaded, the less attention each gets, which fits the read-and-skipped data.

## Delete or shrink

- `plannotator.md`, "Show the proposed change before approval": drop the UI rows that require a proposed image or SVG, webreel and a storyboard before approval. Keep Plannotator for backend and architecture plans, and for when the user asks for a plan.
- `plannotator.md`, Workflow step 7: drop the second review gate for UI work that change 1 already verified.
- `plannotator.md`, "Explain systems with subsystem models": move out of the global rules into the existing skill.
- `ui-verification.md`, "Argent workflow": this repeats `argent.md`.
- `mannered-prose.md`: merge into `unslop.md` item 27, which says the same thing.
- `unslop.md`, "Adding soul": delete. The file says "edit upstream, not here", so this needs a local override or un-vendoring.
- `direction-first.md`: skip discovery whenever the user supplied references, not only when they supplied an exact source.
- Closeout narration: cut everything beyond the artifact link, what was diffed, and what is still unverified, per `working-with-me.md`, "Short answers".

## First experiment

Run a blind replay.

1. From the audited threads, pick two discarded tasks whose references still exist. One should be a UI fidelity or motion task, the other a narration or copy task.
2. In separate worktrees, rerun each original prompt twice. Arm A uses the current rules. Arm B uses the trimmed rules plus changes 1 and 2.
3. Randomize the labels. The user picks the keeper and spends five minutes listing finish defects in each output.
4. Record what was kept, the defect count, turns to the first showable artifact, and tokens used.

If B wins, or ties at lower cost, run the 5-task forward trial. If A wins, the bottleneck is not instruction text, and the next step is tooling or model routing. Two tasks with one sample each is an anecdote, so run two samples per arm if cost allows.

## Missing from the plan

- **A set of kept outputs.** The user supplied many inspirations, but nothing I saw records which agent outputs they kept and why. That set is the best working definition of "studio-level".
- **Routing.** Imagery may need an image model or human art instead of a coding agent.
- **A success threshold.** The plan should state what keep rate would justify the change.

## Source versus hypothesis

- **Source.** The rule quotes and section pointers above.
- **Handoff only, not verified by me.** The audit findings and the plan summary.
- **Hypothesis.** How self-critique behaves, references averaging out, the "Adding soul" formula producing choppy prose, attention dropping as rules grow, and the floor-versus-ceiling expectation.

---

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Advisory memo returned above. It challenges the diagnosis with sourced rule pointers from context7.md, waiting.md, fidelity-first.md, plannotator.md, ui-verification.md, unslop.md, direction-first.md and working-with-me.md. It gives three changes, a deletion list and a blind replay experiment, and separates source evidence from hypotheses."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [],
  "validationOutput": [
    "No commands run. This run had no tools."
  ],
  "residualRisks": [
    "plan.md was not read. The review relies on the handoff summary, so the plan may already cover enforcement or deletions.",
    "Audit findings are secondhand and were not checked against the threads.",
    "Claims about self-critique, reference averaging and rule dilution are hypotheses, not measured here.",
    "Pointers use section headings, not line numbers.",
    "The aryan-voice skill and plannotator skills were not read."
  ],
  "noStagedFiles": true,
  "diffSummary": "No files changed. The memo text is returned for the runtime to persist at the configured output path.",
  "reviewFindings": [
    "No blockers. Main finding: the plan adds instruction text where the user's own data in context7.md and waiting.md shows rule text gets skipped. Fidelity and finish quality need checks that block completion, and the new gates should replace existing Plannotator and direction gates, not stack on them."
  ],
  "manualNotes": "This run had no tools, so the reviewer could not read plan.md, call contact_supervisor, call ExitPlanMode, or write opus-advice.md. The full memo is in the response for the runtime to persist. The model identity comes from the system prompt: Opus 5.5, claude-opus-5-5."
}
```