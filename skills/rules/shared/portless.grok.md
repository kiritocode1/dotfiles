# Named local URLs (portless)

Never announce a bare port. Every long-running local server gets a stable name:
`https://<name>.localhost`, served by the portless proxy on 443.

The name is derived, not invented: `portless.json` name, or the `"portless"` key in `package.json`,
otherwise the git repo root directory name, kebab-cased. No mood words, no `-dev` or `-local` suffix.

Start with `portless` (runs the `dev` script) or `portless run <cmd>`. Never prefix with `PORT=` and
never pass `--port`; portless owns the port. Name something already running with
`portless alias <name> <port>`.

Run `portless list` first. If the name is already live for the app you were asked to run, reuse it.
Never kill a process to free a port; it is probably another agent's server.

Announce exactly one line per server, and repeat it in the final message of the turn:

```
▶ https://compronents.localhost — compronents · next dev · portless
```
