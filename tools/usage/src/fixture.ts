// Fixed account state for tests and `bun run preview`. Mirrors the real pool's
// shape: one claude grant with live windows (weekly maxed, one reset left), one
// whose usage fetch failed so it falls back to a gateway cooldown, a removed
// claude grant, codex grants on plus/prolite including free-tier ones, one xai
// grant out of weekly credits.
import { buildRows, type AppSnapshot, type GatewayEvent, type Grant, type UsageResult } from "./state"

const H = 3_600_000

export function fixtureSnapshot(now: Date): AppSnapshot {
  const at = (hours: number) => new Date(now.getTime() + hours * H)
  const grant = (g: Partial<Grant> & Pick<Grant, "file" | "provider" | "email">): Grant => ({
    plan: null,
    claimPlan: null,
    disabled: false,
    expiresAt: at(6),
    lastRefresh: at(-1),
    ...g,
  })
  const grants: Grant[] = [
    grant({ file: "claude-e12563fa-blankinterfaces@gmail.com.json", provider: "claude", email: "blankinterfaces@gmail.com", orgName: "blankinterfaces@gmail.com's Organization" }),
    grant({ file: "claude-e71f1cf8-kathawalearyan9@gmail.com.json", provider: "claude", email: "kathawalearyan9@gmail.com", orgName: "kathawalearyan9@gmail.com's Organization" }),
    grant({ file: "claude-7ad4e6a0-blanket152708@gmail.com.json", provider: "claude", email: "blanket152708@gmail.com", disabled: true }),
    grant({ file: "codex-8e1e71c2-blanket152708@gmail.com-plus.json", provider: "codex", email: "blanket152708@gmail.com", plan: "plus", claimPlan: "plus" }),
    grant({ file: "codex-ca106771-blankinterfaces@gmail.com-prolite.json", provider: "codex", email: "blankinterfaces@gmail.com", plan: "prolite", claimPlan: "free" }),
    grant({ file: "codex-dc7b03d2-kathawalearyan9@gmail.com-plus.json", provider: "codex", email: "kathawalearyan9@gmail.com", plan: "plus", claimPlan: "plus" }),
    grant({ file: "xai-kathawalearyan9@gmail.com.json", provider: "xai", email: "kathawalearyan9@gmail.com", authKind: "oauth", expiresAt: at(4.7) }),
  ]
  const gateway: Record<string, GatewayEvent> = {
    // stale cooldown: the live windows win over it
    "claude-e12563fa-blankinterfaces@gmail.com.json": { kind: "cooldown", armedAt: at(-20), resetAt: at(-2) },
    // usage fetch failed for this grant, so this cooldown is what renders
    "claude-e71f1cf8-kathawalearyan9@gmail.com.json": { kind: "cooldown", armedAt: at(-1.6), resetAt: at(6.75) },
  }
  const none = { extra: null, breakdown: [], plan: null }
  const usages = new Map<string, UsageResult>([
    [
      "claude-e12563fa-blankinterfaces@gmail.com.json",
      {
        ok: true,
        windows: [
          { usedPercent: 0, resetAt: null, label: "5h" },
          { usedPercent: 100, resetAt: at(13.8), label: "7d" },
        ],
        blocked: true,
        credits: [{ title: "weekly reset", expiresAt: at(160), left: 1 }],
        extra: { enabled: false, usedMinor: 0, limitMinor: null, currency: "USD", exponent: 2, disabledReason: null },
        breakdown: [{ name: "Claude Code", percent: 100 }],
        plan: "pro",
      },
    ],
    ["claude-e71f1cf8-kathawalearyan9@gmail.com.json", { ok: false, error: "usage fetch failed (429)" }],
    [
      "codex-8e1e71c2-blanket152708@gmail.com-plus.json",
      {
        ok: true,
        windows: [
          { usedPercent: 100, resetAt: at(3.4), label: "5h" },
          { usedPercent: 32, resetAt: at(146), label: "7d" },
        ],
        blocked: true,
        credits: [{ title: "Full reset (Weekly + 5 hr)", expiresAt: at(682), left: 1 }],
        ...none,
      },
    ],
    [
      "codex-ca106771-blankinterfaces@gmail.com-prolite.json",
      {
        ok: true,
        windows: [{ usedPercent: 0, resetAt: at(719.8), label: "30d" }],
        blocked: false,
        credits: [{ title: "Full reset (Monthly)", expiresAt: at(110), left: 1 }],
        ...none,
      },
    ],
    [
      "codex-dc7b03d2-kathawalearyan9@gmail.com-plus.json",
      {
        ok: true,
        windows: [
          { usedPercent: 74, resetAt: at(2.1), label: "5h" },
          { usedPercent: 41, resetAt: at(98), label: "7d" },
          { usedPercent: 100, resetAt: at(2), label: "7d", scope: "Code review" },
        ],
        blocked: false,
        credits: null,
        ...none,
        models: [{ name: "gpt-6-astra", available: true, availableAt: null, creditsWouldEnable: false }],
        paidCredits: { balance: "0", unlimited: false, overageLimitReached: false },
        spendLimitReached: false,
      },
    ],
    [
      "xai-kathawalearyan9@gmail.com.json",
      {
        ok: true,
        windows: [{ usedPercent: 100, resetAt: at(129), label: "7d" }],
        blocked: true,
        credits: null,
        extra: { enabled: false, usedMinor: 0, limitMinor: null, currency: "USD", exponent: 2, disabledReason: null },
        breakdown: [{ name: "GrokBuild", percent: 100 }],
        plan: null,
      },
    ],
  ])
  return {
    now,
    rows: buildRows(now, grants, gateway, usages),
    statuses: [
      { label: "claude", state: "ok", desc: "All Systems Operational", descShort: "operational", src: "status.claude.ai" },
      { label: "openai", state: "bad", desc: "Partially Degraded Service", descShort: "degraded", src: "status.openai.com" },
      { label: "grok", state: "unknown", desc: "HTTP 403", descShort: "unreachable", src: "status.x.ai" },
    ],
  }
}
