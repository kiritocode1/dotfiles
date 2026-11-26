---
name: instant-ui
description: Build Linear-feel UI on a local sync engine (TanStack DB + ElectricSQL + Postgres, React, TanStack Start). No spinners after first load, edits that land in the same frame, teammates' changes appearing live, failed writes that undo themselves visibly. Use when building or reviewing optimistic UI, live queries, real-time collaborative lists, or anything with useLiveQuery, electricCollectionOptions, awaitTxId or createOptimisticAction.
---

# Instant UI

The screen reads from and writes to a local store. The network confirms in the background. Every
pattern here follows from that, and every trap here is a way the network leaks back onto the screen.

Targets `@tanstack/db`, `@tanstack/react-db`, `@tanstack/electric-db-collection` at
`1.0.0-rc.1.5` and `@electric-sql/client` `1.5.28`. Check installed versions first. If they moved,
re-check every API named here against `node_modules` before using it.

## Sources of truth, in order

1. The installed package source and types in `node_modules/@tanstack/*/dist`.
2. TanStack DB's `docs/guides/migrate-to-1-0-rc.md` on GitHub.
3. The skills TanStack ships in `node_modules/@tanstack/db/skills/` and
   `node_modules/@tanstack/react-db/skills/`. Useful for query-builder syntax, but labelled
   `0.6.17`. Where they disagree with 1 or 2, they are wrong. Known stale points: dependency
   arrays on hooks (removed), `awaitTxId` timeout (15s, not 5s), "SSR not supported" (it is, opt-in).
4. Electric's `AGENTS.md` and `tanstack-db-web-starter`. Good for the proxy. Stale on
   `createServerFileRoute` (use `server.handlers`) and on returning `{ txid }` (ignored in the RC).

## Build order

1. Plumbing: Postgres with logical replication, Electric, shape proxy, write routes.
   Read `references/plumbing.md`.
2. Collections at module scope, one per table, each with `onInsert`/`onUpdate`/`onDelete` that
   throw on failure and `await collection.utils.awaitTxId(txid)` on success.
3. Routes with `ssr: false` and a loader that preloads what the view reads.
4. The patterns below, in table order. Code for each is in `references/patterns.md`.
5. The two-tab check in `references/verify.md`. The work is not done until it passes.

## The patterns

| # | Pattern | The user sees | Mechanism | Trap |
| --- | --- | --- | --- | --- |
| 1 | No spinner on navigation | Views complete on first paint | Loader awaits `collection.preload()`. A live query over a ready source is ready synchronously | Live-query collections GC after 5s idle. `preload()` on an `on-demand` source does nothing; preload the live query instead |
| 2 | Empty only when true | "No issues" never flashes before data | Render nothing until `isReady`, then the empty state | Branching on `data.length === 0` while loading |
| 3 | Same-frame edits | The row changes on click or keypress | `collection.update(id, d => { d.x = v })`, keys from `safeRandomUUID()` | Awaiting `fetch` before touching state |
| 4 | Quiet pending | Nothing for reversible actions. A dot only if confirm takes past ~1s | `$hasPendingWrites` plus a CSS `animation-delay` | A "Saving..." state on every write |
| 5 | Wait on destructive | Delete confirms before the row leaves | `{ optimistic: false }` or `await tx.when('settled')` before closing UI | Optimistic deletes that often fail |
| 6 | Visible rollback | A rejected write snaps back with a toast naming it, plus Retry | Handler throws on non-2xx. Every caller handles `tx.when('settled').catch` | The library swallows the error. Without the catch, rollback is silent |
| 7 | No flicker on confirm | The value never jumps back then forward | Handler resolves only after `awaitTxId(txid)` | Returning `{ txid }` (ignored), txid read outside the DB transaction (15s stall, then rollback of a saved row) |
| 8 | Live remote changes | A teammate's edit appears in place, the row highlights once | `useLiveQueryEffect` with `skipInitial: true`, filter `e.value.$origin === 'remote'` | No filter: your own edit and its confirm flash too |
| 9 | Local filter and search | Typing filters with no request | `useLiveQuery({ query })` with `ilike`, `eq`, `and` | Dependency arrays (removed in RC), `.filter()` on results, `===` in `where` |
| 10 | Autosave typing | Text saves once after a pause | One module-level `createPacedMutations` with `debounceStrategy` | One paced instance per component: separate timers |
| 11 | Bulk actions | "Move 12 to Done" is one transaction | `createOptimisticAction`. Its `mutationFn` persists and awaits the txid itself | Expecting collection `onUpdate` to run for it. It does not |
| 12 | Undo | Cmd+Z reverses the last action and reselects the rows | Record the inverse (`mutation.original`) and issue it as a normal write | Looking for an undo API. There is none |
| 13 | Stale but usable | A thin banner when sync drops. Rows stay | `isSyncError` and `health`. `status` changes only on crash | Full-page error on a network blip |
| 14 | Long lists | Smooth scroll, every row live | Eager source: `useLiveQuery` plus TanStack Virtual. On-demand source: `useLiveInfiniteQuery` | `pooledLiveQueries` for search. It only helps many same-shape `eq` queries |
| 15 | Keyboard first | Every action has a shortcut and a Cmd+K entry | Shortcuts call the same synchronous mutation functions as clicks | A command that awaits the network before closing |

Conflicts: last writer wins per field, with no conflict dialog. Rich text co-editing needs a CRDT
and is out of scope.

## Rules that hold across patterns

- One write path per table: the collection handlers. Bulk actions and paced mutations are the only
  other writers, and they await txids themselves.
- The server returns `{ txid: number }`. Read it with `pg_current_xact_id()::xid::text` inside the
  same transaction as the write, then convert to a number.
- Rejections return non-2xx with a message a person can read. The handler throws it. The toast
  shows it.
- A rejected write's row returns to the last synced value with `$origin: 'remote'`. Nothing marks
  it failed. The toast is the only signal, so never skip it.
- A failed transaction also rolls back other pending transactions on the same row. Those reject
  with `undefined`. Treat that as "dropped", not as an unknown error.
- Collections are module singletons. Never create one in a component or route file.
- Spread the source row in `.select()` (`{ ...issue, extra }`) or the row loses `$hasPendingWrites`
  and `$origin`.
- Validate on the client with the same schema the server uses, so rejections stay rare.

## Closing check

Run `references/verify.md` against the real app with real Electric. Report each scenario as pass,
fail or not run. A build, a type check or reading this skill does not show the UI is instant. If
Electric could not run, say the patterns are unverified.
