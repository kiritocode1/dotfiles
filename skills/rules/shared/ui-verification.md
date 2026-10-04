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

Read `/Users/blank/dotfiles/skills/reference/argent.md` and the matching interaction skill before device work. That procedure owns availability, discovery before every tap, running-device preference and cleanup. This rule owns surface selection, including when a source's research instructions name a different browser.

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

## Finish against evidence before delivery

Inspect actual output against the accepted brief and relevant inspected benchmarks. Compare layout at matched viewports, exercise ordinary audience behavior, and watch actual transitions rather than inferring motion from stills. Check interruption and reduced motion where relevant. Inspect final copy in context; listen to narration when supported. A successful render or audio metadata cannot establish performance quality.

Fix finish defects within the authorized scope: places where the output fails the accepted brief, source or applicable check. Inspect again after changes. Missed opportunities are proposals unless the brief leaves that choice open; prototype them only in isolation, not in approved or reproduced work. Mention only material, relevant proposals rather than producing a mandatory suggestion list. Keep the source, comparison, experiment and observed result in task artifacts. Continue while iterations make meaningful progress within the user's budget; escalate persistent gaps or unavailable capabilities rather than silently lowering the target. Self-approval without external evidence is not a quality check.

Use focused app-specific checks for affected states, such as overflow, clipped content, keyboard behavior and console errors. Exact-source work also requires the comparisons in `fidelity-first`. Failed applicable checks or missing required evidence must be reported as failures or unverified properties, not softened into claims such as "looks identical" or "near pixel-perfect". Automated checks establish specific properties, not taste. Distinguish verified execution, creative judgment and user acceptance.

## One closeout

Present the result, compact evidence links, material deviations and any blocker. Include the inspected source and decision it changed when relevant, not a separate compliance report. Keep research logs and discarded attempts available in artifacts without making the user sort them. If inspection or playback is unavailable, say what remains unverified. A build, skill read or authored walkthrough does not establish that the experience works.
