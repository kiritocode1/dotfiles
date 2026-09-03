#!/usr/bin/env bash
# Put this repo's pi config onto a machine. Safe to re-run.
#
#   pi/restore.sh              install
#   pi/restore.sh --dry-run    print what would change, touch nothing
#
# Credentials are deliberately not handled here. auth.json holds live OAuth
# access and refresh tokens, so it is never committed. Run `pi auth` after this.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT="${PI_AGENT_DIR:-$HOME/.pi/agent}"
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY=1

act() { echo "  ${DRY:+would }$*"; }

command -v pi >/dev/null || { echo "pi not on PATH. Install it first, then re-run."; exit 1; }

echo "pi agent dir: $AGENT"

# settings.json — back up an existing one rather than overwrite it silently.
if [[ -f "$AGENT/settings.json" ]] && ! cmp -s "$SRC/settings.json" "$AGENT/settings.json"; then
  act "back up settings.json -> settings.json.before-dotfiles"
  [[ -z "$DRY" ]] && cp "$AGENT/settings.json" "$AGENT/settings.json.before-dotfiles"
fi
if ! cmp -s "$SRC/settings.json" "$AGENT/settings.json" 2>/dev/null; then
  act "write settings.json"
  [[ -z "$DRY" ]] && { mkdir -p "$AGENT"; cp "$SRC/settings.json" "$AGENT/settings.json"; }
fi

# Skills. Only the 13 vendored here; the rest of ~/.pi/agent/skills is symlinks
# into ~/.agents/skills, which the skill manager owns. Never clobber a symlink.
for d in "$SRC"/skills/*/; do
  name="$(basename "$d")"
  dest="$AGENT/skills/$name"
  if [[ -L "$dest" ]]; then
    echo "  skip $name (symlink, managed elsewhere)"
    continue
  fi
  if [[ -d "$dest" ]] && diff -rq "$d" "$dest" >/dev/null 2>&1; then
    continue
  fi
  act "install skill $name"
  [[ -z "$DRY" ]] && { mkdir -p "$AGENT/skills"; rm -rf "$dest"; cp -R "$d" "$dest"; }
done

# Extensions, from the package.json dependency list.
while read -r pkg; do
  [[ -z "$pkg" ]] && continue
  act "pi install npm:$pkg"
  [[ -z "$DRY" ]] && pi install "npm:$pkg"
done < <(python3 -c "
import json,sys
d=json.load(open('$SRC/package.json')).get('dependencies',{})
print('\n'.join(d))")

echo
echo "done. Next: pi auth   (credentials are not stored in this repo)"
