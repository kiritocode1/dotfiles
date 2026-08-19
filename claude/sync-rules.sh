#!/usr/bin/env bash
# Replaced by dotfiles/skills. Kept for one release so muscle memory still works.
#
#   rules live in   dotfiles/skills/rules/
#   build           dotfiles/skills/bin/build
#   install         dotfiles/skills/bin/install
#   verify          dotfiles/skills/bin/check
#
# The old in-place fenced-block injection is gone. It edited live AGENTS.md
# files with a regex, and two blocks had malformed closers, so every run
# appended another copy. Nothing now reads a live file to decide what to write.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../skills" && pwd)"
echo "sync-rules.sh is retired. Running the replacement:"
echo
if [[ "${1:-}" == "--check" ]]; then exec "$DIR/bin/check"; fi
"$DIR/bin/build" && "$DIR/bin/install" && "$DIR/bin/patch"
