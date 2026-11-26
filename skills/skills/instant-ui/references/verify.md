# Verify

Run against the real app, real Postgres and real Electric. Two Agent Browser sessions act as two
people. Record the run; stills cannot show a flicker or a flash.

Before starting:

- The app is up at its named URL (portless), served over HTTP/2.
- Electric answers `curl -i "$ELECTRIC_URL/v1/shape?table=issues&offset=-1"` with 200.
- At least 20 seeded rows, so lists and search have something to work on.

```sh
A="agent-browser --session a"
B="agent-browser --session b"
$A open "$APP_URL/issues" && $B open "$APP_URL/issues"
$A record start ./verify-instant-ui.webm
```

Re-snapshot (`snapshot -i`) after every action before using refs. Refs go stale.

## Scenarios

| # | Do | Pass when |
| --- | --- | --- |
| 1 | In A, navigate away and back to the list | No spinner or skeleton on return. The snapshot right after navigation already has rows |
| 2 | Load a filter with zero matches | The empty state appears once. It never flashes before rows on a filter that has matches |
| 3 | In A, change an issue's status | The new status is in the snapshot taken immediately after the click |
| 4 | `$A network route "**/api/shape/**" --abort`, then edit a row in A | The pending dot appears after about 1s, not before. `$A network unroute` and the dot clears |
| 5 | `$A network route "**/api/issues/update" --abort`, then edit a row in A | The row returns to its old value and a toast names the action with Retry. `$A network unroute`, press Retry, the edit lands |
| 6 | Edit a title in A with the network normal | The old title never shows again between edit and confirm (watch the recording frame by frame around the save) |
| 7 | Edit a row in B | The change appears in A in place, and that row highlights once. Edits made in A do not highlight in A |
| 8 | Type in the search box in A | `$A network requests --filter /api/` shows no new request per keystroke. Results update on each key |
| 9 | Type a title in A for 3s, then stop | `$A network requests --filter /api/issues/update --method POST` shows one request after the pause, not one per key |
| 10 | Select several rows in A, bulk change status | One POST. All rows change together. With the route aborted, all revert together with one toast |
| 11 | Change a status in A, press Cmd+Z | The status reverts, the row is selected again, B sees the revert. Shift+Cmd+Z reapplies |
| 12 | `$A network route "**/api/shape/**" --abort` and wait up to 15s | A thin banner appears, rows stay visible. Unroute, banner clears |
| 13 | Delete an issue in A with the delete route aborted | The row stays and the dialog shows the error. It never disappears and comes back |
| 14 | Do 3, 7 and 11 using only the keyboard | Every action has a shortcut and a Cmd+K entry, and the menu closes on the same frame |

Then:

```sh
$A set media reduced-motion   # repeat 7: the row updates with no flash animation
$A set media dark             # repeat 4, 5, 7, 12: dot, toast, highlight and banner read in both themes
$A record stop
$A close && $B close
```

## Reporting

One line per scenario: pass, fail with what was seen, or not run with why. Link the recording.
If Electric was not running, every scenario is "not run" and the patterns are unverified. Do not
report "works" from a build, a type check or a screenshot of a static list.
