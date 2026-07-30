# dotfiles

Personal Claude Code config, synced across machines.

## Layout

```
claude/rules/   → symlinked into ~/.claude/rules/
zshrc           → symlinked to ~/.zshrc
docs/           → runbooks, not symlinked anywhere
```

## Setup on a new machine

```bash
git clone git@github.com:kiritocode1/dotfiles.git ~/dotfiles
mkdir -p ~/.claude/rules
ln -sf ~/dotfiles/claude/rules/aryank-ui-inspiration.md ~/.claude/rules/aryank-ui-inspiration.md
ln -sf ~/dotfiles/zshrc ~/.zshrc
```

That's it — Claude Code loads everything in `~/.claude/rules/` on every session, for every model and every project.

## Runbooks

- [CLIProxyAPI](docs/cliproxyapi.md) — local multi-provider LLM proxy on `127.0.0.1:8317`: install, launchd agent, provider logins, wiring Claude Code at it, and what the cloak-mode flag actually does.
