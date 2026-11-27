# Data and connection (rules 5 and 6)

Source: [09_connection-runtime.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/09_connection-runtime.md),
[supervisor.ts](https://github.com/pingdotgg/t3code/blob/d1b4b60/packages/client-runtime/src/connection/supervisor.ts),
[mobile-database.ts](https://github.com/pingdotgg/t3code/blob/d1b4b60/apps/mobile/src/persistence/mobile-database.ts),
[threads.ts](https://github.com/pingdotgg/t3code/blob/d1b4b60/packages/client-runtime/src/state/threads.ts).

## Cache first

Opening a screen is a local read. The network fills in afterwards. T3 keeps one expo-sqlite
database (`t3code-client.db`) with a cache table keyed by environment and kind (`shell`, `thread`,
`server-config`, `vcs-refs`, `pull-request`). Each row holds a JSON payload and its byte size, so the
app can show and clear what it stores.

- Cached data stays readable offline but must never look live, and it must never overwrite newer
  live data on reconnect.
- Keep the subscription and the cache on separate lifetimes. Mounted screens share one live
  stream, which stops when the last one unmounts. A short-lived cache keeps the state and its replay
  cursor, so going back to a thread is instant and resumes from the cursor.
- Commit the cached state and the cursor together, and only after an update completes. Cancelling
  must not move the cursor past data that was not applied.
- A partial snapshot never proves something was deleted. Code that deletes on absence must check
  with the server first.

On web, the same rule uses IndexedDB or an in-memory cache that survives route changes. The point is
the order (local, then network), not the store.

## One connection owner

The supervisor is the only code that retries the transport. Opening a session and resolving an
endpoint are single attempts; the supervisor wraps them.

- Transient failures back off exponentially with jitter and a cap. The backoff resets only after a
  connection has stayed up for a while.
- Offline and auth failures do not retry on a timer. They wait for a wakeup: the network coming
  back, the user signing in, the app coming to the foreground.
- Foregrounding, a network change, an explicit retry or an offline report probe the existing
  session. Only a failed probe replaces the socket. OS offline reports are often wrong.
- Reconnecting never replays mutations. Retries and idempotency belong to each operation.

Build the backoff and retry from BLANK's backend blocks (`registry_search` section `backend`) rather
than by hand. T3's supervisor is 1,458 lines of Effect tied to its RPC layer; read it for behavior,
don't copy it.

## Auth and socket lifetime

- Sockets authenticate when they open; HTTP requests read current credentials each time.
- A failed HTTP token refresh fails that HTTP request. It never tears down a healthy socket.
- A live socket whose token nears expiry renews in place, so an open conversation is never interrupted.

## Health and freshness are different states

An open socket does not mean the data is current. T3's session waits for the server's initial
config, and each subscription has its own sync state. Show "reconnecting" only for the transport.
A failed subscription on a healthy socket is a different error with a different message.

## Payload budgets

Cold opens, history pages and resume catch-ups are bounded in bytes and rows before decoding. Large
bodies (command output, file contents) are left off snapshots and fetched on demand. Resumes send
deltas, not full snapshots. T3 enforces this in an integration test that fails CI over budget
([transferBudgetV2.integration.test.ts](https://github.com/pingdotgg/t3code/blob/d1b4b60/apps/server/integration/transferBudgetV2.integration.test.ts)).
