// Data layer for `usage`: CLIProxyAPI grant files, gateway cooldown and oauth
// state from the cpa.log tail, live claude, codex and grok usage windows,
// provider status pages.
// collect() and the load/fetch functions do I/O. Everything else is pure, so the
// TUI, the plain/json output and the tests all read the same row model.

import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs"
import { homedir } from "node:os"

export const AUTH_DIR = `${homedir()}/.cli-proxy-api`
export const GATEWAY_LOG = `${AUTH_DIR}/cpa.log`
export const GATEWAY_HOST = "127.0.0.1:8317"

export const PROVIDER_ORDER = ["claude", "codex", "xai"] as const
export type ProviderKey = (typeof PROVIDER_ORDER)[number]

export type Grant = {
  file: string
  provider: ProviderKey
  email: string
  /** codex only: plan from the filename suffix, else from the id token */
  plan: string | null
  /** codex only: chatgpt_plan_type claim in the id token */
  claimPlan: string | null
  disabled: boolean
  expiresAt: Date | null
  lastRefresh: Date | null
  orgName?: string
  authKind?: string
  accountId?: string
  /** bearer token for the provider's live usage endpoint */
  accessToken?: string
}

export type GatewayEvent =
  | { kind: "cooldown"; armedAt: Date; resetAt: Date }
  | { kind: "oauth-block"; code: string }

/** One rate-limit window: "5h", "7d", "7d opus", codex "30d". */
export type UsageWindow = { label: string; usedPercent: number; resetAt: Date | null; scope?: string }
/** A limit reset the account can spend (codex reset credits, claude reset grants). */
export type ResetCredit = {
  title: string
  expiresAt: Date | null
  /** claude: resets left on this grant; codex credits are one each */
  left: number
}
/** Claude extra usage (pay past the plan limits). Amounts in minor units. */
export type ExtraUsage = {
  enabled: boolean
  usedMinor: number
  limitMinor: number | null
  currency: string
  exponent: number
  disabledReason: string | null
}
/** Claude: share of this week's usage per surface. Grok: usage per product. */
export type SurfaceShare = { name: string; percent: number }

export type ModelAvailability = { name: string; available: boolean; availableAt: Date | null; creditsWouldEnable: boolean }
export type PaidCredits = { balance: string | null; unlimited: boolean; overageLimitReached: boolean }

export type UsageLimits = {
  /** Account windows plus any separately scoped feature limits. */
  windows: UsageWindow[]
  /** some window is at 100% or upstream says the limit is reached */
  blocked: boolean
  /** available limit resets; null when the provider has none or the read failed */
  credits: ResetCredit[] | null
  /** claude extra usage, grok on-demand; null when not reported */
  extra: ExtraUsage | null
  breakdown: SurfaceShare[]
  /** plan from the usage response (claude "pro", "max5x"); null = use the grant's */
  plan: string | null
  models?: ModelAvailability[]
  paidCredits?: PaidCredits
  spendLimitReached?: boolean
  resetNotice?: string
  creditsError?: string
}

export type UsageResult = ({ ok: true } & UsageLimits) | { ok: false; error: string }

export type RowStatus =
  | { kind: "loading" }
  | { kind: "removed" } // disabled grant, out of the pool
  | { kind: "oauth-block"; code: string } // upstream rejected the grant
  | { kind: "expired"; at: Date } // claude/xai access token past expiry
  | { kind: "cooldown"; armedAt: Date; resetAt: Date } // gateway quota cooldown
  | ({ kind: "limits" } & UsageLimits) // live usage windows
  | { kind: "error"; message: string } // codex usage fetch failed
  | { kind: "ready" }

export type Row = {
  grant: Grant
  status: RowStatus
  /** why the default view hides this row; null = shown */
  hideReason: string | null
  /** claude/xai: the live usage fetch failed, so status fell back to the gateway log */
  usageError: string | null
  loading?: boolean
  updatedAt?: Date
}

export type ProviderStatus = {
  label: string
  state: "ok" | "bad" | "unknown"
  desc: string
  /** one or two words for the status line */
  descShort: string
  src: string
}

export type AppSnapshot = {
  now: Date
  rows: Row[]
  statuses: ProviderStatus[]
}

const KNOWN_CODEX_PLANS = new Set(["plus", "pro", "prolite", "team", "free"])

// ---------- formatting ----------

/** Compact remaining time: 4d2h, 6h45m, 12m. */
export function fmtRel(ms: number): string {
  if (ms <= 0) return "now"
  const mins = Math.max(1, Math.round(ms / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  return d > 0 ? `${d}d${h}h` : h > 0 ? `${h}h${m}m` : `${m}m`
}

const dateFmtDay = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" })
const dateFmtTime = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })

/** Local "2 Nov 21:30" (day/month order follows the system locale). */
export function fmtWhen(d: Date): string {
  return `${dateFmtDay.format(d)} ${dateFmtTime.format(d)}`
}

function fmtMoney(minor: number, exponent: number, currency: string): string {
  const value = minor / 10 ** exponent
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value)
  } catch {
    return `${value.toFixed(exponent)} ${currency}`
  }
}

/** "extra usage $3.20 / $100.00" or "extra usage off (out of credits)". */
export function extraUsageText(extra: ExtraUsage): string {
  const used = fmtMoney(extra.usedMinor, extra.exponent, extra.currency)
  if (extra.enabled) {
    return `extra usage ${used}${extra.limitMinor != null ? ` / ${fmtMoney(extra.limitMinor, extra.exponent, extra.currency)}` : ""}`
  }
  return `extra usage off${extra.disabledReason ? ` (${extra.disabledReason.replace(/_/g, " ")})` : ""}`
}

/** Resets the account can still spend, across all grants. */
export function resetsLeft(credits: ResetCredit[]): number {
  return credits.reduce((sum, c) => sum + c.left, 0)
}

/** Available reset count, type and expiry; distinct from automatic window resets. */
export function resetsText(credits: ResetCredit[]): string {
  if (credits.length === 0) return "limit resets: none"
  const list = credits.map(
    (c) => `${c.title}${c.left > 1 ? ` x${c.left}` : ""}${c.expiresAt ? ` until ${fmtWhen(c.expiresAt)}` : ""}`,
  )
  return `limit resets: ${resetsLeft(credits)} left · ${list.join(", ")}`
}

/** "this week: Claude Code 80%, Chats 20%". */
export function breakdownText(breakdown: SurfaceShare[]): string {
  return `usage breakdown: ${breakdown.map((b) => `${b.name} ${Math.round(b.percent)}%`).join(", ")}`
}

/** Supplementary limit information shared by terminal and plain output. */
export function limitDetails(status: UsageLimits, provider: ProviderKey, now: Date): string[] {
  const lines: string[] = []
  if (status.resetNotice && status.credits?.length === 0) lines.push(status.resetNotice)
  else if (status.credits !== null) lines.push(resetsText(status.credits))
  else if (provider !== "xai") lines.push(`limit resets: ${status.creditsError ?? "not reported"}`)
  if (status.resetNotice && status.credits?.length !== 0) lines.push(status.resetNotice)
  if (status.extra) lines.push(extraUsageText(status.extra))
  if (status.paidCredits) {
    const c = status.paidCredits
    lines.push(`paid credits: ${c.unlimited ? "unlimited" : c.balance ?? "balance not reported"}${c.overageLimitReached ? ", overage limit reached" : ""}`)
  }
  if (status.spendLimitReached !== undefined) lines.push(`spending limit: ${status.spendLimitReached ? "reached" : "not reached"}`)
  for (const model of status.models ?? []) {
    const wait = model.availableAt ? ` until ${fmtWhen(model.availableAt)} · ${fmtRel(model.availableAt.getTime() - now.getTime())}` : ""
    lines.push(`${model.name}: ${model.available ? "available" : `unavailable${wait}`}${model.creditsWouldEnable ? "; paid credits can enable access" : ""}`)
  }
  if (status.breakdown.length) lines.push(breakdownText(status.breakdown))
  return lines
}

// ---------- grants ----------

function parseTime(value: unknown): Date | null {
  if (typeof value !== "string" || value === "") return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function decodeJwtPayload(token: unknown): Record<string, unknown> | null {
  if (typeof token !== "string") return null
  const part = token.split(".")[1]
  if (!part) return null
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"))
  } catch {
    return null
  }
}

function suffixPlan(file: string): string | null {
  const segment = file.replace(/\.json$/, "").split("-").pop() ?? ""
  return KNOWN_CODEX_PLANS.has(segment) ? segment : null
}

function isProvider(value: string): value is ProviderKey {
  return (PROVIDER_ORDER as readonly string[]).includes(value)
}

/** Parse one grant file's JSON. Returns null for non-pool providers. */
export function grantFromJson(file: string, raw: Record<string, unknown>): Grant | null {
  const provider = String(raw.type ?? file.split("-", 1)[0])
  if (!isProvider(provider)) return null
  const claim = decodeJwtPayload(raw.id_token)
  const openaiAuth = claim?.["https://api.openai.com/auth"] as Record<string, unknown> | undefined
  const claimPlan = typeof openaiAuth?.chatgpt_plan_type === "string" ? openaiAuth.chatgpt_plan_type : null
  const grant: Grant = {
    file,
    provider,
    email: String(raw.email ?? file),
    plan: provider === "codex" ? (suffixPlan(file) ?? claimPlan) : null,
    claimPlan: provider === "codex" ? claimPlan : null,
    disabled: Boolean(raw.disabled),
    expiresAt: parseTime(raw.expired),
    lastRefresh: parseTime(raw.last_refresh),
  }
  if (provider === "claude") {
    grant.orgName = String(raw.organization_name ?? "")
    grant.accessToken = String(raw.access_token ?? "")
  }
  if (provider === "xai") {
    grant.authKind = String(raw.auth_kind ?? "")
    grant.accessToken = String(raw.access_token ?? "")
  }
  if (provider === "codex") {
    grant.accountId = String(raw.account_id ?? "")
    grant.accessToken = String(raw.access_token ?? "")
  }
  return grant
}

export function loadGrants(): Grant[] {
  const grants: Grant[] = []
  for (const name of Array.from(new Bun.Glob("{claude,codex,xai}-*.json").scanSync({ cwd: AUTH_DIR }))) {
    try {
      const grant = grantFromJson(name, JSON.parse(readFileSync(`${AUTH_DIR}/${name}`, "utf8")))
      if (grant) grants.push(grant)
    } catch {
      process.stderr.write(`usage: ${name} is unreadable, skipped\n`)
    }
  }
  return grants
}

/** Case-insensitive substring match on email or grant filename. */
export function matchesNeedle(grant: Grant, needle: string): boolean {
  const n = needle.toLowerCase()
  return grant.email.toLowerCase().includes(n) || grant.file.toLowerCase().includes(n)
}

// ---------- gateway state from the cpa.log tail ----------

// Cooldown lines repeat on every failed selection, so the last 512KB is plenty.
const LOG_TAIL = 512 * 1024
const COOLDOWN_RE = /auth_file=(?<file>[^,\s]+\.json),\s*reason=\w+,\s*remaining=(?<remaining>[\dhms]+)/g
const AUTH_FILE_RE = /auth_file=([^,\s]+\.json)/
const ERROR_CODE_RE = /"error_code"\s*:\s*"([\w-]+)"/
const LOG_STAMP_RE = /^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})\]/

function parseDurationSeconds(text: string): number | null {
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(text.trim())
  if (!m || m[0] === "") return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

/**
 * Latest cooldown or oauth-block event per grant file. Log lines are
 * chronological, so a later line replaces an earlier one. Timestamps are local.
 */
export function parseGatewayLog(text: string): Record<string, GatewayEvent> {
  const state: Record<string, GatewayEvent> = {}
  for (const line of text.split("\n")) {
    const stamp = LOG_STAMP_RE.exec(line)
    if (!stamp) continue
    const when = new Date(`${stamp[1]}T${stamp[2]}`)
    for (const match of line.matchAll(COOLDOWN_RE)) {
      const seconds = parseDurationSeconds(match.groups!.remaining)
      if (seconds === null) continue
      state[match.groups!.file] = { kind: "cooldown", armedAt: when, resetAt: new Date(when.getTime() + seconds * 1000) }
    }
    if (line.includes("upstream execution failed") && line.includes("permission_error")) {
      const file = AUTH_FILE_RE.exec(line)?.[1]
      if (file) state[file] = { kind: "oauth-block", code: ERROR_CODE_RE.exec(line)?.[1] ?? "oauth" }
    }
  }
  return state
}

export function loadGatewayState(): Record<string, GatewayEvent> {
  let fh: number | null = null
  try {
    const size = statSync(GATEWAY_LOG).size
    const start = Math.max(0, size - LOG_TAIL)
    const buf = Buffer.alloc(size - start)
    fh = openSync(GATEWAY_LOG, "r")
    readSync(fh, buf, 0, buf.length, start)
    return parseGatewayLog(buf.toString("utf8"))
  } catch {
    return {}
  } finally {
    if (fh !== null) closeSync(fh)
  }
}

// ---------- live codex usage ----------

const USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"
const CREDITS_URL = "https://chatgpt.com/backend-api/wham/rate-limit-reset-credits"

async function codexFetch(url: string, grant: Grant): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${grant.accessToken}`,
      "ChatGPT-Account-Id": grant.accountId ?? "",
      Accept: "application/json",
      "User-Agent": "codex_cli_rs/0.147.0",
      originator: "codex_cli_rs",
    },
    signal: AbortSignal.timeout(20_000),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

function windowLabel(seconds: unknown): string {
  if (typeof seconds !== "number" || seconds <= 0) return ""
  if (seconds % 86400 === 0) return `${seconds / 86400}d`
  if (seconds % 3600 === 0) return `${seconds / 3600}h`
  return `${Math.round(seconds / 60)}m`
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function codexWindow(value: unknown, fallback: string, scope?: string): UsageWindow[] {
  const w = record(value)
  if (typeof w.used_percent !== "number" || !Number.isFinite(w.used_percent)) return []
  const resetAt = typeof w.reset_at === "number" ? new Date(w.reset_at * 1000) : parseTime(w.reset_at)
  return [{ usedPercent: w.used_percent, resetAt, label: windowLabel(w.limit_window_seconds) || fallback, ...(scope ? { scope } : {}) }]
}

const atLimit = (windows: UsageWindow[]) => windows.some((w) => w.usedPercent >= 100)

/** Parse the two wham responses. Pure, so tests can feed recorded bodies. */
export function codexUsageFrom(usageBody: unknown, creditsBody: unknown): UsageResult & { ok: true } {
  const usage = record(usageBody)
  const rateLimit = record(usage.rate_limit)
  const resets = record(creditsBody)
  const credits: ResetCredit[] | null = creditsBody
    ? (Array.isArray(resets.credits) ? resets.credits : []).map(record)
        .filter((c) => c.status === "available" && c.is_supported_by_plan !== false)
        .map((c) => ({ title: String(c.title ?? "Rate-limit reset"), expiresAt: parseTime(c.expires_at), left: 1 }))
    : null
  const windows = [...codexWindow(rateLimit.primary_window, "5h"), ...codexWindow(rateLimit.secondary_window, "7d")]
  const blocked = Boolean(rateLimit.limit_reached) || rateLimit.allowed === false || atLimit(windows)
  const review = record(usage.code_review_rate_limit)
  windows.push(...codexWindow(review.primary_window, "5h", "Code review"), ...codexWindow(review.secondary_window, "7d", "Code review"))
  for (const item of Array.isArray(usage.additional_rate_limits) ? usage.additional_rate_limits : []) {
    const extra = record(item)
    const rate = record(extra.rate_limit)
    const scope = String(extra.limit_name ?? extra.metered_feature ?? "Additional limit")
    windows.push(...codexWindow(rate.primary_window, "5h", scope), ...codexWindow(rate.secondary_window, "7d", scope))
  }
  const paid = record(usage.credits)
  const spend = record(usage.spend_control)
  return {
    ok: true,
    windows,
    blocked,
    credits,
    extra: null,
    breakdown: [],
    plan: typeof usage.plan_type === "string" ? usage.plan_type : null,
    models: Object.entries(record(usage.model_usage)).flatMap(([name, value]) => {
      const model = record(value)
      return typeof model.available === "boolean" ? [{ name, available: model.available, availableAt: typeof model.available_at === "number" ? new Date(model.available_at * 1000) : parseTime(model.available_at), creditsWouldEnable: model.credits_would_enable === true }] : []
    }),
    ...(usage.credits ? { paidCredits: { balance: typeof paid.balance === "string" || typeof paid.balance === "number" ? String(paid.balance) : null, unlimited: paid.unlimited === true, overageLimitReached: paid.overage_limit_reached === true } } : {}),
    ...(typeof spend.reached === "boolean" ? { spendLimitReached: spend.reached } : {}),
  }
}

export async function fetchCodexUsage(grant: Grant, onUsage?: (usage: UsageResult) => void): Promise<UsageResult> {
  if (!grant.accessToken) return { ok: false, error: "grant has no access token" }
  try {
    const creditsPromise = codexFetch(CREDITS_URL, grant).catch(() => null)
    const usage = await codexFetch(USAGE_URL, grant)
    if (usage.status !== 200) return { ok: false, error: `usage fetch failed (${usage.status})` }
    if (!record(usage.body).rate_limit) return { ok: false, error: "usage response has no quota information" }
    onUsage?.({ ...codexUsageFrom(usage.body, null), creditsError: "checking…" })
    const credits = await creditsPromise
    const result = codexUsageFrom(usage.body, credits?.status === 200 ? credits.body : null)
    if (!credits || credits.status !== 200) result.creditsError = `unavailable${credits ? ` (HTTP ${credits.status})` : " (request failed)"}`
    return result
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------- live claude usage ----------

// The endpoint behind Claude Code's /usage. It takes the grant's oauth token.
// cedar_ember=1 adds the limit-reset grants; the server only fills that block
// for a claude-cli User-Agent and answers "ineligible: surface" otherwise.
const CLAUDE_USAGE_URL = "https://api.anthropic.com/api/oauth/usage?cedar_ember=1"
const CLAUDE_UA = "claude-cli/2.1.316 (external, cli)"

// Older response shape, used only when `limits` is missing.
const CLAUDE_FIELDS = [
  ["five_hour", "5h"],
  ["seven_day", "7d"],
  ["seven_day_opus", "7d opus"],
  ["seven_day_sonnet", "7d sonnet"],
] as const

/** session -> 5h, weekly_all -> 7d, weekly_opus -> 7d opus. */
function claudeLabel(kind: string, group: string): string {
  if (group === "session" || kind === "session") return "5h"
  if (kind === "weekly_all") return "7d"
  if (kind.startsWith("weekly_")) return `7d ${kind.slice("weekly_".length).replace(/_/g, " ")}`
  return kind.replace(/_/g, " ")
}

function claudeWindows(body: any): UsageWindow[] {
  if (Array.isArray(body?.limits) && body.limits.length > 0) {
    return body.limits
      .filter((l: any) => typeof l?.percent === "number")
      .map((l: any) => ({ label: claudeLabel(String(l.kind ?? ""), String(l.group ?? "")), usedPercent: l.percent, resetAt: parseTime(l.resets_at) }))
  }
  return CLAUDE_FIELDS.flatMap(([field, label]) => {
    const w = body?.[field]
    return typeof w?.utilization === "number" ? [{ label, usedPercent: w.utilization, resetAt: parseTime(w.resets_at) }] : []
  })
}

function claudeExtra(spend: any): ExtraUsage | null {
  if (!spend || typeof spend !== "object") return null
  return {
    enabled: Boolean(spend.enabled),
    usedMinor: Number(spend.used?.amount_minor ?? 0),
    limitMinor: typeof spend.limit?.amount_minor === "number" ? spend.limit.amount_minor : null,
    currency: String(spend.used?.currency ?? spend.limit?.currency ?? "USD"),
    exponent: Number(spend.used?.exponent ?? 2),
    disabledReason: typeof spend.disabled_reason === "string" ? spend.disabled_reason : null,
  }
}

const RESET_TITLE: Record<string, string> = { session: "5-hour reset", weekly: "weekly reset", full: "full reset" }

/**
 * Limit-reset grants from the cedar_ember block. Only grants with resets left
 * that are not paused count. null when the block is missing.
 */
function claudeResets(block: any): ResetCredit[] | null {
  if (!block || typeof block !== "object") return null
  const grants: any[] = Array.isArray(block.grants) ? block.grants : []
  return grants
    .filter((g) => typeof g?.resets_left === "number" && g.resets_left > 0 && !g.paused)
    .map((g) => ({
      title: String(g.label || RESET_TITLE[g.type] || "limit reset"),
      expiresAt: parseTime(g.ends_at),
      left: g.resets_left,
    }))
}

const CLAUDE_TIERS: Record<string, string> = {
  claude_pro: "pro",
  claude_max_5x: "max5x",
  claude_max_20x: "max20x",
  claude_team: "team",
}

/** Parse an oauth/usage response. Pure, so tests can feed recorded bodies. */
export function claudeUsageFrom(body: any): UsageResult & { ok: true } {
  const windows = claudeWindows(body)
  const rows: any[] = Array.isArray(body?.seven_day_breakdown?.rows) ? body.seven_day_breakdown.rows : []
  return {
    ok: true,
    windows,
    blocked: atLimit(windows),
    credits: claudeResets(body?.cedar_ember),
    extra: claudeExtra(body?.spend),
    breakdown: rows
      .filter((r) => typeof r?.percent === "number" && r.percent > 0)
      .map((r) => ({ name: String(r.display_name ?? r.key), percent: r.percent })),
    plan: CLAUDE_TIERS[String(body?.cedar_ember?.event_props?.tier)] ?? null,
    ...(body?.cedar_ember?.eligible === false && body.cedar_ember.ineligible_reason ? { resetNotice: `limit resets unavailable: ${String(body.cedar_ember.ineligible_reason).replace(/_/g, " ")}` } : {}),
  }
}

export async function fetchClaudeUsage(grant: Grant): Promise<UsageResult> {
  if (!grant.accessToken) return { ok: false, error: "grant has no access token" }
  try {
    const res = await fetch(CLAUDE_USAGE_URL, {
      headers: {
        Authorization: `Bearer ${grant.accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
        Accept: "application/json",
        "User-Agent": CLAUDE_UA,
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (res.status !== 200) return { ok: false, error: `usage fetch failed (${res.status})` }
    return claudeUsageFrom(await res.json())
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------- live grok usage ----------

// The endpoint behind `grok`'s /usage. It takes the xai grant's oauth token.
const GROK_BILLING_URL = "https://cli-chat-proxy.grok.com/v1/billing?format=credits"

const GROK_PERIOD_LABEL: Record<string, string> = {
  USAGE_PERIOD_TYPE_DAILY: "1d",
  USAGE_PERIOD_TYPE_WEEKLY: "7d",
  USAGE_PERIOD_TYPE_MONTHLY: "30d",
}

/** Parse a billing?format=credits response. Pure, so tests can feed recorded bodies. */
export function grokUsageFrom(body: any): UsageResult & { ok: true } {
  const config = body?.config ?? {}
  const period = config.currentPeriod ?? {}
  const windows: UsageWindow[] =
    typeof config.creditUsagePercent === "number"
      ? [
          {
            label: GROK_PERIOD_LABEL[String(period.type)] ?? "credits",
            usedPercent: config.creditUsagePercent,
            resetAt: parseTime(period.end) ?? parseTime(config.billingPeriodEnd),
          },
        ]
      : []
  const products: any[] = Array.isArray(config.productUsage) ? config.productUsage : []
  // on-demand amounts arrive as bare `val` numbers with no unit, so only the
  // off state is reported; a non-zero cap shows up in --json as null
  const onDemandCap = Number(config.onDemandCap?.val ?? 0)
  return {
    ok: true,
    windows,
    blocked: atLimit(windows),
    credits: null,
    extra:
      onDemandCap === 0
        ? { enabled: false, usedMinor: 0, limitMinor: null, currency: "USD", exponent: 2, disabledReason: null }
        : null,
    breakdown: products
      .filter((p) => typeof p?.usagePercent === "number")
      .map((p) => ({ name: String(p.product ?? "product"), percent: p.usagePercent })),
    plan: null,
  }
}

export async function fetchGrokUsage(grant: Grant): Promise<UsageResult> {
  if (!grant.accessToken) return { ok: false, error: "grant has no access token" }
  try {
    const res = await fetch(GROK_BILLING_URL, {
      headers: {
        Authorization: `Bearer ${grant.accessToken}`,
        "x-grok-client-version": "1.0.70",
        "x-grok-client-mode": "interactive",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (res.status !== 200) return { ok: false, error: `usage fetch failed (${res.status})` }
    return grokUsageFrom(await res.json())
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------- provider status pages ----------

// status.x.ai sits behind a Cloudflare challenge, so grok usually reports
// "unreachable" instead of a made-up green.
const STATUS_SOURCES = [
  { label: "claude", src: "status.claude.ai", url: "https://status.claude.ai/api/v2/status.json" },
  { label: "openai", src: "status.openai.com", url: "https://status.openai.com/api/v2/status.json" },
  { label: "grok", src: "status.x.ai", url: "https://status.x.ai/api/v2/status.json" },
] as const

const INDICATOR_SHORT: Record<string, string> = {
  none: "operational",
  minor: "degraded",
  major: "outage",
  critical: "critical",
  maintenance: "maintenance",
}

export function fetchProviderStatuses(onStatus?: (status: ProviderStatus) => void): Promise<ProviderStatus[]> {
  return Promise.all(
    STATUS_SOURCES.map(async ({ label, src, url }): Promise<ProviderStatus> => {
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": "usage-cli/2.0" },
          signal: AbortSignal.timeout(6000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body: any = await res.json()
        const indicator = String(body?.status?.indicator ?? "unknown")
        const desc = String(body?.status?.description ?? "unknown")
        const status: ProviderStatus = {
          label,
          src,
          state: indicator === "none" ? "ok" : "bad",
          desc,
          descShort: INDICATOR_SHORT[indicator] ?? desc,
        }
        onStatus?.(status)
        return status
      } catch (err) {
        const status: ProviderStatus = { label, src, state: "unknown", desc: err instanceof Error ? err.message : "unreachable", descShort: "unreachable" }
        onStatus?.(status)
        return status
      }
    }),
  )
}

// ---------- row model ----------

export function hideReasonOf(g: Grant): string | null {
  if (g.disabled) return "removed from pool"
  if (g.provider === "codex" && (g.plan === "free" || g.claimPlan === "free")) return "free tier"
  return null
}

/**
 * Status for one grant, from the live usage windows. A claude or xai row whose
 * fetch failed falls back to gateway log events; a codex row shows ERROR.
 * `usage` is undefined when a row was not fetched (hidden in batch mode).
 */
export function statusOf(now: Date, grant: Grant, event: GatewayEvent | undefined, usage: UsageResult | undefined): RowStatus {
  if (grant.disabled) return { kind: "removed" }
  if (grant.provider === "codex") {
    if (!usage) return { kind: "error", message: "not checked" }
    if (!usage.ok) return { kind: "error", message: usage.error }
    const { ok: _, ...limits } = usage
    return { kind: "limits", ...limits }
  }
  if (event?.kind === "oauth-block") return { kind: "oauth-block", code: event.code }
  if (usage?.ok) {
    const { ok: _, ...limits } = usage
    return { kind: "limits", ...limits }
  }
  if (grant.expiresAt && grant.expiresAt.getTime() <= now.getTime()) return { kind: "expired", at: grant.expiresAt }
  if (event?.kind === "cooldown") return liveStatus({ kind: "cooldown", armedAt: event.armedAt, resetAt: event.resetAt }, now)
  if (usage && !usage.ok) return { kind: "error", message: usage.error }
  return { kind: "ready" }
}

/** A cooldown that has run out is ready. The TUI re-applies this every tick. */
export function liveStatus(status: RowStatus, now: Date): RowStatus {
  return status.kind === "cooldown" && status.resetAt.getTime() <= now.getTime() ? { kind: "ready" } : status
}

/** True when the grant can serve a request right now. */
export function isUsable(status: RowStatus): boolean {
  return status.kind === "ready" || (status.kind === "limits" && !status.blocked)
}

/** Prefer the live plan to the filename or token's possibly stale plan. */
export function planOf(row: Row): string | null {
  return (row.status.kind === "limits" ? row.status.plan : null) ?? row.grant.plan
}

/** Provider name as the TUI and plain output say it. */
export function providerLabel(provider: ProviderKey): string {
  return provider === "xai" ? "grok" : provider
}

export function sortRows(rows: Row[]): Row[] {
  const rank = (p: ProviderKey) => PROVIDER_ORDER.indexOf(p)
  return [...rows].sort(
    (a, b) =>
      rank(a.grant.provider) - rank(b.grant.provider) ||
      a.grant.email.localeCompare(b.grant.email) ||
      a.grant.file.localeCompare(b.grant.file),
  )
}

export function buildRows(
  now: Date,
  grants: Grant[],
  gateway: Record<string, GatewayEvent>,
  usages: Map<string, UsageResult>,
): Row[] {
  return sortRows(
    grants.map((grant) => {
      const usage = usages.get(grant.file)
      return {
        grant,
        status: statusOf(now, grant, gateway[grant.file], usage),
        hideReason: hideReasonOf(grant),
        // codex shows a failed fetch as its ERROR status already
        usageError: grant.provider !== "codex" && usage && !usage.ok ? usage.error : null,
        ...(usage ? { updatedAt: now } : {}),
      }
    }),
  )
}

const FETCH_USAGE: Record<ProviderKey, (grant: Grant, onUsage?: (usage: UsageResult) => void) => Promise<UsageResult>> = {
  claude: fetchClaudeUsage,
  codex: fetchCodexUsage,
  xai: fetchGrokUsage,
}

const COLLECT_IO = { loadGrants, loadGatewayState, fetchUsage: FETCH_USAGE, fetchProviderStatuses }
export type CollectOptions = {
  needle?: string
  fetchHidden: boolean
  previous?: AppSnapshot
  onUpdate?: (snapshot: AppSnapshot) => void
}

/** Publish local accounts and each completed request without waiting for other providers. */
export async function collect(opts: CollectOptions, io = COLLECT_IO): Promise<AppSnapshot> {
  const grants = io.loadGrants().filter((g) => !opts.needle || matchesNeedle(g, opts.needle))
  const gateway = io.loadGatewayState()
  const toFetch = grants.filter((g) => !g.disabled && (opts.fetchHidden || hideReasonOf(g) === null))
  let rows = buildRows(new Date(), grants, gateway, new Map()).map(row => {
    if (!toFetch.some(g => g.file === row.grant.file)) return row
    const previous = opts.previous?.rows.find(r => r.grant.file === row.grant.file)
    return { ...row, status: previous?.status ?? { kind: "loading" as const }, updatedAt: previous?.updatedAt, loading: true }
  })
  let statuses: ProviderStatus[] = STATUS_SOURCES.map(({ label, src }) => ({ label, src, state: "unknown", desc: "Checking service status", descShort: "checking" }))
  const snapshot = (): AppSnapshot => ({ now: new Date(), rows, statuses })
  const publish = () => opts.onUpdate?.(snapshot())
  publish()
  await Promise.all([
    ...toFetch.map(async grant => {
      const accept = (usage: UsageResult, loading = false) => {
        const [updated] = buildRows(new Date(), [grant], gateway, new Map([[grant.file, usage]]))
        rows = rows.map(row => row.grant.file === grant.file ? { ...updated, loading } : row)
        publish()
      }
      let usage: UsageResult
      try { usage = await io.fetchUsage[grant.provider](grant, partial => accept(partial, true)) }
      catch (error) { usage = { ok: false, error: error instanceof Error ? error.message : "request failed" } }
      accept(usage)
    }),
    io.fetchProviderStatuses(status => {
      statuses = statuses.map(old => old.label === status.label ? status : old)
      publish()
    }).then(result => { statuses = result; publish() }),
  ])
  return snapshot()
}
