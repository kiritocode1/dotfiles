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

## What the plan has to contain

I read visually. One pass over the plan should leave me with 90% of the change in my head. A plan I
can only decode by reading every sentence in order gets annotated with "show me", and that costs us a
round trip.

Plannotator renders the plan file with mermaid, KaTeX and shiki, so a fenced `diff` block becomes
coloured before and after. Five parts, in this order.

**Goal, in three lines.** What is broken or missing now, what is true once this lands, how we prove
it landed.

**One simple diagram.** Boxes and arrows for the single thing that moves: what the shape is now,
what it becomes. Nothing else. I should get the change from the picture alone, in about two seconds,
before I read a word of prose.

Six nodes at most, one short label each, no line breaks inside a node. When a node wants three lines
of detail, that detail belongs in the file table or the prose, not in the picture. Plain text in a
fenced block is usually enough. Mermaid renders, but it buys nothing on its own and it tempts you
into drawing the whole system.

```
today   01 -> 02-06 -> 07 outro
after   01 -> 02-06 -> 07 recap -> 08 studio
```

If the change will not fit in six boxes, the plan holds more than one change. Diagram the one that
matters and say what you left out.

**A file table.** One row per file, saying what that file does today and what it does after. A path
on its own tells me nothing.

| File | Today | After |
| --- | --- | --- |
| `app/providers.tsx` | mounts theme only | also mounts SessionProvider, one cookie read |
| `lib/session.ts` | exports `readCookie()`, called from 7 places | exports a cached `getSession()` |

**Real code for every real choice.** Show the edit, do not narrate it. A diff fence for the two or
three edits that carry a decision, not for boilerplate.

```diff
- const session = readCookie(req)
+ const session = await getSession()   // cached per request
```

**What I am not doing.** The scope you are deliberately leaving out, so I can tell an omission from
an oversight.

## Specifics beat summaries

Naming a file and a verb is not a plan. Say what the file is responsible for, what it should do
instead, and the numbered reasons why.

Not enough:

> We change `lib/session.ts` in x and y way.

Enough:

> `lib/session.ts` owns session reads. It exports `readCookie()`, which parses the cookie header on
> every call, and 7 call sites hit it per render. We replace it with a request-cached `getSession()`
> because:
>
> 1. The parse runs 7 times for one request and the result cannot change mid-request.
> 2. Two of those call sites already cache it locally and disagree on the shape.
> 3. The upcoming refresh-token work needs one place to invalidate.

Density is the constraint, not length. Cut any sentence that would not change what I annotate. The
unslop rule applies to the plan file, its table cells, and its diagram labels.

## Workflow

1. Write the plan as Markdown, in the shape above. In Claude Code that is plan mode's plan file.
   Elsewhere write a repo file such as `PLAN.md` or `.plannotator/<name>.md`. A chat-only outline is
   not a plan I reviewed.
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

Do not send a plan whose only visual is a bullet list.

Do not describe an edit you could show. If there is a decision in it, the diff is the plan.

Do not draw a diagram that restates the file table. Each visual earns its place or goes.

Do not stuff a diagram. Multi-line nodes, ten boxes, and every detail from the prose repeated inside
the picture is the failure I keep getting. The diagram carries one idea; the table carries the
detail.

Do not defer a design choice to "I will work that out while implementing". Choose in the plan, and
say what you rejected.

Do not use `agent-browser` or Argent to "review" a plan.

Do not paste the plan into chat and ask me to rubber-stamp it there.

A short status line is fine: "plan is open in Plannotator, waiting on your review".

If `plannotator` is missing from PATH, say so once and install it with
`curl -fsSL https://plannotator.ai/install.sh | bash`, then retry. Do not fall back to chat review.
