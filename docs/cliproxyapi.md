# CLIProxyAPI

Local multi-provider LLM proxy ([router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)).
Holds its own OAuth grants and exposes Anthropic-, OpenAI- and Gemini-compatible
endpoints on `127.0.0.1:8317`, so any client that speaks one of those APIs can be
pointed at a single local address.

Running as a launchd agent. Version at time of writing: `7.2.158` (`5b278561`).

## Layout

```
~/.local/bin/cli-proxy-api                            → binary (arm64 Mach-O, ~58M)
~/.cli-proxy-api/config.yaml                          → config, hot-reloaded on write
~/.cli-proxy-api/claude-<hash>-<account>.json         → current Claude OAuth grant
~/.cli-proxy-api/xai-<account>@gmail.com.json         → same, other providers
~/.cli-proxy-api/cpa.log                              → stdout + stderr
~/.cli-proxy-api-backups/                             → inactive backups, outside auth-dir
~/Library/LaunchAgents/com.router-for-me.cliproxyapi.plist
```

## Setup from scratch

### 1. Binary

Drop the release binary for your arch at `~/.local/bin/cli-proxy-api` and `chmod +x` it.

```bash
mkdir -p ~/.local/bin ~/.cli-proxy-api
# ...download release, then:
chmod +x ~/.local/bin/cli-proxy-api
~/.local/bin/cli-proxy-api --help    # also prints version + commit
```

### 2. Config

Generate a fresh local API key — this is the bearer token clients present to the
proxy. It is not an Anthropic key; it only gates access to your own localhost port.

```bash
echo "local-$(openssl rand -hex 16)"
```

`~/.cli-proxy-api/config.yaml`:

```yaml
host: "127.0.0.1"   # local machine only, never exposed on the LAN
port: 8317
auth-dir: "~/.cli-proxy-api"
debug: false
api-keys:
  - "local-<32 hex from above>"
disable-claude-cloak-mode: false   # see "Cloak mode" below — this flag matters
remote-management:
  allow-remote: false
  secret-key: "<plaintext; the proxy bcrypt-hashes it in place on first run>"
routing:
  session-affinity: true
  session-affinity-ttl: "12h"
  session-affinity-subagents: true
max-retry-credentials: 3
request-retry: 2
transient-error-cooldown-seconds: 30
```

> **Write the management secret-key down before you start the proxy.** It gets
> replaced in-file by its bcrypt hash (60 chars), and the plaintext is then
> unrecoverable. Without it every `/v0/management/*` call returns
> `{"error":"invalid management key"}` and the only way back is a new key.

### 3. Provider logins

Each provider is a separate OAuth grant, written to its own file in `auth-dir`:

```bash
~/.local/bin/cli-proxy-api -claude-login    # repeat per account
~/.local/bin/cli-proxy-api -xai-login
```

Other flags: `-codex-login`, `-codex-device-login`, `-kimi-login`,
`-antigravity-login`, `-vertex-import <sa.json>`. Add `-no-browser` on a headless
box. Grants are ~8h TTL and auto-refresh every 15m while the proxy runs.

### 4. launchd agent

`~` is not expanded by launchd — absolute paths only. Write it with a heredoc so
`$HOME` resolves at creation:

```bash
cat > ~/Library/LaunchAgents/com.router-for-me.cliproxyapi.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.router-for-me.cliproxyapi</string>

	<!-- Absolute paths only: launchd does not expand ~ -->
	<key>ProgramArguments</key>
	<array>
		<string>$HOME/.local/bin/cli-proxy-api</string>
		<string>-config</string>
		<string>$HOME/.cli-proxy-api/config.yaml</string>
	</array>

	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<true/>

	<key>StandardOutPath</key>
	<string>$HOME/.cli-proxy-api/cpa.log</string>
	<key>StandardErrorPath</key>
	<string>$HOME/.cli-proxy-api/cpa.log</string>

	<key>WorkingDirectory</key>
	<string>$HOME/.cli-proxy-api</string>

	<!-- Deprioritised against foreground work; this is a local sidecar. -->
	<key>ProcessType</key>
	<string>Background</string>
</dict>
</plist>
PLIST

launchctl load ~/Library/LaunchAgents/com.router-for-me.cliproxyapi.plist
```

Restart after a binary swap: `launchctl kickstart -k gui/$(id -u)/com.router-for-me.cliproxyapi`.
Config and auth-dir changes need no restart — a file watcher hot-reloads both.

### 5. Point new Claude Code processes at the pool

`~/.claude/settings.json` carries the local proxy address and bearer token:

```json
"env": {
  "ANTHROPIC_BASE_URL": "http://127.0.0.1:8317",
  "ANTHROPIC_AUTH_TOKEN": "local-<your key>"
}
```

Claude Code reads this environment at process startup. New plain `claude`
processes use the pool. A process that was already running keeps its original
direct or proxied route until it exits. Restoring this block does not require a
proxy restart. The previous working block is also present in
`~/.claude/settings.json.bak-pre-official-api-*`.

The pooled path does not provide every direct subscription integration. Remote
Control, claude.ai MCP connectors, `/usage-credits`, and direct extra-usage
controls can differ or be unavailable while Claude Code is in env-var auth
mode.

### 6. Routing, retries, and prompt cache

Affinity binds provider, Claude session ID, and model to one grant. The 12-hour
TTL is sliding, so each reuse extends the binding. Subagents inherit the parent
account. A credential failure removes the binding and lets the request try the
other enabled accounts.

Anthropic's prompt cache belongs to the upstream account. The first request
after a failover creates a cold cache on the new account. Later requests on the
same binding can read it. OAuth refresh changes the token for the same grant,
so it does not clear the binding or the account's quota state.

`max-retry-credentials: 3` allows the primary account and two failover accounts
in one sweep. `request-retry: 2` controls request retries. The 30-second
transient cooldown handles transport failures. It does not replace a quota
cooldown.

## Cloak mode

`disable-claude-cloak-mode` is the single most consequential flag here.

| value | behaviour |
|---|---|
| `true` | Sends real system prompts. Requests do **not** present as the Claude Code CLI. |
| `false` | Disguises requests as the official Claude Code CLI. |

Measured on 2026-07-31, subscription OAuth grant, same account, same minute:

| model | `true` | `false` |
|---|---|---|
| `claude-opus-5` | 429 `rate_limit_error` | 200 |
| `claude-opus-4-5-20251101` | 429 | 200 |
| `claude-sonnet-5` | 429 | 200 |
| `claude-haiku-4-5-20251001` | 200 | 200 |

So with cloak mode disabled, a subscription grant gets **Haiku only**. The 429 is
not a capacity limit — the same account served Opus fine over the direct path at
the same moment. Anthropic checks whether the request comes from the real Claude
Code client and refuses the larger models when it doesn't; the refusal just
surfaces as `rate_limit_error` rather than a 403.

Which means: `false` works by defeating that check. Pro/Max credentials are
licensed for use through Anthropic's own apps, so this is outside those terms and
the downside lands on the account. The clean alternative is a
[console](https://console.anthropic.com) API key in `api-keys` — every model works,
no impersonation, pay-per-token instead of subscription.

Recorded here as fact, not advice. If you set `true`, also fix the comment above
the line — it drifts out of sync fast.

## Verify

```bash
KEY="local-<your key>"

# models the proxy is serving
curl -s -H "Authorization: Bearer $KEY" http://127.0.0.1:8317/v1/models \
  | python3 -c 'import sys,json;[print(m["id"]) for m in json.load(sys.stdin)["data"]]'

# end-to-end round trip
curl -s -w '\n%{http_code}\n' -X POST http://127.0.0.1:8317/v1/messages \
  -H "Authorization: Bearer $KEY" \
  -H 'content-type: application/json' -H 'anthropic-version: 2023-06-01' \
  -d '{"model":"claude-opus-5","max_tokens":16,"messages":[{"role":"user","content":"reply with just: ok"}]}'
```

`tail -f ~/.cli-proxy-api/cpa.log` shows every request. A successful config
reload logs `config successfully reloaded, triggering client reload` followed by
`full client load complete - N clients`.

## Usage limits for the Claude pool

`usage` reads every `claude-*.json` grant in `auth-dir` and asks Anthropic
for the same 5-hour / weekly / extra-usage numbers Claude Code's `/usage` uses.

```bash
usage              # every enabled Claude grant
usage aryan        # filter by email substring
usage --json       # raw payload
usage --check      # exit 1 if any window is currently blocking
```

The script lives at `~/dotfiles/bin/usage` and is on `PATH` via
`~/.local/bin/usage`. It never prints tokens.

A 401 means the grant expired and the proxy has not refreshed it yet. Kick the
agent (`launchctl kickstart -k gui/$(id -u)/com.router-for-me.cliproxyapi`) and
retry. Do not poll this more than a few times an hour: `/api/oauth/usage` rate
limits hard.

## Gotchas

**A proxy login only adds a grant.** Claude Code and CLIProxyAPI keep separate
credential stores. `-claude-login` writes JSON in `auth-dir`. New Claude Code
processes use those grants only because the settings `env` block points them at
the proxy. Existing processes do not change route.

**The auth directory is recursive.** Every `.json` below `auth-dir` is live.
Never put credential backups there. Keep inactive copies under
`~/.cli-proxy-api-backups/` or another directory outside `auth-dir`.

**Disabling an account:** set `"disabled": true` in its `claude-*.json`. The
watcher picks it up immediately. Do not copy the file inside `auth-dir` first,
because the copy becomes another live credential.

**Don't guess model IDs.** Hit `/v1/models` — the served list is what routing
actually accepts.

**429 on big models but 200 on Haiku** is the cloak-mode signature above, not a
real rate limit. Check the flag before assuming you're throttled.
