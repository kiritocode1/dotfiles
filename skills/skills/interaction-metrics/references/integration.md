# Wiring the probe

Copy the skill's `probe/` folder into the app, for example to `src/perf/`. Files:

| File | Needed on | Does |
| --- | --- | --- |
| `interaction-probe.ts` | all | the probe; `installInteractionProbe()` puts `__perfProbe` on `globalThis` |
| `ui-frames.ts` | all | web and Electron stub for UI-thread frames |
| `ui-frames.native.ts` | React Native | UI-thread frames through react-native-worklets, when installed |
| `PerfMark.tsx` | all | `<PerfMark id>` and `usePerfMark(id)` |
| `PerfRoot.tsx` | React Native | records touches; skip it on the web, where the probe listens to pointer events |

Add a `probe-init.ts` beside them that installs the probe only in development:

```ts
import { installInteractionProbe } from "./interaction-probe";

if (import.meta.env.DEV) installInteractionProbe(); // Vite
// React Native / Expo: if (__DEV__) installInteractionProbe();
// Next.js:            if (process.env.NODE_ENV === "development") installInteractionProbe();
```

Production bundlers drop the call and the module behind a constant-false check.

## Vite, or any React web app

The probe must load before `react-dom`, because React reads the DevTools hook once when its
renderer loads. Without the React DevTools extension the probe installs a minimal hook itself.
Make it the first import of the entry file:

```ts
// src/main.tsx
import "./perf/probe-init";

import { createRoot } from "react-dom/client";
```

## Next.js (App Router)

Not yet proven with this skill. Try `instrumentation-client.ts` first, since it runs before the
app's own client code, then confirm with a one-case `run`: if every step reports 0 commits while
inputs arrive, React loaded before the probe and the runner says so. Measure against `next dev`
and say so in the report; the dev overlay adds commits of its own.

## Expo and React Native

Dev builds always have the DevTools hook, so import order matters less. Import `probe-init` at
the top of the root layout (`src/app/_layout.tsx` for expo-router, `App.tsx` otherwise) and wrap
the root once:

```tsx
import "../perf/probe-init";

import { PerfRoot } from "../perf/PerfRoot";

export default function RootLayout() {
  return <PerfRoot>{/* existing providers and <Stack /> */}</PerfRoot>;
}
```

`ui-frames.native.ts` needs the worklets Babel plugin, which Reanimated 4 projects already have.
With Reanimated 3 and no `react-native-worklets` package, UI frames are left out and the rest works.

Typing on React Native: the probe cannot see the native keyboard. Call `perfKey()` from the
input's `onChangeText` to get `keyP50Ms` and `keyP90Ms`.

The runner relaunches the app with Argent's `restart-app` at the start of every launch and
reconnects the debugger. The dev client must already be installed, and Metro must serve the
checkout being measured. For `ab`, the `server` block starts Metro in each worktree:

```json
"server": { "command": "npx expo start --dev-client", "cwd": "apps/mobile", "ready": "http://localhost:8081/status", "readyText": "packager-status:running" }
```

## Electron

Electron is a Chromium target to Argent. Start it with `--remote-debugging-port=<port>`, or with
Argent's `boot-device --electronAppPath <dir> --electronPort <port>`, and set `app.device` to
`chromium-cdp-<port>`. Wire the renderer like a web app.

## Local HTTPS

portless and similar proxies serve `https://<name>.localhost` with a local CA. The runner's ready
check skips certificate verification for `*.localhost` and loopback hosts only. An Electron shell
loading such a URL needs its own `certificate-error` handler limited to `.localhost`.
