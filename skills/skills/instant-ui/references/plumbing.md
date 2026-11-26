# Plumbing

Postgres is the source of truth. Electric reads its replication stream and serves tables as
"shapes" over HTTP. The browser never talks to Electric directly: it reads shapes through a proxy
route you own, and writes through API routes you own.

```
reads:  useLiveQuery -> collection -> GET /api/shape/issues (auth, pin table + where) -> Electric -> Postgres WAL
writes: collection.update -> onUpdate -> POST /api/issues/update -> Postgres tx -> { txid }
        -> awaitTxId(txid) resolves when that txid arrives on the shape stream
```

## 1. Postgres

Electric needs Postgres 14 or newer with `wal_level = logical`, and a role with `REPLICATION` that
owns the synced tables (a local superuser covers both). Connect directly, not through a pooler.

Check: `psql -c 'show wal_level'` must print `logical`. Changing it needs a restart.

- Homebrew: set `wal_level = logical` in `$(brew --prefix)/var/postgresql@<v>/postgresql.conf`,
  then `brew services restart postgresql@<v>`. This changes a system service; ask first.
- Docker or OrbStack: `postgres:17-alpine` with `command: -c wal_level=logical`.
- Hosted (Neon, Supabase, Crunchy): enable logical replication in the provider settings.

Electric creates `electric_publication_default` and `electric_slot_default` itself. If Electric is
stopped for a long time, the slot holds WAL and the disk grows. Drop it with
`select pg_drop_replication_slot('electric_slot_default')`, or set `max_slot_wal_keep_size`.

## 2. Running Electric

Electric ships as the Docker image `electricsql/electric`. There is no binary, Homebrew formula or
npm package for the sync service.

| Path | When | Notes |
| --- | --- | --- |
| Docker or OrbStack | Default for local dev | Every Electric example assumes it. Copy `docker-compose.yaml` from `electric-sql/electric/examples/tanstack-db-web-starter` |
| Build from source | No container runtime, Elixir available | `git clone https://github.com/electric-sql/electric`, then in `packages/sync-service`: `mix deps.get` and `DATABASE_URL=... ELECTRIC_INSECURE=true mix run --no-halt`. Do not use its `.env.dev` as is (points at port 54321 with a password). Slowest first setup |
| Electric Cloud | No local Electric wanted | Needs a hosted Postgres; Cloud cannot reach localhost. The proxy adds `source_id` and `secret` |

Env: `DATABASE_URL` (required), `ELECTRIC_SECRET` or `ELECTRIC_INSECURE=true` for local dev only.
The HTTP port is 3000 inside the container; the starter maps it to 30000 on the host.

Check: `curl -i 'http://localhost:3000/v1/shape?table=issues&offset=-1'` returns 200 with
`electric-handle` and `electric-offset` headers.

Changing `DATABASE_URL` or the storage dir later means dropping the slot and publication, or
deleting Electric's storage dir. Its shape logs and the slot must stay in step.

## 3. HTTP/2 in dev

Browsers allow 6 HTTP/1.1 connections per origin. Each live shape holds one open long-poll, so 6
shapes stall the app and Vite HMR along with it. Serve dev over HTTP/2: run Caddy natively
(`brew install caddy`, `caddy trust` once) in front of the dev server. The starter ships a Vite
plugin for this in `src/vite-plugin-caddy.ts`. Use the portless named URL when the project has
one, and point Caddy at it.

## 4. The shape proxy

Current TanStack Start form: `createFileRoute(path)({ server: { handlers } })`. Electric's
`AGENTS.md` and older TanStack docs show `createServerFileRoute(...).methods(...)`, which is gone.

```ts
// src/lib/electric-proxy.ts
import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'

const ELECTRIC_URL = process.env.ELECTRIC_URL ?? 'http://localhost:3000'

type Shape = { table: string; columns?: string[]; where?: string; params?: string[] }

/** Forwards a shape request to Electric with the shape decided on the server. */
export async function proxyShape(request: Request, shape: Shape): Promise<Response> {
  const incoming = new URL(request.url)
  const origin = new URL(`${ELECTRIC_URL}/v1/shape`)

  // Only protocol params (offset, handle, live, cursor, subset__*) come from the client.
  incoming.searchParams.forEach((value, key) => {
    if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) origin.searchParams.set(key, value)
  })

  origin.searchParams.set('table', shape.table)
  if (shape.columns) origin.searchParams.set('columns', shape.columns.join(','))
  if (shape.where) origin.searchParams.set('where', shape.where)
  shape.params?.forEach((value, i) => origin.searchParams.set(`params[${i + 1}]`, value))

  if (process.env.ELECTRIC_SECRET) origin.searchParams.set('secret', process.env.ELECTRIC_SECRET)
  if (process.env.ELECTRIC_SOURCE_ID) origin.searchParams.set('source_id', process.env.ELECTRIC_SOURCE_ID)

  const res = await fetch(origin)
  const headers = new Headers(res.headers)
  headers.delete('content-encoding') // fetch already decompressed the body
  headers.delete('content-length')
  headers.set('vary', 'cookie') // the shape depends on who is asking
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}
```

```ts
// src/routes/api/shape/issues.ts
export const Route = createFileRoute('/api/shape/issues')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getUser(request)
        if (!user) return new Response('Unauthorized', { status: 401 })
        return proxyShape(request, {
          table: 'issues',
          where: 'workspace_id = $1',
          params: [user.workspaceId], // from the session, never from the client
        })
      },
    },
  },
})
```

Rules:

- The client never chooses `table`, `where`, `params` or `columns`. They are not protocol params,
  so the filter above drops them anyway.
- `columns` must include the primary key.
- Prefer `col = $1` and `col IN (subquery)` filters. Electric keeps about 5,000 row changes per
  second for those regardless of how many shapes exist. Other filters slow down as shapes multiply.
- Skipping the header deletes shows up as `ERR_CONTENT_DECODING_FAILED` or truncated JSON.
- `shapeOptions.url` on the client must be absolute: `new URL('/api/shape/issues', window.location.origin)`.
- Behind Vercel's CDN, disable caching for shape routes. Its cache key ignores `offset` and
  `handle`, so shapes stop updating.

## 5. Write routes

Each write runs in one Postgres transaction that also reads its own txid, and returns it as a
number.

```ts
// src/server/txid.ts
import { sql } from 'drizzle-orm'
import { db } from '@/db/connection'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** The id Electric will report for this transaction. Call inside the same db.transaction. */
export async function txidOf(tx: Tx): Promise<number> {
  const result = await tx.execute(sql`select pg_current_xact_id()::xid::text as txid`)
  return Number(result.rows[0].txid) // node-postgres; postgres-js returns the rows array directly
}
```

```ts
// src/routes/api/issues/update.ts
export const Route = createFileRoute('/api/issues/update')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUser(request)
        if (!user) return Response.json({ error: 'Sign in again.' }, { status: 401 })

        const input = updateIssueInput(await request.json()) // same schema as the client
        if (input instanceof type.errors) return Response.json({ error: input.summary }, { status: 422 })

        const txid = await db.transaction(async (tx) => {
          const txid = await txidOf(tx)
          const [row] = await tx
            .update(issues)
            .set({ ...input.patch, updatedAt: new Date() })
            .where(and(eq(issues.id, input.id), eq(issues.workspaceId, user.workspaceId)))
            .returning({ id: issues.id })
          if (!row) return null // nothing written; the transaction commits empty
          return txid
        })

        if (txid === null) return Response.json({ error: 'This issue was deleted or moved.' }, { status: 404 })
        return Response.json({ txid })
      },
    },
  },
})
```

Why each line matters:

- `::xid` strips the epoch so the number matches what logical replication sends.
- Reading the txid outside the write's transaction gives a different id. `awaitTxId` waits 15s,
  throws, and the client rolls back a row Postgres saved.
- A string txid makes `awaitTxId` throw `ExpectedNumberInAwaitTxIdError`.
- Non-2xx with a readable `error` is what the client handler throws and the toast shows.
- The ArkType check above (`type.errors`) is an example; use whichever validator the client
  collection uses, so client and server reject the same input.

## 6. Schema changes

Altering a synced table makes Electric drop its shapes. Clients get a 409 `must-refetch` and
resync from scratch. The client handles it; expect a full reload of that table after each
migration.

## 7. Failure lookup

| Symptom | Cause | Fix |
| --- | --- | --- |
| Edit saves, then reverts after about 15s | txid read outside the write transaction, or Electric not streaming | Read txid inside `db.transaction`; check the shape stream in the network tab |
| `ExpectedNumberInAwaitTxIdError` | txid returned as a string | `Number(...)` on the server |
| Value flickers back then forward on save | Handler returns before `awaitTxId`, or returns `{ txid }` | `await collection.utils.awaitTxId(txid)` in the handler |
| Writes fail with `MissingHandlerError` | Collection has no `onInsert`/`onUpdate`/`onDelete` | Add the handler, or write through `createOptimisticAction` |
| Shapes stall, HMR takes minutes | HTTP/1.1 with 6 or more shapes | HTTP/2 via Caddy |
| `ERR_CONTENT_DECODING_FAILED` | Proxy forwarded `content-encoding` | Delete `content-encoding` and `content-length` |
| 400 from the shape route | Proxy did not set `table`, or bad `where` syntax | Set `table` on every request; check operators (no JSONB, full-text or range operators) |
| 401 or 403 from Electric | `secret` or `source_id` missing | Set them server-side |
| Shape returns no rows for a new table | Electric could not add it to the publication | Give Electric's role ownership of the table |
| Dates are strings | No `timestamptz` parser | `parser: { timestamptz: (v) => new Date(v) }` |
| Disk grows while Electric is off | Replication slot holding WAL | Drop the slot or set `max_slot_wal_keep_size` |
| Debugging any of the above | | `localStorage.debug = 'ts/db:electric'` in the browser |
