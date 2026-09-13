#!/usr/bin/env bash
# Install only the shared image skill, CLI, and Pi extension. Never touch credentials.
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "${1:-}" in
  "") dry=0 ;;
  --dry-run) dry=1 ;;
  --help) echo 'Usage: install.sh [--dry-run]. Links CPA image tools without touching account/config files.'; exit 0 ;;
  *) echo 'Unknown option. Run install.sh --help.' >&2; exit 1 ;;
esac
[[ $# -le 1 ]] || { echo 'Too many arguments.' >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) process.exit(1)' || {
  echo 'Node 24+ is required. Existing credentials were not changed.' >&2; exit 1;
}
sources=("$SRC/cpa-image.ts" "$SRC" "$SRC")
targets=("$HOME/.local/bin/cpa-image" "$HOME/.agents/skills/cpa-image" "$HOME/.pi/agent/extensions/cpa-image")
# Preflight every destination before installing any link.
for i in 0 1 2; do
  target="${targets[$i]}"
  if [[ -e "$target" || -L "$target" ]]; then
    if [[ -L "$target" && "$(readlink "$target")" == "${sources[$i]}" ]]; then continue; fi
    echo "Refusing to replace existing path: $target" >&2; exit 1
  fi
done
for i in 0 1 2; do
  target="${targets[$i]}"
  [[ -L "$target" ]] && continue
  echo "link $target -> ${sources[$i]}"
  if [[ "$dry" == 0 ]]; then
    mkdir -p "$(dirname "$target")"
    ln -s "${sources[$i]}" "$target"
  fi
done
if [[ "$dry" == 1 ]]; then
  echo 'Dry run complete. No files changed.'
else
  echo 'Installed. Pi: /reload. Codex: start a new thread if cpa-image is not in /skills.'
fi
