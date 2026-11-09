#!/usr/bin/env bun
// usage: CLIProxyAPI account state. Interactive TUI in a terminal, plain text
// when piped, JSON or an exit code for agents. bin/usage launches this file.
import { existsSync } from "node:fs"
import {
  AUTH_DIR,
  collect,
  fmtRel,
  fmtWhen,
  GATEWAY_HOST,
  isUsable,
  liveStatus,
  limitDetails,
  planOf,
  providerLabel,
  type AppSnapshot,
  type Row,
  type RowStatus,
  type UsageWindow,
} from "./state"

const HELP = `usage: CLIProxyAPI (${GATEWAY_HOST}) account state

  usage              TUI in a terminal, plain text when piped
  usage <text>       only grants whose email or filename contains <text>
                     (shows hidden grants that match)
  usage --all        include hidden grants (removed from pool, free tier)
  usage --plain      plain text even in a terminal
  usage --json       every grant as JSON, hidden ones marked by hidden_by
  usage --check      exit 1 when a shown grant cannot serve requests,
                     or when none are shown

TUI keys: a show/hide hidden · r refresh · m motion on/off · ↑↓ or j/k select
          PgUp/PgDn or space scroll · home/end top/bottom · q, esc or ctrl-c quit
          Static bars by default. USAGE_MOTION=on enables motion.
`

const KNOWN_FLAGS = new Set(["--all", "--json", "--check", "--plain", "-h", "--help"])

type Options = { needle?: string; all: boolean; json: boolean; check: boolean; plain: boolean }

function parseArgs(argv: string[]): Options | string {
  const flags = argv.filter((a) => a.startsWith("-"))
  const positional = argv.filter((a) => !a.startsWith("-"))
  const unknown = flags.find((f) => !KNOWN_FLAGS.has(f))
  if (unknown) return `unknown option ${unknown}`
  if (positional.length > 1) return `one filter at most, got: ${positional.join(" ")}`
  return {
    needle: positional[0],
    all: flags.includes("--all"),
    json: flags.includes("--json"),
    check: flags.includes("--check"),
    plain: flags.includes("--plain"),
  }
}

// ---------- plain text ----------

function windowText(w: UsageWindow, now: Date): string {
  const reset = w.resetAt ? `resets ${fmtWhen(w.resetAt)} · ${fmtRel(w.resetAt.getTime() - now.getTime())}` : "reset time not reported"
  return `${w.scope ? `${w.scope} ` : ""}${w.label}  ${Math.round(w.usedPercent)}% used  ${Math.max(0, Math.round(100 - w.usedPercent))}% left  ${reset}`
}

function plainState(status: RowStatus): string {
  switch (status.kind) {
    case "loading":
      return "fetching live limits"
    case "oauth-block":
      return "blocked"
    case "limits":
      return status.blocked ? "limit" : "ready"
    default:
      return status.kind
  }
}

function plainDetail(row: Row, status: RowStatus, now: Date): string {
  switch (status.kind) {
    case "loading":
      return "fetching live limits"
    case "removed":
      return row.hideReason ?? "removed from pool"
    case "oauth-block":
      return `upstream oauth blocked: ${status.code}`
    case "expired":
      return `token expired ${fmtWhen(status.at)}`
    case "cooldown":
      return `${fmtRel(status.resetAt.getTime() - now.getTime())} left, resets ${fmtWhen(status.resetAt)}`
    case "limits": {
      return [...status.windows.map(w => windowText(w, now)), ...limitDetails(status, row.grant.provider, now)].join("\n  ")
    }
    case "error":
      return status.message
    case "ready":
      return row.grant.provider === "xai" && row.grant.expiresAt ? `token ${fmtRel(row.grant.expiresAt.getTime() - now.getTime())}` : ""
  }
}

/** Gateway fallback detail plus why the live claude fetch was skipped. */
function plainRowDetail(row: Row, status: RowStatus, now: Date): string {
  const detail = plainDetail(row, status, now)
  if (!row.usageError) return detail
  return [detail, `${providerLabel(row.grant.provider)} usage: ${row.usageError}`].filter(Boolean).join(" · ")
}

function plainLines(snap: AppSnapshot, shown: Row[], hidden: Row[]): string[] {
  const lines = [`CLIProxyAPI ${GATEWAY_HOST} · ${fmtWhen(snap.now)}`]
  lines.push(`status: ${snap.statuses.map((s) => `${s.label} ${s.descShort}`).join(" · ")}`, "")
  for (const row of shown) {
    const status = liveStatus(row.status, snap.now)
    lines.push([providerLabel(row.grant.provider), row.grant.email, planOf(row), plainState(status)].filter(Boolean).join("  "))
    const detail = plainRowDetail(row, status, snap.now)
    if (detail) lines.push(`  ${detail}`)
    lines.push("")
  }
  if (shown.length === 0) lines.push("no grants shown")
  if (hidden.length > 0) {
    const counts = new Map<string, number>()
    for (const row of hidden) counts.set(row.hideReason!, (counts.get(row.hideReason!) ?? 0) + 1)
    const summary = [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([reason, n]) => `${n} ${reason}`)
    lines.push("", `${hidden.length} hidden (${summary.join(", ")}); usage --all to show`)
  }
  return lines
}

// ---------- json ----------

const iso = (d: Date | null) => d?.toISOString() ?? null
const windowJson = (w: UsageWindow) => ({ label: w.label, used_percent: w.usedPercent, reset_at: iso(w.resetAt), ...(w.scope ? { scope: w.scope } : {}) })

function statusJson(status: RowStatus, now: Date) {
  switch (status.kind) {
    case "cooldown":
      return {
        kind: status.kind,
        armed_at: iso(status.armedAt),
        reset_at: iso(status.resetAt),
        remaining: fmtRel(status.resetAt.getTime() - now.getTime()),
      }
    case "oauth-block":
      return { kind: status.kind, code: status.code }
    case "expired":
      return { kind: status.kind, at: iso(status.at) }
    case "limits":
      return {
        kind: status.kind,
        blocked: status.blocked,
        windows: status.windows.map(windowJson),
        limit_resets: status.credits?.map((c) => ({ title: c.title, left: c.left, expires_at: iso(c.expiresAt) })) ?? null,
        extra_usage: status.extra
          ? {
              enabled: status.extra.enabled,
              used: status.extra.usedMinor / 10 ** status.extra.exponent,
              limit: status.extra.limitMinor != null ? status.extra.limitMinor / 10 ** status.extra.exponent : null,
              currency: status.extra.currency,
              disabled_reason: status.extra.disabledReason,
            }
          : null,
        weekly_breakdown: status.breakdown,
        models: status.models?.map(m => ({ name: m.name, available: m.available, available_at: iso(m.availableAt), credits_would_enable: m.creditsWouldEnable })) ?? null,
        paid_credits: status.paidCredits ? { balance: status.paidCredits.balance, unlimited: status.paidCredits.unlimited, overage_limit_reached: status.paidCredits.overageLimitReached } : null,
        spend_limit_reached: status.spendLimitReached ?? null,
        reset_notice: status.resetNotice ?? null,
        reset_credits_error: status.creditsError ?? null,
      }
    case "error":
      return { kind: status.kind, message: status.message }
    default:
      return { kind: status.kind }
  }
}

function jsonDump(snap: AppSnapshot): string {
  return JSON.stringify(
    {
      gateway: GATEWAY_HOST,
      fetched_at: iso(snap.now),
      statuses: snap.statuses,
      accounts: snap.rows.map((row) => {
        const status = liveStatus(row.status, snap.now)
        return {
          provider: row.grant.provider,
          email: row.grant.email,
          file: row.grant.file,
          plan: planOf(row),
          claim_plan: row.grant.claimPlan,
          disabled: row.grant.disabled,
          hidden_by: row.hideReason,
          usable: isUsable(status),
          token_expires_at: iso(row.grant.expiresAt),
          last_refresh: iso(row.grant.lastRefresh),
          usage_error: row.usageError,
          status: statusJson(status, snap.now),
        }
      }),
    },
    null,
    2,
  )
}

// ---------- entry ----------

async function runBatch(opts: Options): Promise<number> {
  if (!existsSync(AUTH_DIR)) {
    process.stderr.write(`usage: no auth dir at ${AUTH_DIR}\n`)
    return 1
  }
  // a filter search reveals matching hidden grants, like --all
  const showAll = opts.all || opts.needle !== undefined
  const snap = await collect({ needle: opts.needle, fetchHidden: showAll || opts.json })
  if (snap.rows.length === 0) {
    process.stderr.write(`usage: no grants${opts.needle ? ` matching '${opts.needle}'` : ""} in ${AUTH_DIR}\n`)
    return 1
  }
  const shown = snap.rows.filter((row) => showAll || row.hideReason === null)
  const hidden = snap.rows.filter((row) => !shown.includes(row))
  console.log(opts.json ? jsonDump(snap) : plainLines(snap, shown, hidden).join("\n"))
  if (!opts.check) return 0
  const failing = shown.length === 0 || shown.some((row) => !isUsable(liveStatus(row.status, snap.now)))
  if (failing && !opts.json) console.log("\ncheck: a shown grant cannot serve requests")
  return failing ? 1 : 0
}

const parsed = parseArgs(Bun.argv.slice(2))
if (typeof parsed === "string") {
  process.stderr.write(`usage: ${parsed}\n\n${HELP}`)
  process.exit(2)
}
if (Bun.argv.includes("-h") || Bun.argv.includes("--help")) {
  console.log(HELP)
  process.exit(0)
}

const interactive = Boolean(process.stdout.isTTY && process.stdin.isTTY) && !parsed.json && !parsed.check && !parsed.plain
if (interactive && existsSync(AUTH_DIR)) {
  try {
    const { runTui } = await import("./tui")
    await runTui({ needle: parsed.needle, showAll: parsed.all || parsed.needle !== undefined })
  } catch (err) {
    process.stderr.write(`usage: TUI unavailable (${err instanceof Error ? err.message : String(err)}), plain mode\n`)
    process.exitCode = await runBatch(parsed)
  }
} else {
  process.exitCode = await runBatch(parsed)
}
