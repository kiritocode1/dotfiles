// Shared terminal view. Data and refresh scheduling live in tui.tsx.
import { useEffect, useRef, type ReactNode } from "react"
import { useKeyboard } from "@opentui/react"
import type { ScrollBoxRenderable } from "@opentui/core"
import { fmtRel, fmtWhen, limitDetails, liveStatus, planOf, PROVIDER_ORDER, type AppSnapshot, type Row, type RowStatus, type UsageWindow } from "./state"

const COLOR = {
  text: "#c0caf5", soft: "#a9b1d6", dim: "#8992b5", track: "#3d4663",
  accent: "#bb9af7", bgRow: "#1f2335", ok: "#9ece6a", warn: "#e0af68", bad: "#f7768e",
} as const
const PROVIDER = {
  claude: { name: "Claude", color: "#d97757" },
  codex: { name: "Codex", color: "#10a37f" },
  xai: { name: "Grok", color: "#a78bfa" },
} as const

export type UiState = {
  snapshot: AppSnapshot; showHidden: boolean; selected: number | null
  refreshing: boolean; now: Date; nextRefresh: Date; bootAt: Date
  motion: boolean; width: number; error?: string | null
}

export function visibleRows(snapshot: AppSnapshot, showHidden: boolean): Row[] {
  return snapshot.rows.filter(row => showHidden || row.hideReason === null)
}

function usageColor(used: number): string {
  return used >= 90 ? COLOR.bad : used >= 70 ? COLOR.warn : COLOR.ok
}

function stateLabel(status: RowStatus, now: Date): string {
  switch (status.kind) {
    case "loading": return "Loading"
    case "removed": return "Removed"
    case "oauth-block": return "OAuth blocked"
    case "expired": return "Token expired"
    case "cooldown": return `Wait ${fmtRel(status.resetAt.getTime() - now.getTime())}`
    case "limits": return status.blocked ? "Limit reached" : "Available"
    case "error": return "Usage unavailable"
    case "ready": return "Gateway ready"
  }
}

function stateColor(status: RowStatus): string {
  if (status.kind === "limits") return status.blocked ? COLOR.bad : COLOR.ok
  if (status.kind === "ready") return COLOR.ok
  if (status.kind === "loading" || status.kind === "removed") return COLOR.dim
  return status.kind === "cooldown" ? COLOR.warn : COLOR.bad
}

/** Every quota uses the same columns. Long labels and reset times wrap below. */
function WindowLine({ window: w, width, now, phase, motion }: { window: UsageWindow; width: number; now: Date; phase: number; motion: boolean }) {
  const label = `${w.scope ? `${w.scope} ` : ""}${w.label}`
  const barWidth = Math.min(24, Math.max(8, width - 62))
  const filled = Math.min(barWidth, Math.max(0, Math.round(w.usedPercent / 100 * barWidth)))
  const color = usageColor(w.usedPercent)
  const parts: ReactNode[] = []
  const head = Math.floor(phase * 3) % Math.max(1, filled)
  if (motion) {
    for (let i = 0; i < filled; i++) parts.push(<span key={i} fg={i === head ? COLOR.text : color}>█</span>)
  } else parts.push(<span key="fill" fg={color}>{"█".repeat(filled)}</span>)
  parts.push(<span key="track" fg={COLOR.track}>{"░".repeat(barWidth - filled)}</span>)
  const reset = !w.resetAt ? "reset time not reported"
    : w.resetAt.getTime() <= now.getTime() ? `reset due · ${fmtWhen(w.resetAt)}; awaiting refresh`
    : `resets in ${fmtRel(w.resetAt.getTime() - now.getTime())} · ${fmtWhen(w.resetAt)}`
  const longLabel = label.length > 10
  const inlineReset = 2 + 12 + barWidth + 22 + 2 + reset.length <= width - 2
  return <box flexDirection="column" flexShrink={0}>
    {longLabel ? <text fg={COLOR.soft}>{`  ${label}`}</text> : null}
    <text wrapMode="word">
      <span fg={COLOR.soft}>{`  ${(longLabel ? "" : label).padEnd(10)}  `}</span>{parts}
      <span fg={color}>{`  ${String(Math.round(w.usedPercent)).padStart(3)}% used`}</span>
      <span fg={COLOR.text}>{`  ${String(Math.max(0, Math.round(100 - w.usedPercent))).padStart(3)}% left`}</span>
      {inlineReset ? <span fg={COLOR.soft}>{`  ${reset}`}</span> : null}
    </text>
    {!inlineReset ? <box paddingLeft={2} flexShrink={0}><text wrapMode="word" fg={COLOR.soft}>{reset}</text></box> : null}
  </box>
}

function OtherStatus({ row, status, now }: { row: Row; status: RowStatus; now: Date }) {
  let text: string | null = null
  switch (status.kind) {
    case "loading": text = "Fetching live limits…"; break
    case "removed": text = row.hideReason ?? "removed from pool"; break
    case "oauth-block": text = `upstream OAuth blocked: ${status.code}`; break
    case "expired": text = `token expired ${fmtWhen(status.at)}`; break
    case "cooldown": text = `Retry in ${fmtRel(status.resetAt.getTime() - now.getTime())} · ${fmtWhen(status.resetAt)}`; break
    case "error": text = status.message; break
    case "ready": text = "Live limits unavailable; showing gateway state."; break
  }
  return text ? <text fg={COLOR.soft}>{`  ${text}`}</text> : null
}

function Account({ row, selected, width, now, motion, phase }: { row: Row; selected: boolean; width: number; now: Date; motion: boolean; phase: number }) {
  const status = liveStatus(row.status, now)
  const plan = planOf(row)
  return <box id={`account-${row.grant.file}`} flexDirection="column" marginBottom={1} flexShrink={0} backgroundColor={selected ? COLOR.bgRow : undefined}>
    <text>
      <span fg={COLOR.text}><b>{row.grant.email}</b></span><span fg={COLOR.soft}>{plan ? `  ${plan}  ` : "  "}</span>
      <span fg={stateColor(status)}>{stateLabel(status, now)}</span>
      {row.loading && status.kind !== "loading" ? <span fg={COLOR.dim}> · refreshing</span> : null}
    </text>
    {status.kind === "limits" ? <>
      {!status.windows.length ? <text fg={COLOR.warn}>  No quota windows reported.</text> : null}
      {status.windows.map((w, i) => <WindowLine key={`${w.scope ?? ""}-${w.label}-${i}`} window={w} width={width} now={now} motion={motion} phase={phase + i} />)}
      {limitDetails(status, row.grant.provider, now).map((line, i) => <box key={i} paddingLeft={2} flexShrink={0}><text wrapMode="word" fg={line.startsWith("limit resets") ? COLOR.accent : COLOR.soft}>{line}</text></box>)}
    </> : <OtherStatus row={row} status={status} now={now} />}
    {row.usageError && status.kind !== "error" ? <text fg={COLOR.warn}>{`  Live usage failed: ${row.usageError}. Showing gateway state.`}</text> : null}
    {selected ? <>
      <text fg={COLOR.dim}>{`  ${row.grant.file}`}</text>
      {row.grant.claimPlan && row.grant.claimPlan !== plan ? <text fg={COLOR.warn}>{`  ID token plan: ${row.grant.claimPlan}`}</text> : null}
      {row.grant.orgName ? <text fg={COLOR.dim}>{`  Organization: ${row.grant.orgName}`}</text> : null}
      {row.grant.expiresAt ? <text fg={COLOR.dim}>{`  Token expires ${fmtWhen(row.grant.expiresAt)}`}</text> : null}
      {row.updatedAt ? <text fg={COLOR.dim}>{`  Checked ${clock(row.updatedAt)}`}</text> : null}
    </> : null}
  </box>
}

function clock(d: Date): string {
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, "0")).join(":")
}

export function Loading({ error }: { error: string | null }) {
  return <box flexDirection="column" paddingLeft={1}>
    <text fg={COLOR.accent}>usage</text>
    <text fg={error ? COLOR.bad : COLOR.dim}>{error ? `Could not read accounts: ${error}. Press r to retry or q to quit.` : "Reading accounts…"}</text>
  </box>
}

export function App({ ui }: { ui: UiState }) {
  const scroll = useRef<ScrollBoxRenderable | null>(null)
  const { snapshot, showHidden, selected, now, motion } = ui
  const visible = visibleRows(snapshot, showHidden)
  const selectedFile = selected !== null ? visible[selected]?.grant.file : undefined
  const phase = Math.max(0, (now.getTime() - ui.bootAt.getTime()) / 1000)
  const hidden = snapshot.rows.filter(row => row.hideReason !== null)
  const reasons = [...new Set(hidden.map(row => row.hideReason!))].map(reason => `${hidden.filter(row => row.hideReason === reason).length} ${reason === "removed from pool" ? "removed" : reason}`)
  const fetching = snapshot.rows.filter(row => row.loading).length
  useEffect(() => {
    if (selectedFile) scroll.current?.scrollChildIntoView(`account-${selectedFile}`)
  }, [selectedFile, snapshot, ui.width])
  useKeyboard(key => {
    const box = scroll.current
    if (!box) return
    if (key.name === "pagedown" || key.name === "space") box.scrollBy(Math.max(1, box.viewport.height - 1))
    if (key.name === "pageup") box.scrollBy(-Math.max(1, box.viewport.height - 1))
    if (key.name === "home") box.scrollTo(0)
    if (key.name === "end") box.scrollTo(Infinity)
  })
  return <box flexDirection="column" width="100%" height="100%" paddingLeft={1} paddingRight={1}>
    <box flexDirection="column" flexShrink={0} marginBottom={1}>
      <text><span fg={COLOR.accent}><b>usage</b></span><span fg={COLOR.dim}>{`  ${ui.refreshing ? fetching ? `Loading ${fetching} account${fetching === 1 ? "" : "s"}…` : "Checking service status…" : `Updated ${clock(snapshot.now)} · next ${clock(ui.nextRefresh)}`}`}</span></text>
      <text>{snapshot.statuses.map((s, i) => <span key={s.label}><span fg={COLOR.soft}>{`${i ? " · " : ""}${s.label} `}</span><span fg={s.state === "bad" ? COLOR.warn : s.state === "ok" ? COLOR.ok : COLOR.dim}>{s.descShort}</span></span>)}</text>
      {ui.error ? <text fg={COLOR.bad}>{`Refresh failed: ${ui.error}. Showing previous results; r retries.`}</text> : null}
    </box>
    <scrollbox ref={scroll} flexGrow={1} minHeight={1} scrollX={false} scrollbarOptions={{ visible: false }}>
      {PROVIDER_ORDER.map(provider => {
        const rows = visible.filter(row => row.grant.provider === provider)
        if (!rows.length) return null
        return <box key={provider} flexDirection="column" flexShrink={0}>
          <text fg={PROVIDER[provider].color}><b>{PROVIDER[provider].name}</b></text>
          {rows.map(row => <Account key={row.grant.file} row={row} selected={selectedFile === row.grant.file} width={ui.width - 2} now={now} motion={motion} phase={phase} />)}
        </box>
      })}
      {!visible.length ? <text fg={COLOR.dim}>No accounts in this view.</text> : null}
    </scrollbox>
    <box flexDirection="column" flexShrink={0} marginTop={1}>
      <text fg={COLOR.dim}>{`${showHidden ? "All accounts" : hidden.length ? `${hidden.length} hidden (${reasons.join(", ")})` : `${visible.length} accounts`} · a ${showHidden ? "hide" : "show all"} · r refresh · q quit`}</text>
      <text fg={COLOR.dim}>{`j/k select · PgUp/PgDn scroll · m ${motion ? "motion off" : "motion on"}`}</text>
    </box>
  </box>
}
