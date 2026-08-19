---
name: blank-mode
description: How blank works. Read at the start of any substantive task in this environment, and whenever choosing between the installed skills, principles, or routers. Covers which agent is being used for what, the six failure modes that recur here, and which playbook fits the request.
---

# blank mode

The routing layer over everything installed here. It is model-invocable on purpose: the audit that
produced it found that 28 of 30 slash-only skills had never been typed once in 6,961 prompts. A router
you have to remember to type reproduces the failure it exists to fix.

Read `profile/how-i-work.md` in `dotfiles/skills` for the full evidence. This is the operational
short form.

## Always on, no matter the playbook

Four rules load on every turn and are not optional: `unslop` (writing), `direction-first` (research
tools through the second brain first), `fidelity-first` (1:1 work), `read-before-edit`. Do not restate
them, follow them.

## The six failure modes

These come from 359 correction prompts. Each one has a fix already installed.

| What goes wrong | Reach for |
|---|---|
| Built something that is not actually 1:1 | `fidelity-first` rule |
| Edited a file that was only partly read | `read-before-edit` rule |
| Rewrote code that was already correct | `principle-subtract-before-you-add` |
| Said done without running it | `principle-prove-it-works` |
| Stopped at a plan instead of finishing | `principle-outcome-oriented-execution` |
| Lost the thread on long work | `principle-guard-the-context-window` |

## Playbooks

**An image plus a few words.** The picture is the spec; the words point at the part that matters.
12.6% of prompts arrive this way. Ask which element is meant before changing anything across the
page. Verify with `argent-screenshot-diff` or `agent-browser`, chosen by `ui-verification`.

**"Make it 1:1" or a linked source.** Follow `fidelity-first` exactly: pin the source into
`reference/`, extract real values, name the mechanism in one sentence, diff. Never eyeball. This is
the single most-corrected category.

**"What should I use for X."** `direction-first` fires. Look it up in the registry and wall, cite
`reg_` or `insp_` ids, and never name a library from memory first.

**Something is broken.** `read-before-edit`, then `principle-fix-root-causes`. Reproduce, trace to the
cause, say the cause in one sentence, then fix only that.

**Build a feature.** Plan first when the work touches more than a couple of files. The `plannotator`
rule governs the review, and it is not optional for multi-file work.

**Ship it.** 7.4% of prompts are push or commit; 4.3% are deploy. Never commit or push unless asked.
When asked, carry it to a verified end, not to a plan.

**Agent plumbing.** Skills, rules, MCP, hooks, memory. Read `writing-for-agents` before authoring any
of it, and rebuild with `bin/build && bin/install` rather than editing installed files.

## Reaching the rest

56 skills here are slash-only and cannot fire on their own. `router-process` indexes the engineering
ones, `router-design` indexes the 129 design and motion skills that live in Codex. Read the relevant
router rather than guessing that a skill exists.

## Style

Short answers. The median prompt in this environment is 46 characters; length is not thoroughness.
Show the mechanism, not the feeling: which value, which file, which line. Expect correction mid-flight
and take it plainly, without re-explaining the previous attempt.
