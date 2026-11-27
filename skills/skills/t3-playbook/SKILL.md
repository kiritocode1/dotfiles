---
name: t3-playbook
description: The rules that make T3 Code's iOS and Android app feel native and fast, taken from its source, for any app we build. Native modules where people touch constantly, route presets, layout layers that keep screens free of platform and width checks, select versus drill-in navigation, cache-first data, one reconnect owner, React Compiler coverage, native-driver loops, measured performance, and the iOS extras. Use when starting an Expo or React Native app, planning its navigation, layout or data layer, reviewing why an app feels non-native or slow, auditing an existing app, or when asked to build an app "like T3 Code" or "like Grok". Rules 5 to 9 also apply to web and Electron clients.
---

# T3 playbook

T3 Code's mobile app is Expo and React Native 0.88, yet it feels like a UIKit app. The reason is
not one trick: each layer makes one decision, the parts people touch all the time are native, and
performance is measured in CI. Source: `pingdotgg/t3code` at `d1b4b60`; every reference links the
file a rule came from. Grok's app is closed source; only rule 10's "one tap from launch" comes from
it, through public coverage.

## The rules

| # | Rule | Surfaces | Reference |
| --- | --- | --- | --- |
| 1 | Write native code where people touch all the time: the text input, the socket, rendering streamed text, long lists, media. Present media with AVKit, Quick Look and a native image viewer | mobile | [native-and-perf](references/native-and-perf.md) |
| 2 | Each route declares what it is (`pageRoute`, `sheetRoute`, `modalRoute`, `immersiveRoute`). The preset owns presentation; screens never set header or sheet options | mobile | [navigation-layout](references/navigation-layout.md) |
| 3 | Five layers, one decision each: router, shell, screens, design system, native. A screen never checks the platform or the window width | mobile | [navigation-layout](references/navigation-layout.md) |
| 4 | Select replaces the detail page; drill-in pushes. Never `navigate`, which does one or the other depending on what is on top | mobile, web | [navigation-layout](references/navigation-layout.md) |
| 5 | Cache first. A screen opens from a local read, then the network fills in. Cached data stays readable offline and never claims to be live | all | [data-connection](references/data-connection.md) |
| 6 | One supervisor owns every reconnect. Foregrounding probes the socket instead of reopening it. Tokens renew on the live socket. Socket health and data freshness are separate states | all | [data-connection](references/data-connection.md) |
| 7 | Every file passes the React Compiler, and a test fails on a new skip. No `useMemo`, `useCallback` or `memo` | all | [native-and-perf](references/native-and-perf.md) |
| 8 | Looping animations use `Animated` with `useNativeDriver: true`, not Reanimated `withRepeat`. Nothing repaints continuously | mobile, web | [native-and-perf](references/native-and-perf.md) |
| 9 | Measure: interaction timing with A/B runs through the `interaction-metrics` skill, and byte budgets on payloads in CI | all | [native-and-perf](references/native-and-perf.md) |
| 10 | Ship the platform extras: haptics, native menus, SF Symbols, widgets, quick actions, Liquid Glass. Put the main action one tap from launch | mobile | [native-and-perf](references/native-and-perf.md) |

## Starting an app

1. Copy [templates/route-options.ts](templates/route-options.ts) into the navigation folder and give every
   route a preset where the stack is declared. Screens get no `options` of their own.
2. Make the layers before the first feature: a width class (compact under 600 pt, medium to 720 pt,
   expanded above), a shell that places columns or sheets from it, and an `AppBar` in the design
   system. Platform splits go in `.ios.tsx` and `.android.tsx` files in those layers only.
3. Turn on the React Compiler (`experiments.reactCompiler: true` in Expo's app config) and copy
   [templates/reactCompilerCoverage.test.ts](templates/reactCompilerCoverage.test.ts) into `src/`.
4. Put a local cache (expo-sqlite on mobile) under every screen that lists or shows server data,
   and one connection owner under the cache.
5. Add the `interaction-metrics` probe before the app has many screens, so every later change can be
   measured with `ab`.

## Auditing an app

1. Run the audit on the app folder, the one with `app.json` or `package.json`:

   ```sh
   node ~/.claude/skills/t3-playbook/audit.ts apps/mobile
   ```

   It is read-only and covers rules 2, 3, 4, 7 and 8 with file and line, plus whether the compiler is
   on. Read each hit before reporting it. A platform check in a screen that should be a design-system
   component is real. An Android-only permission step may be fine.
2. If the compiler is on, copy the coverage test into a scratch worktree and run it. On sb it found
   23 of 155 files skipped, 44 skips from writing Reanimated shared values with `.value =` inside
   components. The fix is `.get()` and `.set()`.
3. Review rules 1, 5, 6, 9 and 10 by hand with the checklist below.
4. Report per rule: what holds, what breaks with file and line, and the fix. Rank by what a user
   feels first: input lag, a blank screen on open, a dropped connection, then the rest.

## Review checklist (rules the audit cannot grep)

- **Rule 1.** Is the text input native or a JS `TextInput` wrapper with heavy logic on each key? Is the
  main list a virtualized list (`@legendapp/list` or FlashList) with fixed or estimated row heights?
  Do images, video and documents open in AVKit, Quick Look or a native viewer?
- **Rule 5.** Open a screen in airplane mode. Does it show the last data, labeled as not live?
- **Rule 6.** Grep for `new WebSocket`, `reconnect`, `AppState` and `NetInfo`. More than one owner of
  reconnecting is the bug. Does returning to the foreground reopen the socket without checking it?
- **Rule 9.** Is there an `interaction-metrics.json` or any A/B timing? Any payload size check?
- **Rule 10.** How many taps from launch to the main action? Haptics on the primary actions? Native
  context menus instead of JS popovers?

## Closing check

Each finding names a file and line or a measurement. Rules the app does not need are named as such
rather than skipped silently. Nothing in the audited app was changed unless the user asked for fixes.
