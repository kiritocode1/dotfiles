import { describe, expect, test } from "bun:test"
import { createTestRenderer, KeyCodes } from "@opentui/core/testing"
import { createRoot } from "@opentui/react"
import { testRender } from "@opentui/react/test-utils"
import { act } from "react"
import { App } from "./app"
import { Main } from "./tui"
import { fixtureSnapshot } from "./fixture"
import { fixtureUi, renderFrame } from "./preview"
import { claudeUsageFrom, codexUsageFrom, collect, fetchCodexUsage, fmtWhen, grokUsageFrom, isUsable, liveStatus, parseGatewayLog, statusOf, type AppSnapshot, type Grant, type ProviderStatus, type UsageResult } from "./state"

const now = new Date("2026-11-02T14:00:00")

describe("gateway log", () => {
  const log = [
    "[2026-11-02 10:00:00] [a] [warn ] auth unavailable: [provider=claude auth_file=claude-a.json, reason=quota, remaining=2h0m0s]",
    "[2026-11-02 12:00:00] [b] [warn ] auth unavailable: [provider=claude auth_file=claude-a.json, reason=quota, remaining=3h30m0s]",
    '[2026-11-02 12:05:00] [c] [error] upstream execution failed auth_file=claude-b.json permission_error {"error_code":"oauth_not_allowed"}',
  ].join("\n")

  test("latest cooldown line wins and reset is armed time plus remaining", () => {
    const event = parseGatewayLog(log)["claude-a.json"]
    expect(event).toEqual({
      kind: "cooldown",
      armedAt: new Date("2026-11-02T12:00:00"),
      resetAt: new Date("2026-11-02T15:30:00"),
    })
  })

  test("oauth rejection is read with its error code", () => {
    expect(parseGatewayLog(log)["claude-b.json"]).toEqual({ kind: "oauth-block", code: "oauth_not_allowed" })
  })
})

describe("row status", () => {
  const claude: Grant = { file: "claude-a.json", provider: "claude", email: "a@x", plan: null, claimPlan: null, disabled: false, expiresAt: null, lastRefresh: null }

  test("a cooldown that already ended is ready", () => {
    const status = statusOf(now, claude, { kind: "cooldown", armedAt: new Date("2026-11-02T08:00:00"), resetAt: new Date("2026-11-02T13:00:00") }, undefined)
    expect(status).toEqual({ kind: "ready" })
  })

  test("an active cooldown turns ready once its reset passes", () => {
    const status = statusOf(now, claude, { kind: "cooldown", armedAt: now, resetAt: new Date("2026-11-02T15:00:00") }, undefined)
    expect(isUsable(status)).toBe(false)
    expect(liveStatus(status, new Date("2026-11-02T15:00:01"))).toEqual({ kind: "ready" })
  })

  test("codex at 100% primary is blocked even if limit_reached is false", () => {
    const usage = codexUsageFrom({ rate_limit: { allowed: true, limit_reached: false, primary_window: { used_percent: 100, limit_window_seconds: 18000, reset_at: 1793620000 } } }, null)
    const codex: Grant = { ...claude, file: "codex-a.json", provider: "codex" }
    const status = statusOf(now, codex, undefined, usage)
    expect(status.kind === "limits" && status.windows[0].label).toBe("5h")
    expect(isUsable(status)).toBe(false)
  })

  // trimmed from a live oauth/usage response: 5h low, weekly maxed
  const claudeBody = {
    five_hour: { utilization: 0, resets_at: null },
    seven_day: { utilization: 100, resets_at: "2026-11-06T01:59:59.634589+00:00" },
    limits: [
      { kind: "session", group: "session", percent: 0, severity: "normal", resets_at: null },
      { kind: "weekly_all", group: "weekly", percent: 100, severity: "critical", resets_at: "2026-11-06T01:59:59.634589+00:00" },
      { kind: "weekly_opus", group: "weekly", percent: 12, severity: "normal", resets_at: "2026-11-06T01:59:59.634589+00:00" },
    ],
    spend: { enabled: false, disabled_reason: "out_of_credits", used: { amount_minor: 0, currency: "USD", exponent: 2 }, limit: { amount_minor: 10000, currency: "USD", exponent: 2 } },
    seven_day_breakdown: { rows: [{ key: "claude_code", display_name: "Claude Code", percent: 100 }, { key: "chat", display_name: "Chats", percent: 0 }] },
    cedar_ember: {
      eligible: true,
      grants: [
        { id: "g1", label: "", type: "weekly", resets_total: 2, resets_left: 1, ends_at: "2026-11-12T00:00:00+00:00", paused: false },
        { id: "g2", label: "", type: "session", resets_total: 1, resets_left: 0, paused: false },
        { id: "g3", label: "", type: "full", resets_total: 1, resets_left: 1, paused: true },
      ],
      event_props: { tier: "claude_max_5x" },
    },
  }

  test("claude windows come from limits, and a maxed weekly blocks the grant", () => {
    const usage = claudeUsageFrom(claudeBody)
    expect(usage.windows.map((w) => `${w.label} ${w.usedPercent}`)).toEqual(["5h 0", "7d 100", "7d opus 12"])
    expect(usage.windows[1].resetAt).toEqual(new Date("2026-11-06T01:59:59.634589Z"))
    expect(usage.breakdown).toEqual([{ name: "Claude Code", percent: 100 }])
    expect(usage.extra?.disabledReason).toBe("out_of_credits")
    expect(usage.plan).toBe("max5x")
    expect(isUsable(statusOf(now, claude, undefined, usage))).toBe(false)
  })

  test("only claude reset grants with resets left and not paused count", () => {
    expect(claudeUsageFrom(claudeBody).credits).toEqual([
      { title: "weekly reset", expiresAt: new Date("2026-11-12T00:00:00Z"), left: 1 },
    ])
  })

  test("grok weekly credits at 100% block the grant until the period ends", () => {
    // trimmed from a live billing?format=credits response
    const usage = grokUsageFrom({
      config: {
        currentPeriod: { type: "USAGE_PERIOD_TYPE_WEEKLY", start: "2026-11-03T15:09:38+00:00", end: "2026-11-10T15:09:38+00:00" },
        creditUsagePercent: 100.0,
        onDemandCap: { val: 0 },
        productUsage: [{ product: "GrokBuild", usagePercent: 100.0 }],
      },
    })
    expect(usage.windows).toEqual([{ label: "7d", usedPercent: 100, resetAt: new Date("2026-11-10T15:09:38Z") }])
    const xai: Grant = { ...claude, file: "xai-a.json", provider: "xai" }
    expect(isUsable(statusOf(now, xai, undefined, usage))).toBe(false)
  })

  test("a failed claude fetch falls back to the gateway cooldown", () => {
    const event = { kind: "cooldown", armedAt: now, resetAt: new Date("2026-11-02T15:00:00") } as const
    expect(statusOf(now, claude, event, { ok: false, error: "usage fetch failed (429)" }).kind).toBe("cooldown")
  })

  test("only available reset credits are kept", () => {
    const usage = codexUsageFrom({ rate_limit: {} }, { credits: [{ status: "available", title: "Full reset" }, { status: "used", title: "Old" }] })
    expect(usage.credits).toEqual([{ title: "Full reset", expiresAt: null, left: 1 }])
  })
})

describe("render", () => {
  const snapshot = fixtureSnapshot(now)

  for (const width of [60, 80, 120]) {
    test(`all quotas, account identities and reset times remain readable at ${width} cols`, async () => {
      const frame = await renderFrame(fixtureUi(now, true, null), width, 100)
      const windows = snapshot.rows.flatMap(row => row.status.kind === "limits" ? row.status.windows : [])
      const quotaLines = frame.split("\n").filter(line => /\d+% used/.test(line))
      expect(quotaLines).toHaveLength(windows.length)
      expect(new Set(quotaLines.map(line => line.search(/[█░]/)))).toEqual(new Set([15]))
      for (const line of quotaLines) expect(line).toContain("% left")
      for (const row of snapshot.rows) expect(frame).toContain(row.grant.email)
      for (const w of windows) if (w.resetAt) expect(frame).toContain(fmtWhen(w.resetAt))
      expect(frame).toContain("gpt-6-astra: available")
      expect(frame).toContain("paid credits: 0")
      expect(frame).toContain("usage breakdown: GrokBuild 100%")
      expect(frame).not.toMatch(/[╭╰│└]/)
    })
  }

  test("default view hides removed and free-tier grants and counts them", async () => {
    const frame = await renderFrame(fixtureUi(now, false, null), 100)
    expect(frame).not.toContain("Removed")
    expect(frame).not.toContain("prolite")
    expect(frame).toContain("2 hidden (1 removed, 1 free tier)")
  })

  test("a short terminal can scroll to the last account without losing header or keys", async () => {
    const setup = await createTestRenderer({ width: 80, height: 24 })
    try {
      createRoot(setup.renderer).render(<App ui={{ ...fixtureUi(now, false, null), width: 80 }} />)
      await setup.renderOnce()
      expect(setup.captureCharFrame()).not.toContain("usage breakdown: GrokBuild 100%")
      setup.mockInput.pressKey(KeyCodes.END)
      await setup.renderOnce()
      const frame = setup.captureCharFrame()
      expect(frame).toContain("usage breakdown: GrokBuild 100%")
      expect(frame).toContain("usage  Updated")
      expect(frame).toContain("q quit")
      setup.mockInput.pressKey(KeyCodes.HOME)
      await setup.renderOnce()
      expect(setup.captureCharFrame()).toContain("blankinterfaces@gmail.com")
    } finally { setup.renderer.destroy() }
  })

  test("selection, show all, refresh, motion and quit work through the main view", async () => {
    let refreshes = 0
    let quit = false
    const firstFetch = Promise.withResolvers<void>()
    const collectSnapshot: typeof collect = async opts => {
      refreshes++
      if (refreshes === 1) await firstFetch.promise
      opts.onUpdate?.(snapshot)
      return snapshot
    }
    const setup = await testRender(<Main initialShowAll={false} collectSnapshot={collectSnapshot} onQuit={() => { quit = true }} />, { width: 80, height: 24 })
    try {
      await act(async () => { firstFetch.resolve() })
      await act(async () => { await setup.renderOnce() })
      await setup.waitForFrame(frame => frame.includes("Claude"))
      await act(async () => { setup.mockInput.pressKey("k") })
      await act(async () => { await setup.renderOnce() })
      await setup.waitForFrame(frame => frame.includes("xai-kathawalearyan9@gmail.com.json"))
      await act(async () => { setup.mockInput.pressKey("a") })
      await act(async () => { await setup.renderOnce() })
      await setup.waitForFrame(frame => frame.includes("All accounts"))
      await act(async () => { setup.mockInput.pressKey("m") })
      await act(async () => { await setup.renderOnce() })
      await setup.waitForFrame(frame => frame.includes("motion off"))
      await act(async () => { setup.mockInput.pressKey("r") })
      await setup.waitFor(() => refreshes === 2)
      await act(async () => { setup.mockInput.pressKey("q") })
      expect(quit).toBe(true)
    } finally { setup.renderer.destroy() }
  })
})

describe("complete limits", () => {
  test("feature limits and model availability do not block the whole account", () => {
    const result = codexUsageFrom({
      rate_limit: { allowed: true, primary_window: { used_percent: 14 } },
      code_review_rate_limit: { allowed: false, primary_window: { used_percent: 100 } },
      additional_rate_limits: [{ limit_name: "Research", rate_limit: { primary_window: { used_percent: 90 } } }],
      model_usage: { "gpt-6-astra": { available: false, available_at: "2026-11-03T00:00:00Z", credits_would_enable: true } },
      credits: { balance: "12.5", unlimited: false, overage_limit_reached: true },
      spend_control: { reached: true },
    }, { credits: [{ status: "available", is_supported_by_plan: false }, { status: "available", title: "Full reset" }] })
    expect(result.windows.map(w => w.scope)).toEqual([undefined, "Code review", "Research"])
    expect(result.blocked).toBe(false)
    expect(result.models?.[0]).toEqual({ name: "gpt-6-astra", available: false, availableAt: new Date("2026-11-03T00:00:00Z"), creditsWouldEnable: true })
    expect(result.paidCredits?.balance).toBe("12.5")
    expect(result.spendLimitReached).toBe(true)
    expect(result.credits).toHaveLength(1)
  })

  test("an optional reset-credit failure preserves and publishes Codex quotas", async () => {
    const original = globalThis.fetch
    const credits = Promise.withResolvers<Response>()
    const partial = Promise.withResolvers<UsageResult>()
    globalThis.fetch = Object.assign(async (input: Parameters<typeof fetch>[0]) => {
      if (String(input).endsWith("/rate-limit-reset-credits")) return credits.promise
      return Response.json({ rate_limit: { allowed: true, primary_window: { used_percent: 23 } } })
    }, original)
    try {
      const grant: Grant = { file: "test.json", provider: "codex", email: "test@example.com", plan: null, claimPlan: null, disabled: false, expiresAt: null, lastRefresh: null, accessToken: "test-fixture" }
      const pending = fetchCodexUsage(grant, partial.resolve)
      const first = await partial.promise
      expect(first.ok && first.windows[0].usedPercent).toBe(23)
      credits.reject(new Error("fixture failure"))
      const final = await pending
      expect(final.ok && final.windows[0].usedPercent).toBe(23)
      expect(final.ok && final.creditsError).toContain("unavailable")
    } finally { globalThis.fetch = original }
  })
})

test("collection publishes fast accounts while another account and service statuses remain pending", async () => {
  const slow = Promise.withResolvers<UsageResult>()
  const services = Promise.withResolvers<ProviderStatus[]>()
  const fastSeen = Promise.withResolvers<void>()
  const updates: AppSnapshot[] = []
  const grants = fixtureSnapshot(now).rows.filter(row => !row.hideReason).slice(0, 2).map(row => ({ ...row.grant, expiresAt: null }))
  const result: UsageResult = { ok: true, windows: [{ label: "5h", usedPercent: 12, resetAt: null }], blocked: false, credits: null, extra: null, breakdown: [], plan: null }
  const fetchUsage = async (grant: Grant) => grant.file === grants[0].file ? result : slow.promise
  let completed = false
  const pending = collect({ fetchHidden: false, onUpdate: snapshot => {
    updates.push(snapshot)
    if (snapshot.rows[0].status.kind === "limits") fastSeen.resolve()
  } }, {
    loadGrants: () => grants,
    loadGatewayState: () => ({}),
    fetchUsage: { claude: fetchUsage, codex: fetchUsage, xai: fetchUsage },
    fetchProviderStatuses: () => services.promise,
  }).then(snapshot => { completed = true; return snapshot })
  expect(updates[0].rows.every(row => row.status.kind === "loading")).toBe(true)
  await fastSeen.promise
  expect(completed).toBe(false)
  expect(updates.at(-1)?.rows[1].status.kind).toBe("loading")
  slow.resolve({ ok: false, error: "fixture timeout" })
  services.resolve([])
  const final = await pending
  expect(final.rows[0].status.kind).toBe("limits")
  expect(final.rows[1].status.kind).toBe("error")
  expect(final.rows.some(row => row.loading)).toBe(false)
})
