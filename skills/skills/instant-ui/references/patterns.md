# Patterns: code

React + TanStack Start, TanStack DB `1.0.0-rc.1.5`. The examples use one `issues` table with
`id`, `title`, `status`, `priority`, `assigneeId`, `updatedAt`. Rename to fit.

Imports used throughout:

```ts
import { createCollection, safeRandomUUID, eq, ilike, useLiveQuery, useLiveQueryEffect,
  useLiveInfiniteQuery, createOptimisticAction, createPacedMutations, debounceStrategy,
  type Transaction } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
```

If an import fails, check `node_modules/@tanstack/react-db/dist/esm/index.d.ts`. Core helpers are
re-exported from `react-db`, and `@tanstack/db` exports the same names.

## The collection

Everything else depends on this being right.

```ts
// src/lib/collections.ts (module scope, never inside a component)
async function send(path: string, body: unknown): Promise<number> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { txid?: number; error?: string }
  if (!res.ok || typeof json.txid !== 'number') {
    throw new Error(json.error ?? `Request failed (${res.status})`) // throwing rolls back
  }
  return json.txid
}

export const issueCollection = createCollection(
  electricCollectionOptions({
    id: 'issues',
    schema: issueSchema, // same schema the server validates with
    getKey: (issue) => issue.id,
    shapeOptions: {
      url: new URL('/api/shape/issues', window.location.origin).toString(),
      parser: { timestamptz: (v: string) => new Date(v) },
    },
    onInsert: async ({ transaction, collection }) => {
      const txids = await Promise.all(
        transaction.mutations.map((m) => send('/api/issues/insert', m.modified)),
      )
      await Promise.all(txids.map((t) => collection.utils.awaitTxId(t)))
    },
    onUpdate: async ({ transaction, collection }) => {
      const txids = await Promise.all(
        transaction.mutations.map((m) => send('/api/issues/update', { id: m.key, patch: m.changes })),
      )
      await Promise.all(txids.map((t) => collection.utils.awaitTxId(t)))
    },
    onDelete: async ({ transaction, collection }) => {
      const txids = await Promise.all(
        transaction.mutations.map((m) => send('/api/issues/delete', { id: m.key })),
      )
      await Promise.all(txids.map((t) => collection.utils.awaitTxId(t)))
    },
  }),
)
```

The handler resolving is what drops the optimistic layer. Resolve early and the row shows the old
synced value until the echo lands. That is the flicker in pattern 7.

`awaitTxId` defaults to a 15s timeout and throws `TimeoutWaitingForTxIdError`. That rolls back a
write Postgres already has. If you prefer the saved value to stay on screen when sync is slow,
catch that error inside the handler and return.

`timestamptz` needs both the schema coercion (mutation path) and the `parser` (sync path).

## 1. No spinner on navigation

```tsx
export const Route = createFileRoute('/issues')({
  ssr: false,
  loader: async () => {
    await Promise.all([issueCollection.preload(), userCollection.preload()])
    return null
  },
  component: Issues,
})
```

Set `defaultSsr: false` in `createStart` too, or loaders run on the server where collections cannot
sync. SSR with hydration exists (`DbClient`, `HydrationBoundary`) but is not needed here.

An eager collection with no readers is garbage collected after `gcTime` (5 minutes), and a live
query collection after 5 seconds. For lists users return to all day, keep one subscriber mounted in
the app shell, or raise `gcTime` on the collection.

For `syncMode: 'on-demand'`, `collection.preload()` does nothing. Create the live query once at
module scope with `createLiveQueryCollection`, `await liveQuery.preload()` in the loader, and pass
that same collection to `useLiveQuery(liveQuery)`.

## 2. Empty only when true

```tsx
const { data: issues, isReady } = useLiveQuery({
  query: (q) => q.from({ issue: issueCollection }).orderBy(({ issue }) => issue.updatedAt, 'desc'),
})
if (!isReady) return null // the frame is already on screen; no spinner
if (issues.length === 0) return <EmptyState />
```

After pattern 1, `isReady` is already true on first render, so this branch costs nothing.

## 3. Same-frame edits

```ts
issueCollection.insert({ id: safeRandomUUID(), title, status: 'todo', priority: 0, updatedAt: new Date() })
issueCollection.update(id, (d) => { d.status = 'done' }) // mutate the draft, do not return
issueCollection.delete(id)
```

Keys come from the client so the optimistic row and the synced row are the same row. Primary keys
cannot change (`KeyUpdateNotAllowedError`).

## 4. Quiet pending

```tsx
function PendingDot({ pending }: { pending: boolean }) {
  if (!pending) return null
  return <span aria-label="Saving" className="size-1.5 rounded-full bg-current opacity-0 animate-[appear_0s_1s_forwards]" />
}
// @keyframes appear { to { opacity: .5 } }

<PendingDot pending={issue.$hasPendingWrites} />
```

On a healthy connection the echo lands well before 1s, so the dot never shows. It appears only
when something is slow. The 1s value applies Nielsen's 0.1s and 1s limits; no sync source gives a
number, so tune it.

`$hasPendingWrites` turns false when the handler resolves. That is server confirmation only because
the handler awaits the txid.

For an app-level "unsynced changes" indicator, use
`useLiveQuery({ query: (q) => q.from({ issue: issueCollection }).where(({ issue }) => eq(issue.$hasPendingWrites, true)) })`.

## 5. Wait on destructive actions

```ts
async function deleteIssue(id: string) {
  const tx = issueCollection.delete(id, { optimistic: false })
  await tx.when('settled') // throws on rejection; the dialog shows the error
  closeDialog()
}
```

Reversible actions stay optimistic. Use this only where a row disappearing and then coming back
would confuse people more than a short wait.

## 6. Visible rollback

Every write goes through one helper, so no call site can forget the catch.

```ts
// src/lib/write.ts
import { toast } from 'sonner' // any toast library

// Debounced calls merge into one pending transaction; report each transaction once.
const watched = new WeakSet<Transaction>()

export function write(label: string, run: () => Transaction, onRetry?: () => void) {
  const tx = run()
  if (watched.has(tx)) return tx
  watched.add(tx)
  tx.when('settled').catch((error: unknown) => {
    // undefined means a pending write was dropped because an earlier one on the same row failed
    const reason = error instanceof Error ? error.message : 'An earlier change to this item failed'
    toast.error(`${label} was undone. ${reason}`, onRetry ? { action: { label: 'Retry', onClick: onRetry } } : undefined)
  })
  return tx
}

export const setStatus = (id: string, status: Status) =>
  write('Status change', () => issueCollection.update(id, (d) => { d.status = status }), () => setStatus(id, status))
```

The library catches the settlement promise internally, so a write nobody awaits fails with no log
and no exception. This helper is the only thing that tells the user.

## 7. No flicker on confirm

Covered by the collection handlers above, plus the server contract in `plumbing.md`. Check:
throttle the network, edit a row, and watch that the value never shows the old text again.

## 8. Live remote changes

```tsx
function useRemoteFlash() {
  const [flashing, setFlashing] = useState<ReadonlyMap<string, number>>(new Map())
  useLiveQueryEffect(
    {
      query: (q) => q.from({ issue: issueCollection }),
      skipInitial: true,
      onUpdate: (e) => {
        if (e.value.$origin !== 'remote') return
        setFlashing((m) => new Map(m).set(String(e.key), Date.now()))
      },
    },
    [],
  )
  const done = (id: string) => setFlashing((m) => { const n = new Map(m); n.delete(id); return n })
  return { flashing, done }
}

// in the row: the key restarts the animation if the same row changes again
<div
  key={flashing.get(issue.id) ?? 'idle'}
  data-flash={flashing.has(issue.id) || undefined}
  onAnimationEnd={() => done(issue.id)}
  className="data-[flash]:animate-[flash_1.2s_ease-out] motion-reduce:animate-none"
/>
// @keyframes flash { from { background: color-mix(in oklch, var(--accent) 18%, transparent) } }
```

Without the `$origin` filter your own edit flashes twice: once on the optimistic apply and once on
the confirm. Both events carry `$origin: 'local'`. `$origin` is inferred from key and timing. A
teammate's write that lands while your own write to the same row is in flight can read as `local`
and not flash. That is acceptable for a highlight. Do not use `$origin` for anything that must be
correct.

## 9. Local filter and search

```tsx
const { data } = useLiveQuery({
  query: (q) => {
    let query = q.from({ issue: issueCollection })
    if (status) query = query.where(({ issue }) => eq(issue.status, status))
    if (search) query = query.where(({ issue }) => ilike(issue.title, `%${search}%`))
    return query.orderBy(({ issue }) => issue.updatedAt, 'desc')
  },
})
```

No dependency array. The hook derives identity from the query and the values it captures. Chained
`where` calls combine with AND. Joins take equality only. `limit` and `offset` need `orderBy`.

Filtering is local and instant only when the source is `eager`. With `on-demand` the predicate goes
to the server.

For large tables, add indexes: `autoIndex: 'eager'` with `defaultIndexType: BasicIndex` on the
collection, or `collection.createIndex()`.

## 10. Autosave typing

```ts
// module scope: one timer shared by every component editing titles
export const saveTitle = createPacedMutations<{ id: string; title: string }>({
  onMutate: ({ id, title }) => issueCollection.update(id, (d) => { d.title = title }),
  mutationFn: async ({ transaction }) => {
    const txids = await Promise.all(
      transaction.mutations.map((m) => send('/api/issues/update', { id: m.key, patch: m.changes })),
    )
    await Promise.all(txids.map((t) => issueCollection.utils.awaitTxId(t)))
  },
  strategy: debounceStrategy({ wait: 600 }),
})

<input value={issue.title} onChange={(e) => write('Title', () => saveTitle({ id: issue.id, title: e.target.value }))} />
```

The input is controlled by the collection row. No local draft state. Calling `commit()` on a paced
transaction throws; the strategy commits. If a save fails, everything typed since it started rolls
back too, so the toast matters here more than anywhere.

## 11. Bulk actions

```ts
export const bulkSetStatus = createOptimisticAction<{ ids: string[]; status: Status }>({
  onMutate: ({ ids, status }) => {
    issueCollection.update(ids, (drafts) => drafts.forEach((d) => { d.status = status }))
  },
  mutationFn: async ({ ids, status }) => {
    const txid = await send('/api/issues/bulk-status', { ids, status })
    await issueCollection.utils.awaitTxId(txid)
  },
})

write(`Move ${ids.length} issues`, () => bulkSetStatus({ ids, status: 'done' }))
```

`onMutate` must be synchronous. Collection `onUpdate` does not run for these mutations, so the
`mutationFn` is the only thing that persists and waits. Make the server call one Postgres
transaction so it returns one txid.

## 12. Undo

There is no undo API. Record the inverse when you write.

```ts
// src/lib/undo.ts
type Entry = { label: string; undo: () => void; redo: () => void; reselect?: () => void }
const past: Entry[] = []
const future: Entry[] = []

export function undoable(entry: Entry) {
  entry.redo()
  past.push(entry)
  future.length = 0
}
export function undo() {
  const e = past.pop(); if (!e) return
  e.undo(); e.reselect?.(); future.push(e)
}
export function redo() {
  const e = future.pop(); if (!e) return
  e.redo(); e.reselect?.(); past.push(e)
}

// usage
export function setStatusUndoable(ids: string[], status: Status) {
  const before = new Map(ids.map((id) => [id, issueCollection.get(id)?.status]))
  undoable({
    label: 'Status change',
    redo: () => write('Status change', () => bulkSetStatus({ ids, status })),
    undo: () => ids.forEach((id) => {
      const prev = before.get(id)
      if (prev) write('Undo', () => issueCollection.update(id, (d) => { d.status = prev }))
    }),
    reselect: () => selectRows(ids),
  })
}
```

Undo is a normal synced write. It can overwrite a teammate's newer value on the same field. That is
the same last-writer-wins rule as every other write. Say so in the product if it matters.

## 13. Stale but usable

```tsx
const { data, isLoadingError, isCrashed, isSyncError, health, collection } = useLiveQuery({ query })
if (isCrashed) return <StorageBroken /> // recover: await collection.cleanup({ dependents: true }), then preload
if (isLoadingError) return <LoadFailed onRetry={() => collection.reload()} />
return (
  <>
    {isSyncError && <SyncBanner reloading={health?.reloading} onReload={() => collection.reload()} />}
    <IssueList rows={data} />
  </>
)
```

After the first load, network failures never change `status`. Rows stay on screen. Electric flags a
problem after five consecutive failed shape requests (under 1s to about 15s with default backoff),
and the next successful sync clears it. For a faster "offline" hint, also listen to
`navigator.onLine`.

## 14. Long lists

Eager source, all rows local: render the whole ordered result through a virtualizer.

```tsx
const { data } = useLiveQuery({
  query: (q) => q.from({ issue: issueCollection }).orderBy(({ issue }) => issue.updatedAt, 'desc'),
})
const parentRef = useRef<HTMLDivElement>(null)
const virtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 36,
  overscan: 10,
  getItemKey: (i) => data[i].id,
})
```

On-demand source: `useLiveInfiniteQuery((q) => ..., { pageSize: 50 })` returns a flat `data` array
plus `fetchNextPage` and `hasNextPage`. Call `fetchNextPage` when the last virtual item is within
10 rows of the end. `fetchNextPage` resolves even when the page fails; read `health` after it.

## 15. Keyboard first

```ts
const actions = [
  { id: 'status.done', label: 'Mark as done', keys: 'd', run: (ids: string[]) => setStatusUndoable(ids, 'done') },
  { id: 'undo', label: 'Undo', keys: 'mod+z', run: () => undo() },
  { id: 'redo', label: 'Redo', keys: 'mod+shift+z', run: () => redo() },
]
```

One action list feeds the shortcuts, the Cmd+K menu and the context menu, and shows each shortcut
next to its label. Every `run` is synchronous, so the menu closes on the same frame the row changes.
