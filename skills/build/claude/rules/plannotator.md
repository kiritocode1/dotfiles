# Plan review: Plannotator

https://plannotator.ai/ is how I review plans. Chat is not the review surface. I annotate, cut scope,
and approve there. Do not start implementing a planned change until Plannotator returns Approve or
Approve with Notes.

## When this applies

Write a plan and open it in Plannotator before implementation whenever the work is more than a tiny,
obvious edit: new features, refactors, architecture, multi-file changes, migrations, "how should we
build this", or anything I would reasonably want to shape first.

Skip only when I say "just do it" or "skip planning", or the change is a typo or one-liner with no
design choice.

## Workflow

1. Write the plan as Markdown. In Claude Code that is plan mode's plan file. Elsewhere write a repo
   file such as `PLAN.md` or `.plannotator/<name>.md`. Include goal, approach, files to touch, risks,
   and what you will not do. A chat-only outline is not a plan I reviewed.
2. Hand it to me and stop.
   - Claude Code: exiting plan mode (`ExitPlanMode`) opens Plannotator through the plugin hook. Let
     it. If that hook is missing, run `/plannotator-annotate <path>`.
   - Codex, Grok, anywhere else: `plannotator annotate <path> --gate`, or the
     `$plannotator-annotate` skill when it is available.
3. Wait. Do not code, commit, or start the first step while the review is open.
4. If I send feedback, revise the same plan file, then open it again. Repeat until Approve or Approve
   with Notes.
5. Approve with Notes means implement, and treat the notes as required guidance, not optional colour.
6. After substantial implementation, open the diff the same way: `/plannotator-review`,
   `plannotator review`, or `$plannotator-review`. Stop again if I annotate the diff.

Manual commands: `/plannotator-annotate`, `/plannotator-review`, `/plannotator-last`.

## Anti-patterns

Do not use `agent-browser` or Argent to "review" a plan.

Do not paste the plan into chat and ask me to rubber-stamp it there.

A short status line is fine: "plan is open in Plannotator, waiting on your review".

If `plannotator` is missing from PATH, say so once and install it with
`curl -fsSL https://plannotator.ai/install.sh | bash`, then retry. Do not fall back to chat review.
