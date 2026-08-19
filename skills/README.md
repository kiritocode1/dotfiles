# skills

One source of truth for how Claude, Codex, and Grok behave on this machine.

Built from an audit of 6,961 real prompts across all three agents. The findings live in
[profile/how-i-work.md](profile/how-i-work.md); the operational parts live in `rules/` and
`skills/blank-mode`.

## The idea

Anything unused was advice. Anything used was a procedure: a pinned target, numbered steps, explicit
anti-patterns, a closing check. Every rule here is written that way, and every rule is reachable
without anyone remembering it exists.

## Layout

```
rules/        the only place you write
  tiers.toml    which rule reaches which agent
  core/         always on, all agents
  shared/       situational, tiered per agent
  agent/        per-agent working profile
build/        generated, committed. exactly what each agent sees
vendored/     upstream skills: sources + the patches we own
skills/       blank-mode and the two routers
profile/      the audit, and pre-migration backups
bin/          build, install, patch, check, audit
```

## Use

```bash
bin/build      # rules/ -> build/, fails if an agent's budget overflows
bin/install    # build/ -> ~/.claude/rules, ~/.codex/AGENTS.md, ~/.grok/AGENTS.md
bin/patch      # reapply our edits on top of vendored skills
bin/check      # every invariant, read-only, exits non-zero on breakage
bin/audit      # re-derive the numbers in profile/how-i-work.md
```

Edit a rule, run `bin/build && bin/install`. Never edit `~/.codex/AGENTS.md` or `~/.grok/AGENTS.md`
directly: they carry a generated-file header and the next build overwrites them.

## Why build and install are separate

The old `sync-rules.sh` edited live files in place with a regex over `<!-- name -->` markers. Two
blocks had malformed closers, so the regex never matched and every sync appended another copy.
Nothing here reads a live file to decide what to write, so that class of bug cannot recur.
`bin/install` run twice is a no-op, and `bin/check` proves it.

## Budgets

Grok truncates `AGENTS.md` at 10,000 characters, so rules are tiered. A rule can ship an agent-specific
short form as `<name>.<agent>.md`, which wins over `<name>.md` for that agent. `bin/build` fails before
writing when a rendered file would exceed its cap.

## Vendored skills

`manifest.toml` records every upstream skill and its source. `vendored/<source>/patches.toml` holds the
edits we own, because `npx skills add` overwrites frontmatter with no warning. Run `bin/patch` after
any install.

Known CLI trap: `skills add <repo> -s <name>` does not reliably filter. On a multi-plugin repo it
installed all 66 skills rather than the 33 requested, including one that clobbered a same-named skill.
Verify what landed, then `bin/patch`.

## Effort

Shallow work is not a rule problem. It is the model and effort setting. `settings.json` carries
`effortLevel`, and that is the lever.
