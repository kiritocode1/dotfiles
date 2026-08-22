# CLIProxyAPI

Local multi-provider LLM proxy ([router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)).
Holds its own OAuth grants and exposes Anthropic-, OpenAI- and Gemini-compatible
endpoints on `127.0.0.1:8317`, so any client that speaks one of those APIs can be
pointed at a single local address.

Running as a launchd agent. Version at time of writing: `7.2.110` (`a80e8082`).

## Layout

```
~/.local/bin/cli-proxy-api                            → binary (arm64 Mach-O, ~58M)
~/.cli-proxy-api/config.yaml                          → config, hot-reloaded on write
~/.cli-proxy-api/claude-<account>@gmail.com.json      → per-account OAuth grant
~/.cli-proxy-api/xai-<account>@gmail.com.json         → same, other providers
~/.cli-proxy-api/cpa.log                              → stdout + stderr
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

### 5. Point Claude Code at it

In `~/.claude/settings.json`:

```json
"env": {
  "ANTHROPIC_BASE_URL": "http://127.0.0.1:8317",
  "ANTHROPIC_AUTH_TOKEN": "local-<your key>"
}
```

**Requires a full Claude Code restart** — the env block is read at startup.
Setting these two vars puts Claude Code in env-var auth mode and bypasses
keychain OAuth entirely.

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

## Usage limits (both Claude accounts)

`usage` reads every `claude-*.json` grant in `auth-dir` and asks Anthropic
for the same 5-hour / weekly / extra-usage numbers Claude Code's `/usage` uses.

```bash
usage              # both Pro grants
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

**A proxy login does not stop Claude Code re-logins.** The two keep entirely
separate credential stores — Claude Code uses the macOS Keychain
(`Claude Code-credentials` → `claudeAiOauth`), CLIProxyAPI uses JSON files in
`auth-dir`. Neither can read the other, so `-claude-login` is a *second, unrelated*
grant. Until `ANTHROPIC_BASE_URL` is actually set, Claude Code talks straight to
`api.anthropic.com` and re-auths on its own schedule regardless of what the proxy
is doing. Check for it with `env | grep ANTHROPIC` and by grepping every settings
layer: `~/.claude/settings.json`, `~/.claude/settings.local.json`,
`.claude/settings.json`, `.claude/settings.local.json`, `~/.claude.json`.

**Disabling an account for testing:** set `"disabled": true` in its
`claude-<email>.json` — the watcher picks it up immediately. Back up the file
first; `diff -q` it afterwards to confirm a clean restore.

**Don't guess model IDs.** Hit `/v1/models` — the served list is what routing
actually accepts.

**429 on big models but 200 on Haiku** is the cloak-mode signature above, not a
real rate limit. Check the flag before assuming you're throttled.
