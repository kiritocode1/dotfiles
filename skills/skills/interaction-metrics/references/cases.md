# interaction-metrics.json

Lives at the app root, next to `package.json`. The runner writes results to `.perf/` beside it.

```json
{
  "app": {
    "platform": "chromium",
    "device": "chromium-cdp-9222",
    "url": "https://shop.localhost/",
    "ready": "screen:home"
  },
  "server": { "command": "portless shop vite", "ready": "https://shop.localhost/" },
  "setup": "pnpm install --frozen-lockfile --prefer-offline",
  "rounds": 3,
  "launches": 4,
  "network": "fixture",
  "cases": [
    {
      "name": "open-orders",
      "measure": { "tap": { "label": "Orders", "role": "button" } },
      "until": "screen:orders",
      "teardown": [{ "tap": { "label": "Back" } }, { "waitFor": { "label": "Home" } }]
    },
    {
      "name": "type-search",
      "setup": [{ "tap": { "label": "Search products", "role": "input" } }],
      "measure": { "type": "blue" },
      "teardown": [{ "key": "backspace" }, { "key": "backspace" }, { "key": "backspace" }, { "key": "backspace" }]
    },
    {
      "name": "scroll-feed",
      "measure": [{ "scroll": { "dy": 3 } }, { "scroll": { "dy": -3 } }]
    }
  ]
}
```

## `app`

| Field | Meaning |
| --- | --- |
| `platform` | `chromium` (web and Electron), `ios` or `android` |
| `device` | id from `argent run list-devices`; default is the first running device of the platform |
| `url` | chromium: opened at the start of every launch, which gives a fresh JS runtime |
| `bundleId` | ios and android: restarted at the start of every launch |
| `ready` | a `<PerfMark>` id the first screen mounts; the launch waits for it |

## `server`, `setup`, `nativePaths`

Only `ab` uses these. `server.command` runs in `<checkout>/<cwd>` and must answer `ready` (2xx,
containing `readyText` when given). The runner starts it once per side switch and stops only the
process group it started. `ab` refuses to start when something already answers `ready`.

`setup` runs once in each new worktree. `nativePaths` (React Native) defaults to `ios`, `android`,
`app.json`, `app.config.*`, `modules`, `plugins` and `patches`.

## Cases

| Field | Meaning |
| --- | --- |
| `name` | metric prefix, e.g. `open-orders.first.contentMs` |
| `setup` | unmeasured actions before the window opens |
| `measure` | one action or a list; the window opens before the first |
| `until` | `<PerfMark>` id; its first frame ends `contentMs` |
| `teardown` | unmeasured actions that return to where the next case starts |

A step ends after 1 s without input, commits or new marks; after `until` shows, at most 1.2 s
later even if the screen keeps committing; 2.5 s of quiet when an `until` mark stays mounted on a
revisit; and 15 s at the latest.

## Actions

| Action | Example | Notes |
| --- | --- | --- |
| tap | `{ "tap": { "label": "Orders" } }` | selector fields: `label` (exact, then prefix), `text` (substring), `id` (testID, accessibilityIdentifier, resource-id, DOM id), `role` (substring). Among matches: exact over prefix, clickable over not, innermost last |
| tap at | `{ "tap": { "x": 0.5, "y": 0.9 } }` | normalized coordinates; use only when no label exists |
| type | `{ "type": "hello", "delayMs": 50 }` | keyboard text |
| key | `{ "key": "enter" }` | enter, backspace, tab, escape, arrows |
| swipe | `{ "swipe": { "from": [0.5, 0.7], "to": [0.5, 0.3] } }` | touch devices |
| scroll | `{ "scroll": { "dy": 3 } }` | chromium wheel, in window heights |
| back | `{ "back": true }` | history.back on chromium, back button on Android, edge swipe on iOS |
| open | `{ "open": "myapp://orders/42" }` | deep link, or a URL on chromium |
| waitFor | `{ "waitFor": { "label": "Home" } }` | Argent's await-ui-element, visible |
| eval | `{ "eval": "localStorage.clear(), true" }` | JS in the app runtime |
| pause | `{ "pause": 300 }` | last resort; prefer waitFor |

Find labels with `argent run describe --udid <device>`.
