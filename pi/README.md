# pi

Config for [pi](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
(`@earendil-works/pi-coding-agent`), synced across machines.

`~/.pi/agent` is ~207 MB on a working machine. Almost none of that is setup, so
this directory holds the small part that is.

## What is here

```
settings.json   theme, default provider/model/thinking level, extension list
package.json    the extension dependencies pi installs into ~/.pi/agent/npm
skills/         13 Cloudflare skills that exist nowhere else (2.4 MB)
restore.sh      put all of the above onto a new machine
```

The 13 skills are vendored because they are the only copy. The other ~17 entries
in `~/.pi/agent/skills` are symlinks into `~/.agents/skills`, which the skill
manager owns and `~/.agents/.skill-lock.json` can rebuild.

## What is deliberately not here

| Path | Why |
| --- | --- |
| `auth.json` | Live OAuth access and refresh tokens. Never commit. Run `pi auth`. |
| `models-store.json` | A cache. Carries `etag` and `checkedAt`, and pi refetches it. Committing it pins a stale model list. |
| `sessions/` | 3.9 MB of private chat logs that churn every session. |
| `npm/node_modules/` | 201 MB, rebuilt from `package.json`. |
| `trust.json` | Absolute paths for one machine's trusted directories. |

## Setup on a new machine

```bash
pi/restore.sh --dry-run   # see what would change
pi/restore.sh
pi auth                   # credentials are not in this repo
```

## GPT Image 2.5 through CPA

`cpa-image/` contains the shared image CLI, Pi extension, and Codex/Pi skill.
It uses the existing `CPA_KEY` and local proxy without changing client providers
or reading OAuth account files.

```bash
pi/cpa-image/install.sh --dry-run
pi/cpa-image/install.sh
cpa-image health
node --test pi/cpa-image/cpa-image.test.ts
```

Use `/reload` in Pi, then ask it to generate or edit an image with `cpa_image`.
In Codex, use `$cpa-image` in a new thread. Both use GPT Image 2.5 through the
same account pool. See [the skill](cpa-image/SKILL.md) for commands and recovery.

This installer is separate from `restore.sh` so adding image support does not
replace existing Pi settings or reinstall unrelated extensions.

## Rules

pi is the fourth target in `skills/bin/install`, alongside Claude, Codex and
Grok. Its global instruction file is `~/.pi/agent/AGENTS.md`.

That path is not a guess. `getAgentDir()` in pi's bundle resolves to
`$PI_AGENT_DIR` or `~/.pi/agent`, and `loadProjectContextFiles` calls
`loadContextFileFromDir(resolvedAgentDir)` for the global layer, trying
`AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, `CLAUDE.MD` in that
order. Project-level files still resolve by walking up from the cwd.

pi gets the core and shared rules but no `rules/agent/` profile. The Codex and
Claude profiles quote measured per-agent numbers from transcript audits, and
there is no pi audit yet, so pi inherits neither rather than inheriting figures
that describe a different agent.
