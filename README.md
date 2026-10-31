# dotfiles

Sets up a Mac the way mine is set up: the shell, CLI tools, apps, editor and terminal config, and
the rules and skills that Claude Code, Codex, Grok, pi and OpenCode load.

## Setup

```bash
git clone git@github.com:kiritocode1/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap --dry-run   # what it would install and link
./bootstrap
```

Running it again is safe. Each step skips what is already there. A live file that differs from the
repo's copy moves to `<file>.before-dotfiles` before the symlink replaces it. The dry run writes no
config, but brew, npm and fnm still write their own caches when it queries them.

## What bootstrap does

1. Installs Homebrew.
2. Installs fnm and node 24. This has to come before `brew bundle`, because the Brewfile's npm
   entries install with whatever npm is on PATH.
3. Runs `brew bundle`. The [Brewfile](Brewfile) has formulae, casks, two go tools and the npm
   globals (pi, codex, argent, agent-desktop, portless and others).
4. Installs oh-my-zsh with zsh-autosuggestions, zsh-syntax-highlighting and jovial.
5. Runs the official installer for each tool that has its own: rustup, bun, deno, uv, claude,
   opencode, sst, plannotator, grok, nub, herdr, ax, sentry, cursor-agent, terminal-browser. These
   run before the links step, so if an installer appends to `~/.zshrc`, it edits the file that
   gets backed up, not the repo's copy. Bootstrap warns if the repo's `zshrc` changed anyway.
6. Installs the bun globals: auditkit (pinned to 0.1.7, the last version whose `ak` runs),
   effect-solutions and the Railway CLI.
7. Links config into place:

   | Repo | Live |
   | --- | --- |
   | `zshrc`, `zprofile` | `~/.zshrc`, `~/.zprofile` |
   | `config/git/config`, `config/git/ignore` | `~/.gitconfig`, `~/.config/git/ignore` |
   | `config/ghostty/config` | `~/.config/ghostty/config` |
   | `config/television/config.toml` | `~/.config/television/config.toml` |
   | `config/zed/settings.json`, `keymap.json` | `~/.config/zed/` |
   | `bin/usage`, `bin/claude-acct`, `bin/wa` | `~/.local/bin/` |

8. Builds and installs agent rules and patches vendored skills (`skills/bin/build`, `install`,
   `patch`), and installs the agent-browser and agent-desktop skills.
9. Restores pi: settings, the `codex-pool` provider extension, its packages and the vendored
   skills. This only runs when `~/.pi/agent/settings.json` doesn't exist yet, because an existing
   one may be newer than the repo's copy. Then `pi/cpa-image/install.sh` links the image CLI,
   skill and pi extension.

## After bootstrap, by hand

```bash
gh auth login
pi auth
agent-desktop permissions --guide   # Accessibility and Screen Recording
agent-browser install               # downloads Chrome for Testing
argent init -y                      # registers the argent MCP server
```

In Zed, install the extensions the settings expect: `blank-theme` (Blank Moonlight), `symbols`,
`emmet`, `git-firefly`, `html`, `sql`, `toml`.

## Secrets

These hold live tokens and never go in the repo. Fill them in on each machine.

| File | What goes in it |
| --- | --- |
| `~/.zshenv` | `export CPA_KEY=...` for the local proxy ([docs/cliproxyapi.md](docs/cliproxyapi.md)). rustup also adds `. "$HOME/.cargo/env"` here |
| `~/.npmrc` | npm auth token |
| `~/.claude/settings.json` | proxy token in `env`, permissions, hooks, plugins |
| `~/.codex/config.toml` | MCP servers and their tokens, the Context7 key |
| `~/.cli-proxy-api/` | proxy config and provider logins |
| `~/.config/wa/` | `wa` config |

## Installed by hand

These apps put a CLI on PATH, but Homebrew doesn't manage them here. OrbStack, Zed, Cursor, ChatGPT
(for Codex), Ollama, Raycast, VS Code, Cap, Cardboard, Kiro, Trae, Antigravity, Docker Desktop.

CLIs that bootstrap can't install:

- `vercel` is a pnpm global: `pnpm add -g vercel`.
- `cli-proxy-api` has no one-line installer. Put the release binary in `~/.local/bin`, as
  [docs/cliproxyapi.md](docs/cliproxyapi.md) describes.
- `ami`: the ami.dev installer now installs the desktop app, not the `~/.ami/bin` CLI.
- `wtfport` was renamed to icport. See github.com/behnamazimi/icport.

## Layout

```
bootstrap        one-command setup
Brewfile         formulae, casks, go tools, npm globals
zshrc, zprofile  shell
config/          git, ghostty, television, zed
bin/             my scripts, linked into ~/.local/bin
skills/          agent rules and vendored skills, see skills/README.md
pi/              pi agent config, see pi/README.md
docs/            runbooks
claude/          sync-rules.sh, retired, forwards to skills/bin
```

## Agents

`skills/bin/install` writes rules for five agents. Claude gets one symlink per rule in
`~/.claude/rules/`. Per-file links are deliberate: that directory also holds machine-local rules,
and a directory symlink would hide them. Codex, Grok, pi and OpenCode each get a single generated
`AGENTS.md`. pi's lives at `~/.pi/agent/AGENTS.md`, because pi resolves its global layer from
`getAgentDir()`. Edit rules in `skills/rules/`, then run `skills/bin/build && skills/bin/install`.
See [skills/README.md](skills/README.md).

For driving UI, `ui-verification` picks the tool by what's under test. Argent handles simulators,
devices, React Native and Electron or CDP apps. Agent Browser handles web pages. Agent Desktop
handles native desktop apps.

## Runbooks

- [CLIProxyAPI](docs/cliproxyapi.md) is the local multi-provider LLM proxy on `127.0.0.1:8317` for
  Codex, Claude Code and xAI. New Claude Code processes use the three-account local pool. Processes
  already running keep the route they started with.
- [pi](pi/README.md) covers pi agent config, the vendored Cloudflare skills, and restore.

## Known limits

- Nine rule and reference files point at `/Users/blank/dotfiles/...`. On another account, clone to
  that path or edit `skills/rules/`.
- The ~260 vendored skills in `skills/manifest.toml` aren't reinstalled. `skills add --skill` can
  install extra skills from multi-plugin repos, so a restore needs an install-then-diff script.
- The grok and cursor installers both try to own `~/.local/bin/agent`. On a fresh machine it ends up
  pointing at cursor-agent.
- There's been no end-to-end run on a clean machine yet. Only the dry runs and this machine's
  re-run have been checked.
