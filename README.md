# dotfiles

Personal Claude Code config, synced across machines.

## Layout

```
claude/rules/   → symlinked into ~/.claude/rules/
```

## Setup on a new machine

```bash
git clone git@github.com:kiritocode1/dotfiles.git ~/dotfiles
mkdir -p ~/.claude/rules
ln -sf ~/dotfiles/claude/rules/aryank-ui-inspiration.md ~/.claude/rules/aryank-ui-inspiration.md
```

That's it — Claude Code loads everything in `~/.claude/rules/` on every session, for every model and every project.
