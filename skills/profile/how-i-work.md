# How I work with agents

Source document for this repo. Derived from 6,961 real prompts across Claude, Codex, and Grok,
March to August 2026. Never injected into an agent; the rules and `blank-mode` carry the operational
parts. Regenerate the numbers with `bin/audit`.

## Corpus

6,961 prompts. 677 Claude sessions. 49 distinct projects.

| Agent | Prompts | Share | Median prompt |
|---|---|---|---|
| Claude | 5,506 | 79.1% | 46 chars |
| Codex | 1,335 | 19.2% | 130 chars (mean 1,152, p90 3,286) |
| Grok | 120 | 1.7% | 88 chars |

## Three different relationships

Rates per 10,000 chars, which corrects for Codex prompts being 12 times longer.

| Signal | Claude | Codex | Grok |
|---|---|---|---|
| correction and pushback | 13.3 | 10.0 | 5.5 |
| verification asks | 9.5 | 5.9 | 5.3 |
| scope control | 7.4 | 4.3 | 4.9 |
| explanation asks | 4.9 | 0.9 | 2.0 |
| aesthetic judgment | 3.4 | 2.4 | 1.0 |
| planning | 3.2 | 0.4 | 1.0 |
| delegation | 1.2 | 5.1 | 8.3 |

Claude is the thinking partner: short prompts, most correction, most "why", most planning. Codex is
the executor: long specs with attached files, highest delegation after Grok, carried to closeout.
Grok is the plumber: highest delegation rate, and the topics are agent infrastructure such as
WhatsApp bridges, headless runs, and agents watching agents.

## Working habits

- 12.6% of all prompts paste an image. 14.1% are design or UI work.
- 9.2% name another agent. Cross-agent orchestration is deliberate.
- 2.5% ask for 1:1 or exact fidelity.
- 7.4% are push or commit. 4.3% are deploy.
- About 8 prompts per session, with 226 `/clear`s. Short bursts, hard resets.
- Two peaks: 10:00 to 16:00 and 18:00 to 23:00, spiking again at midnight. Dead 03:00 to 07:00.
- Sessions often open by addressing the agent by name. "claude ..." starts 96 of them.

## The six failure modes

From 359 correction prompts.

1. **Fidelity drift.** "it's genuinely not 1:1, instead of a convex effect u did a concave one"
2. **Acting before reading.** "read the entire component first ... figure out why this happens"
3. **Over-editing what was right.** "what you did for all 92 products were perfect. I asked you to
   remove ui that was explaining the ui, but the ui was perfect"
4. **Claiming done without running it.** "i want you to make it valid by running it"
5. **Dropping a prior instruction.** "why havent u gotten standardised part no like i told u"
6. **Shallow effort.** "i just see you slacking, i dont want slacking"

All six are process failures, not knowledge failures. Rules 1 and 2 became `fidelity-first` and
`read-before-edit`. Rules 3 to 6 are covered by pstack principles. Rule 5 lives in the agent profiles
as standing constraints. Rule 6 is an effort setting, not a rule.

## Why the old setup did not change behavior

28 of 30 slash-only skills had never been typed once. `disable-model-invocation: true` removes the
description from the model's reach, so only a typed `/name` starts them, and the index does not fit in
one person's head.

`/inspo` was the exception at 77 uses, more than everything else combined. It works because it is a
procedure: one pinned target repo, numbered steps, explicit anti-patterns, and a closing
test-lint-commit gate. Everything unused was advice.

The design-retrieval path had fired zero times while `/inspo`, which writes to the same registry, had
77 uses. The capture habit existed; the retrieval habit did not. That gap is now the `direction-first`
rule.

## Fragmentation at audit time

228 distinct skills: Claude 98, Codex 147, Grok 17. Claude and Codex overlapped on 7.9%. Exactly one
skill, `wa-update`, existed in all three. Codex's 147 were design and animation craft; Claude's 98
were engineering process. Design work happens in Claude, where the design skills were not.

Of 8 rule files, `sync-rules.sh` propagated only `portless`. Grok's entire `AGENTS.md` held one copy
of it. Codex's held four hand-written rules that existed nowhere else, one of which told it to read
`llms.txt` directly while Claude's rule forbade exactly that.

## Evidence that the fidelity rule matches intent

You asked for its procedure yourself, before it existed:

> "dither page is genuinely different than lama lama. can you use argent to get all the html css and
> js, store it, so we can genuinely do a line by line analysis"

That is `fidelity-first` steps 1, 2, and 4.
