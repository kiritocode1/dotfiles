# UI verification: Argent or Agent Browser

Two different tools. Pick by surface, not by habit. Argent drives devices, native and RN apps, and
Chromium runtimes already on CDP. Agent Browser is the web-page CLI.

## Decision, first match wins

1. **Argent** (MCP `mcp__argent__*`). The thing under test is an iOS simulator, Android emulator,
   physical Android device, React Native app (Metro, Hermes, component tree, profilers), native iOS
   or Android app, Electron app, Apple TV or Android TV or Vega (Fire TV), or a Chromium browser
   already exposing CDP (`chromium-cdp-*` in `list-devices`). Also Argent when the request says
   simulator, emulator, device, tap, swipe, Metro, permissions, or "on the phone".
2. **Agent Browser** (CLI `agent-browser`). The thing under test is a public URL, a local web app with
   no device in play, live-page evidence after fetch and search both failed, or a disposable Chrome
   session (auth vault, HAR, `eval`, cloud browsers).
3. Both could work, for example a local Next or Vite app on desktop. Use Agent Browser for a fast
   web-only check against the named `https://<name>.localhost` URL. Switch to Argent the moment a
   simulator, emulator, RN runtime, real device, or Electron and CDP Chrome enters the picture.

Do not use `agent-browser -p ios` or Appium Safari as a substitute for Argent. That path drives Safari
web pages on a simulator. It cannot launch native apps, describe UIKit, grant permissions, or talk to
Metro.

Do not use Argent to open a random public URL unless a CDP Chrome session is already the intended
surface.

## Argent workflow, devices and CDP apps

Follow the Argent skills, starting with `argent-device-interact`. Argent is available when
`mcp__argent__*` tools are present or `command -v argent` succeeds. When Argent is absent, say so once
and ask whether to continue without it.

1. `list-devices`. Prefer devices already running. Do not boot a second simulator when one matching
   the platform is already up.
2. Boot only when nothing matching is ready, with `boot-device`.
3. `launch-app` or `open-url`. Never tap home-screen icons.
4. Discover before every tap: `describe` on iOS, Android, and Chromium, or `debugger-component-tree`
   on React Native. Never derive tap coordinates from a screenshot.
5. Interact through gesture, keyboard, or `run-sequence`, using coordinates or refs from that
   discovery.
6. Screenshot for a baseline, for visual proof, or after a delay. Not as the navigation method.
7. Report the device, the app bundle id or URL, the flow exercised, and any failures.

Do not call `xcrun simctl`, raw `adb`, or simulator-server directly for anything Argent covers.

## Agent Browser workflow, web pages

1. `agent-browser open <url>`
2. `agent-browser wait --load networkidle`, or wait on a specific element or URL.
3. `agent-browser snapshot -i`
4. Interact through snapshot refs (`@e1`, `@e2`) or semantic locators (`find text`, `find label`,
   `find role button --name`).
5. Re-snapshot after any navigation, modal, submit, or dynamic DOM change. Refs go stale.
6. Screenshot when layout, responsive behavior, or rendering correctness matters.
7. `agent-browser close`, or `close --all`, when the task finishes.

Use fixed waits only as a last resort.

## After starting a local dev server

Confirm the app loads on the surface that matches the product.

Web-only desktop goes to Agent Browser against the named portless URL. Mobile, RN, simulator,
emulator, Electron, or CDP Chrome goes to Argent.

Report the exact URL or the device plus app, the flow, and any failures.
