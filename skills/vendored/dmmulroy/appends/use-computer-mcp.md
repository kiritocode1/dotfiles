## On this machine

The server is the Codex Computer Use client, running standalone over stdio. It is registered under
the name `computer` in Claude and Grok, and reaches Codex through its bundled
`computer-use@openai-bundled` plugin instead.

Binary:

```
/Users/blank/.codex/computer-use/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient mcp
```

**Tool names differ per agent.** The `computer_get_app_state` form above is Pi's. Translate before
calling:

| Agent | Prefix | Example |
|---|---|---|
| Claude | `mcp__computer__` | `mcp__computer__get_app_state` |
| Grok | server `computer` | as exposed by its MCP client |
| Codex | bundled plugin | as exposed by the plugin |

Ten tools are available: `list_apps`, `get_app_state`, `click`, `perform_secondary_action`,
`set_value`, `select_text`, `scroll`, `drag`, `press_key`, `type_text`. The skill's `computer_`
examples map onto these one to one.

This driver controls the real desktop, not a sandbox: real mouse, real keyboard, real signed-in
apps. It needs macOS accessibility permission. Prefer an API or CLI when one exists, and use this
only for auth-bound, desktop-only, or genuinely visual work, exactly as section 1 says.

Re-register after a Codex app update if the binary path changes:

```bash
claude mcp add --scope user computer -- "<binary>" mcp
grok   mcp add --scope user computer  "<binary>" -- mcp
```
