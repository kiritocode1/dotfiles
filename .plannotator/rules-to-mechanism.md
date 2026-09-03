# Move three rules out of AGENTS.md, and make wa actually fire

**Now:** `anydoc`, `agentation` and `wa-update` cost 11,375 chars of standing
context across agents. anydoc is a worse copy of a skill that already exists.
wa-update asks for judgment at the exact moment the agent is optimising to finish,
and produced 2 genuine sends in a month.

**After:** anydoc and agentation live in skills that load on match. wa's two
mechanical triggers move to hooks the harness runs, so agent compliance stops
being a factor. ~10,000 chars off standing context.

**Proof it landed:** `bin/check` passes, `bin/build` reports the smaller
AGENTS.md, and a >5 min turn finished with the terminal in the background
produces a WhatsApp message with no agent involvement.

## The one idea

```
today   AGENTS.md  ->  agent judgment  ->  2 sends / month
after   hook       ->  harness acts    ->  deterministic
        skill      ->  loads on match  ->  reference, 0 standing cost
```

Everything below is that move applied three times.

## Evidence this is the right cut

Measured over 12,836 user turns, 2026-08-04 to 2026-09-03.

| claim | number |
| --- | --- |
| real `wa me` in a user message | 0 |
| genuine unprompted `wa send` | 2 |
| `PushNotification` calls, despite being enabled | 0 |
| `Skill` invocations against 11,795 tool calls | 13 |
| agentation mentions | 8 prompts, 0.1% |

The wa rule is not being disobeyed occasionally. Its `wa me` trigger has never
once been exercised, and its unprompted triggers fire about twice a month.

## Files

| File | Today | After |
| --- | --- | --- |
| `rules/shared/anydoc.md` | 1,508 chars in 3 agents' context | deleted; the skill is already a superset |
| `rules/shared/agentation.md` | 3,422 chars, Claude only | deleted; its 4 priority rules move into the skill body |
| `rules/shared/wa-update.md` | 1,143 chars of triggers agents skip | ~350 chars, the one judgment case only |
| `rules/tiers.toml` | lists all three in `shared` | anydoc and agentation removed from every tier |
| `vendored/firecrawl/patches.toml` | does not exist | one `frontmatter-set`, so the nudge survives reinstalls |
| `vendored/agentation/patches.toml` | does not exist | `frontmatter-set` + `append` for the priority rules |
| `~/.claude/hooks/wa-auto/wa-auto.sh` | does not exist | the three triggers, ~80 lines |
| `~/.claude/settings.json` | peon-ping on 9 events | adds wa-auto on 3 of them |

## anydoc: delete, do not compress

The rule and the skill are near-identical, and the skill is the better copy. It
documents exit codes and the per-registry library names; the rule does not. The
only thing the rule adds is one nudge, which becomes part of the skill's trigger
so it keeps working without standing cost.

```toml
# vendored/firecrawl/patches.toml
[[patch]]
skill  = "convert-documents-to-markdown"
op     = "frontmatter-set"
key    = "description"
value  = "Convert Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV and PDF files to GitHub-Flavored Markdown. Use whenever a task needs the contents of one of those files. Do not guess a document's contents from its filename, and do not skip the conversion."
reason = "The deleted anydoc rule carried this nudge. Moving it into the description keeps the trigger and drops 1,508 chars from every agent's standing context."
```

Net: -4,524 chars of rule, +~80 of description.

## agentation: not a clean delete

anydoc's skill was a superset. agentation's is not. The `agentation` skill
describes installing the toolbar and nothing about using annotations, so it will
never fire on the work itself:

```
description: Add Agentation visual feedback toolbar to a Next.js project
```

Four things in the rule have no skill home. The load-bearing one is the
coordinate rigor, which is the same class of mistake as `argent`'s tapping_rule:

> Annotation coordinates are reported against the viewport size active when the
> annotation was made, which may not match the current session's viewport.
> Recompute by normalized fraction or actual element match.

So the rule is deleted only after that content lands in the skill:

```toml
# vendored/agentation/patches.toml
[[patch]]
skill  = "agentation"
op     = "frontmatter-set"
key    = "description"
value  = "Agentation visual feedback toolbar: install it in a Next.js project, and read, acknowledge, fix and resolve the annotations it produces. Use when iterating on a running UI from the user's own annotations, when mcp__agentation__* tools are present, or when the user pastes a 'Page Feedback' block."
reason = "The install-only description meant the skill never fired for the usage loop, which is what the deleted rule actually covered."

[[patch]]
skill  = "agentation"
op     = "append"
value  = """
## Working from annotations

- Prefer `agentation_watch_annotations` in a loop: acknowledge, fix, resolve with
  a summary, watch again.
- An annotation's bounding box and element path are a lead, not an answer. Map it
  back to the real DOM element before changing anything. Coordinates are recorded
  against the viewport active at annotation time, which may differ from this
  session's. Recompute by normalized fraction or actual element match.
- Feedback pasted by hand carries the same weight as feedback via MCP.
- Do not remove or further gate `<Agentation />` in the root layout unless asked.
"""
reason = "Verbatim from the deleted rule. Same guidance, loaded on match instead of standing in context."
```

Net: -3,422 chars of rule, +~200 of description.

## wa-update: the actual fix

Two of the three triggers need no agent cooperation at all, which is the whole
point. The rule keeps only what genuinely requires judgment.

| Trigger | Today | After |
| --- | --- | --- |
| `wa me` in a message | prose, never exercised | `UserPromptSubmit` hook injects a directive into the live turn |
| long job done while away | prose, ~2 hits/month | `Stop` hook sends it directly, no agent involvement |
| about to block on you | prose | `Notification` hook, the event that already means "needs input" |
| judgment: worth interrupting? | prose | stays prose, ~350 chars |

The away check is not new work. peon.sh already decides whether you are watching,
and I reuse that shape rather than inventing one:

```bash
# ~/.claude/hooks/wa-auto/wa-auto.sh
EVENT=$(jq -r '.hook_event_name' <<<"$INPUT")

case "$EVENT" in
  UserPromptSubmit)
    # Cannot compose the status itself, so it puts the instruction in this turn,
    # where a standing rule was being skipped.
    if grep -qiE '\bwa me\b' <<<"$(jq -r '.prompt' <<<"$INPUT")"; then
      jq -n '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",
        additionalContext:"The user wrote `wa me`. Before finishing this turn, run `wa send` with a short status: what you are doing, where it stands, what you need. This is not optional."}}'
    fi ;;

  Stop)
    # Fully mechanical. No agent involvement, so nothing to disobey.
    elapsed=$(( $(date +%s) - $(cat "$STATE/turn_start" 2>/dev/null || date +%s) ))
    [ "$elapsed" -lt 300 ] && exit 0
    terminal_is_focused && exit 0          # you are watching, stay quiet
    wa send -t "$(basename "$PWD")" "done after $((elapsed / 60))m: $(tail -1 "$STATE/last_summary")" ;;

  Notification)
    terminal_is_focused && exit 0
    wa send -t "$(basename "$PWD")" "blocked, needs you: $(jq -r '.message' <<<"$INPUT")" ;;
esac
```

`wa` already caps at 8/hour and spools on exit 7, so a runaway hook is bounded by
the tool rather than by the hook being careful.

The rule then shrinks to what a hook cannot decide:

```diff
- # WhatsApp updates
- ## On demand, `wa me`
- When I write `wa me` anywhere in a message, send a WhatsApp status update
- before you finish the turn: what you are working on, where it stands, and
- anything you need from me. [...]
- ## Unprompted, only these three
- 1. You are about to block on me: a decision, a secret, a review.
- 2. Something long, over 5 minutes, finished or failed while I might be away.
- 3. I asked to be notified about this specific task.
- Nothing else. [...] The cap is 8 per hour.
+ # WhatsApp updates
+ Hooks handle `wa me`, long finished jobs, and blocking on me. You do not need
+ to decide those.
+ The one case left to you: I asked to be notified about this specific task.
+ Then `wa send "..."`, and read the exit code, not the printed text.
+ If this session came from `wa watch`, your stdout is the reply. Do not run `wa send`.
```

Net: -2,379 chars, and the triggers stop depending on compliance.

## Verification

1. `bin/build` reports codex and pi at ~52,700 chars, down from 62,206.
2. `bin/check` passes with no new failures.
3. `bin/patch --check` reports both new patch files as applied.
4. `wa doctor` still green.
5. Live test: a >5 min turn with the terminal backgrounded produces a message.
   A >5 min turn with the terminal focused produces nothing.

## What I am not doing

- Not touching `argent` (14,301 chars, the largest single item). Its
  `skill_routing` block is the same duplication, but it backs 951 real tool calls
  and deserves its own pass rather than being folded into this one.
- Not touching `portless`, `waiting` or `context7`, the other three rules the
  data shows are not changing behavior. Same reasoning: separate decisions.
- Not deleting any skill. This moves content into skills, it does not remove any.
- Not adding a pi or codex hook. Those runtimes have their own hook stories and
  this plan only wires Claude Code, where the events are already proven.
- Not touching `PushNotification`. It is at 0 calls and overlaps the Stop hook,
  but deciding between the two channels is a separate call I would rather you make.
