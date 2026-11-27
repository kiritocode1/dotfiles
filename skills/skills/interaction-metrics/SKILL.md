---
name: interaction-metrics
description: Benchmark real interactions (tap to content, settle time, React commits and renders, dropped frames, key latency, heap) in any React Native, web or Electron app through Argent, and A/B two git refs with noise floors. T3 Code's mobile:metrics method, made portable. Use when asked whether a change made the app slower or faster, to measure a screen open, scroll or typing, to compare branches or commits for performance, to set up a performance regression check, or before and after a targeted optimization.
---

# Interaction metrics

Time what a person does in the app, from the app's own clock, and compare two commits without
fooling yourself. A one-off trace is noise; this measures each case over several app launches and
reports a change only when its 95% interval clears a floor.

Method source: T3 Code's `scripts/metrics/mobile` and `apps/mobile/src/features/development/behavior-probe.ts`
(github.com/pingdotgg/t3code). The statistics are ported unchanged.

## How it works

The probe inside the app wraps React's DevTools commit hook and records every commit, input,
frame and `<PerfMark>` mount with `performance.now()`. The runner opens a window, makes the real
input through Argent (`describe` then `gesture-tap`, `keyboard`, `gesture-swipe` or `gesture-scroll`),
polls `__perfProbe.peek()` until the app is quiet, then reads the window with `stop()`. Runner and
CDP latency never reach a metric. One `debugger-evaluate` poll costs about 0.13 s.

Per step: `contentMs` (input end to the frame after the commit that mounted the case's `until`
mark), `settledMs` (to the last commit before 1 s of quiet), `commits`, `commitMs` (dev only),
`jsDroppedPct`, `jsMaxFrameMs`, `uiDroppedPct` and `uiMaxFrameMs` (React Native with
react-native-worklets), `keyP50Ms` and `keyP90Ms` (typing), `renders` (`--renders`), and heap per launch.
A mark's first mount since JS start is `.first`; later ones are `.revisit`.

## Procedure

1. **Check the surface.** Argent must be available (`command -v argent`). Pick the target with
   `argent run list-devices`: a booted simulator or emulator with the dev client installed, or a
   Chromium/Electron app with `--remote-debugging-port`. For a web app, launch Chrome with
   `--remote-debugging-port=9222 --user-data-dir=<scratch dir>` so it never touches the user's profile.
2. **Add the probe.** Copy `probe/` into the app (e.g. `src/perf/`) and wire it as
   [references/integration.md](references/integration.md) says for the stack. The web needs the probe
   imported before react-dom; React Native needs `<PerfRoot>` at the root. Add `.perf/` to `.gitignore`.
3. **Mark content.** Put `<PerfMark id="screen:<name>">` around the real content of each screen a
   case opens, not its skeleton. Without a mark you still get `settledMs`, commits and frames.
4. **Write cases** in `interaction-metrics.json` at the app root. Format in
   [references/cases.md](references/cases.md). Each case needs a teardown that returns to where the next
   case starts. Run `node <skill>/runner/metrics.ts check` until it finds the device and probe.
5. **Measure.** `run --launches 1 --rounds 1` first to see that every case passes, then:
   - `run`: the app as it is running now.
   - `ab <refA> <refB> --launches 4`: each ref served from its own worktree in A B B A order.
     `.` is the working tree, so `ab HEAD .` measures uncommitted work.
   - `ab HEAD HEAD` then `noise <abDir>`: A/A floors in `floors.json`. Pass `--floors` to later
     `compare` and `ab` runs on the same machine and device.
   - `compare A.json B.json --gate`: exit 3 when anything got worse, for scripts and CI.
6. **Report** the `compare.md` table, the cases that were skipped, and what the numbers cannot
   claim (below). Keep `.perf/<run>/` as the evidence.

`<skill>` is this skill's directory, e.g. `~/.claude/skills/interaction-metrics`. Every command has
`--help`, `--json` and recovery-oriented errors; `ab --dry-run` prints the plan without side effects.

## What the numbers mean

- A dev build's counts and A/B differences are meaningful; its absolute times are not. React's
  StrictMode renders twice in dev, so a 60 ms render cost shows as about 120 ms.
- Each launch's median per metric is one sample. One launch a side is never gated. Use an even
  `--launches` (4 is a good default) so A B B A balances.
- `network: live` raises the noise floor. Prefer seeded or fixture data; record which in the config.
- `ab` refuses when native paths differ between refs on React Native: one dev client cannot serve both.

## Anti-patterns

- Comparing two `run`s from different times or machines. Use `ab`, which alternates on one device.
- Timing from the runner's side (`date` before and after a tap). Runner latency swamps the effect.
- A case whose teardown does not restore its start state. Later cases then measure the wrong screen.
- Loosening `--threshold` or floors until a regression disappears. Calibrate floors with `noise`.
- Shipping the probe in production. Gate the import on `__DEV__` or `import.meta.env.DEV`.

## Closing check

Before reporting: every case ran in every launch (no `Skipped` section, or each skip explained),
`until` marks produced `contentMs`, the A/A run flagged nothing, and the report states the build
type, device, launches per side and network mode.
