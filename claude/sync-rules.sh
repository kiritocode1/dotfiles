#!/usr/bin/env bash
# Propagate ~/dotfiles/claude/rules/*.md to every agent CLI on this machine.
# Idempotent: safe to re-run after editing any rule.
#
#   ./sync-rules.sh          sync
#   ./sync-rules.sh --check  report drift, change nothing
set -euo pipefail

SRC="$HOME/dotfiles/claude/rules"
CHECK=0
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK=1; shift ;;
    --only)  ONLY="$2"; shift 2 ;;
    *) echo "usage: sync-rules.sh [--check] [--only <rule>]" >&2; exit 2 ;;
  esac
done

# Agents that read a rules/ DIRECTORY -> symlink every rule (no size cap).
RULE_DIRS=(
  "$HOME/.claude/rules"
  "$HOME/.cursor/rules"
  "$HOME/.gemini/rules"
)

# Agents that read ONE global instructions file -> inject fenced blocks.
# Grok truncates each file at 10,000 chars, so only inject what matters.
RULE_FILES=(
  "$HOME/.codex/AGENTS.md"
  "$HOME/.grok/AGENTS.md"
  "$HOME/.config/opencode/AGENTS.md"
)

# Which rules get injected into the single-file agents above.
INJECT=( portless )

ok(){ printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn(){ printf '  \033[33m!\033[0m %s\n' "$1"; }

echo "rules: $SRC"

# ---- tier 1: symlink into rules/ dirs -------------------------------------
for dir in "${RULE_DIRS[@]}"; do
  [[ -d "$(dirname "$dir")" ]] || continue          # agent not installed
  (( CHECK )) || mkdir -p "$dir"
  for rule in $( [[ -n "$ONLY" ]] && echo "$SRC/$ONLY.md" || echo "$SRC"/*.md ); do
    name="$(basename "$rule")" dest="$dir/$name"
    if [[ -L "$dest" && "$(readlink "$dest")" == "$rule" ]]; then continue; fi
    if (( CHECK )); then
      [[ -e "$dest" ]] && warn "stale copy: $dest" || warn "missing: $dest"
    else
      ln -sfn "$rule" "$dest"; ok "link $dest"
    fi
  done
done

# ---- tier 2: fenced-block injection into single AGENTS.md files -----------
for file in "${RULE_FILES[@]}"; do
  [[ -d "$(dirname "$file")" ]] || continue
  for r in $( [[ -n "$ONLY" ]] && echo "$ONLY" || echo "${INJECT[@]}" ); do
    body="$SRC/$r.md"; [[ -f "$body" ]] || { warn "no such rule: $r"; continue; }
    CHECK=$CHECK python3 - "$file" "$r" "$body" <<'PY'
import os, pathlib, re, sys
path, name, body = pathlib.Path(sys.argv[1]), sys.argv[2], pathlib.Path(sys.argv[3])
check = os.environ.get("CHECK") == "1"
open_t, close_t = f"<!-- {name} -->", f"<!-- /{name} -->"
block = f"{open_t}\n{body.read_text().rstrip()}\n{close_t}"
cur = path.read_text() if path.exists() else ""
new = (re.sub(re.escape(open_t) + r".*?" + re.escape(close_t), lambda _: block, cur, flags=re.S)
       if open_t in cur and close_t in cur
       else (cur.rstrip() + "\n\n" + block + "\n" if cur.strip() else block + "\n"))
if new == cur:
    sys.exit(0)
if check:
    print(f"  \033[33m!\033[0m out of date: {path} [{name}]"); sys.exit(0)
path.parent.mkdir(parents=True, exist_ok=True); path.write_text(new)
print(f"  \033[32m✓\033[0m inject {path} [{name}]")
if len(new) > 10000 and ".grok" in str(path):
    print(f"  \033[33m!\033[0m {path} is {len(new)} chars; grok truncates at 10000")
PY
  done
done

(( CHECK )) && echo "check complete" || echo "synced"
