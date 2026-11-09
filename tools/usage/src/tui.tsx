// Interactive mode: owns the renderer, refresh schedule, clock tick and keys.
// main.ts imports this lazily so --json/--check/--plain never load OpenTUI.
import { createCliRenderer, type KeyEvent } from "@opentui/core"
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { App, Loading, visibleRows } from "./app"
import { collect, type AppSnapshot } from "./state"

const REFRESH_MS = 60_000
/** motion repaints at 10fps; still mode only needs the 1s countdowns */
const MOTION_TICK_MS = 100
const STILL_TICK_MS = 1_000

export function Main({ needle, initialShowAll, collectSnapshot = collect, onQuit }: {
  needle?: string; initialShowAll: boolean; collectSnapshot?: typeof collect; onQuit?: () => void
}) {
  const renderer = useRenderer()
  const { width } = useTerminalDimensions()
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [showHidden, setShowHidden] = useState(initialShowAll)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [nextRefresh, setNextRefresh] = useState(() => new Date(Date.now() + REFRESH_MS))
  const [motion, setMotion] = useState(process.env.USAGE_MOTION === "on")
  const [bootAt] = useState(() => new Date())
  const inflight = useRef(false)
  const lastSnapshot = useRef<AppSnapshot | undefined>(undefined)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const refresh = useCallback(async () => {
    if (inflight.current) return
    inflight.current = true
    setRefreshing(true)
    setError(null)
    const update = (next: AppSnapshot) => {
      if (!mounted.current) return
      lastSnapshot.current = next
      setSnapshot(next)
    }
    try {
      update(await collectSnapshot({ needle, fetchHidden: true, previous: lastSnapshot.current, onUpdate: update }))
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : String(err))
    } finally {
      inflight.current = false
      if (mounted.current) {
        setRefreshing(false)
        setNextRefresh(new Date(Date.now() + REFRESH_MS))
      }
    }
  }, [needle, collectSnapshot])

  useEffect(() => { void refresh() }, [refresh])

  // Each refresh sets nextRefresh, which re-arms this timer. Pressing r
  // therefore restarts the 60s countdown instead of stacking a second loop.
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), Math.max(0, nextRefresh.getTime() - Date.now()))
    return () => clearTimeout(timer)
  }, [nextRefresh, refresh])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), motion ? MOTION_TICK_MS : STILL_TICK_MS)
    return () => clearInterval(timer)
  }, [motion])

  useKeyboard((key: KeyEvent) => {
    if (key.name === "q" || key.name === "escape" || (key.ctrl && key.name === "c")) {
      renderer.destroy()
      if (onQuit) onQuit()
      else process.exit(0)
      return
    }
    if (key.name === "a") {
      setShowHidden((v) => !v)
      setSelectedFile(null)
    } else if (key.name === "m") {
      setMotion((v) => !v)
    } else if (key.name === "r") {
      void refresh()
    } else if (key.name === "up" || key.name === "down" || key.name === "k" || key.name === "j") {
      const rows = snapshot ? visibleRows(snapshot, showHidden) : []
      const count = rows.length
      if (count === 0) return
      const up = key.name === "up" || key.name === "k"
      setSelectedFile((cur) => {
        const index = rows.findIndex(row => row.grant.file === cur)
        const base = index < 0 ? (up ? count : -1) : index
        return rows[up ? Math.max(0, base - 1) : Math.min(count - 1, base + 1)].grant.file
      })
    }
  })

  if (!snapshot) return <Loading error={error} />
  const index = visibleRows(snapshot, showHidden).findIndex(row => row.grant.file === selectedFile)
  const selected = index < 0 ? null : index
  return <App ui={{ snapshot, showHidden, selected, refreshing, now, nextRefresh, bootAt, motion, width, error }} />
}

/** Starts the TUI. Resolves once the first frame is queued; the renderer keeps the process alive. */
export async function runTui(opts: { needle?: string; showAll: boolean }): Promise<void> {
  const renderer = await createCliRenderer({ exitOnCtrlC: false, useMouse: false })
  createRoot(renderer).render(<Main needle={opts.needle} initialShowAll={opts.showAll} />)
}
