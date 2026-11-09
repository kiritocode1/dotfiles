// Prints char frames of the TUI rendered from fixture data, for checking
// layout without a live terminal:  bun run preview [width] [--all] [--select N]
import { createTestRenderer } from "@opentui/core/testing"
import { createRoot } from "@opentui/react"
import { App, type UiState } from "./app"
import { fixtureSnapshot } from "./fixture"

/** Render one frame of App at `width` columns and return its text. */
export async function renderFrame(ui: Omit<UiState, "width">, width: number, height = 34): Promise<string> {
  const setup = await createTestRenderer({ width, height })
  createRoot(setup.renderer).render(<App ui={{ ...ui, width }} />)
  await setup.renderOnce()
  const frame = setup.captureCharFrame()
  setup.renderer.destroy()
  return frame.replace(/[^\S\r\n]+$/gm, "").replace(/\n+$/, "")
}

export function fixtureUi(now: Date, showHidden: boolean, selected: number | null): Omit<UiState, "width"> {
  return {
    snapshot: fixtureSnapshot(now),
    showHidden,
    selected,
    refreshing: false,
    now,
    nextRefresh: new Date(now.getTime() + 52_000),
    bootAt: now,
    motion: false,
  }
}

if (import.meta.main) {
  const args = Bun.argv.slice(2)
  const width = Number(args.find((a) => /^\d+$/.test(a)) ?? 100)
  const selectAt = args.indexOf("--select")
  const selected = selectAt >= 0 ? Number(args[selectAt + 1]) : null
  console.log(await renderFrame(fixtureUi(new Date(), args.includes("--all"), selected), width))
  process.exit(0)
}
