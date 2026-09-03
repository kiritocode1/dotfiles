#!/usr/bin/env bash
# wa-auto: make the wa-update triggers mechanical instead of advisory.
#
# The rule version of this asked the agent to decide, at the end of a turn,
# whether a ping was warranted. Measured over a month: 2 sends. Two of the three
# triggers need no agent judgment at all, so the harness runs them here.
#
#   UserPromptSubmit  "wa me" in the prompt -> inject the instruction into the turn
#   Stop              turn took >5 min and you are not watching -> send
#   Notification      Claude needs input and you are not watching -> send
#
# Never exits non-zero: a broken notifier must not break a session.
set -uo pipefail

STATE="${HOME}/.claude/hooks/wa-auto/state"
mkdir -p "$STATE" 2>/dev/null || true
MIN_SECONDS="${WA_AUTO_MIN_SECONDS:-300}"

command -v wa >/dev/null 2>&1 || exit 0
INPUT=$(cat 2>/dev/null || true)
[ -z "$INPUT" ] && exit 0

jqr() { printf '%s' "$INPUT" | jq -r "$1" 2>/dev/null || true; }

EVENT=$(jqr '.hook_event_name')
SESSION=$(jqr '.session_id')
CWD=$(jqr '.cwd'); [ -z "$CWD" ] || [ "$CWD" = "null" ] && CWD="$PWD"
PROJECT=$(basename "$CWD")
KEY="$STATE/$(printf '%s' "${SESSION:-nosession}" | tr -c 'A-Za-z0-9_.-' '_')"

# Are you looking at THIS session right now? If so, stay quiet: the terminal
# already told you. Mirrors the frontmost check peon-ping already relies on.
you_are_watching() {
  local front focused_cwd
  front=$(osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null || true)
  case "$front" in
    Ghostty|Terminal|iTerm2|WezTerm|Alacritty|kitty|Code|Cursor) ;;
    *) return 1 ;;                     # some other app is frontmost: you stepped away
  esac
  # Terminal is frontmost, but possibly on a different tab. Ghostty can tell us.
  if [ "$front" = "Ghostty" ]; then
    focused_cwd=$(osascript -e 'tell application "Ghostty"
      try
        return working directory of (focused terminal of (selected tab of front window))
      on error
        return ""
      end try
    end tell' 2>/dev/null || true)
    [ -n "$focused_cwd" ] && [ "$focused_cwd" != "$CWD" ] && return 1
  fi
  return 0
}

# Last thing the assistant actually said, so the ping carries real content.
last_assistant_line() {
  local tp; tp=$(jqr '.transcript_path')
  [ -z "$tp" ] || [ ! -f "$tp" ] && return 0
  tail -400 "$tp" 2>/dev/null | python3 -c "
import json,sys
out=''
for line in sys.stdin:
    try: d=json.loads(line)
    except ValueError: continue
    m=d.get('message') or {}
    if m.get('role')!='assistant': continue
    for c in (m.get('content') or []):
        if isinstance(c,dict) and c.get('type')=='text' and c.get('text','').strip():
            out=' '.join(c['text'].split())
print(out[:220])
" 2>/dev/null || true
}

case "$EVENT" in
  UserPromptSubmit)
    date +%s > "$KEY.start" 2>/dev/null || true
    if printf '%s' "$(jqr '.prompt')" | grep -qiE '(^|[^a-z])wa me([^a-z]|$)'; then
      jq -n '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:"The user wrote `wa me`. Before you finish this turn you must run `wa send \"...\"` with a short status: what you are working on, where it stands, and anything you need from them. Read the exit code, not the printed text. This is in addition to your normal reply, not instead of it."}}' 2>/dev/null || true
    fi
    ;;

  Stop)
    started=$(cat "$KEY.start" 2>/dev/null || echo 0)
    rm -f "$KEY.start" 2>/dev/null || true
    [ "$started" = "0" ] && exit 0
    elapsed=$(( $(date +%s) - started ))
    [ "$elapsed" -lt "$MIN_SECONDS" ] && exit 0
    you_are_watching && exit 0
    summary=$(last_assistant_line)
    [ -z "$summary" ] && summary="turn finished"
    wa send -t "$PROJECT" "done after $((elapsed / 60))m. $summary" >/dev/null 2>&1 || true
    ;;

  Notification)
    you_are_watching && exit 0
    msg=$(jqr '.message'); [ -z "$msg" ] || [ "$msg" = "null" ] && msg="needs your input"
    # One per session per minute; permission prompts can arrive in bursts.
    now=$(date +%s); last=$(cat "$KEY.notif" 2>/dev/null || echo 0)
    [ $(( now - last )) -lt 60 ] && exit 0
    echo "$now" > "$KEY.notif" 2>/dev/null || true
    wa send -t "$PROJECT" "blocked: $msg" >/dev/null 2>&1 || true
    ;;
esac
exit 0
