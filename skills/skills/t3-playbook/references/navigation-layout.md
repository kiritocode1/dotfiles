# Navigation and layout (rules 2 to 4)

Source: [11_mobile-layout.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/11_mobile-layout.md),
[12_mobile-navigation.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/12_mobile-navigation.md),
[route-options.ts](https://github.com/pingdotgg/t3code/blob/d1b4b60/apps/mobile/src/features/layout/route-options.ts),
[layout.ts](https://github.com/pingdotgg/t3code/blob/d1b4b60/apps/mobile/src/lib/layout.ts).

## Route presets

A route says what it is. The preset decides detents, corner radius, header look and the Android
fallback, so the same screen is presented correctly on every platform without the screen knowing.

| Preset | Is | Closes by |
| --- | --- | --- |
| `pageRoute()` | a page; pushed on a phone, a column page on a wide window | Back |
| `sheetRoute({ detent })` | a form sheet with a grabber over the current screen | swipe down, never Back |
| `modalRoute()` | a full-screen modal; the screen draws its own bar | a close button |
| `immersiveRoute()` | full-screen media with no bar and no dismiss gesture | the screen's own control |

[templates/route-options.ts](../templates/route-options.ts) is T3's file without its Duo rail and editor item
style. It typechecks against `@react-navigation/native-stack` from Expo Router 55.

Android in T3 never shows the native header. Every screen draws its bar in-tree (`AppBar`, or
`SheetHeader` in a form sheet), so the bar has one contract on both platforms. Android form sheets
cannot host a keyboard-driven composer; those sheets use `android: "card"` or `"fullScreen"`.

## Layers

Each layer makes one decision and no layer makes another's.

1. **Router.** The root stack is the layout state: what is selected, pushed, or open as a sheet.
   Rotating, folding or resizing renders the same stack differently.
2. **Shell.** Placement and widths from the width class:
   - compact, under 600 pt in either direction: the list is the root and pages push
   - medium, 600 to 720 pt: the sidebar floats over the page
   - expanded, above 720 pt: sidebar, content and inspector columns
   - an inspector that does not fit becomes a sheet
3. **Screens.** Place content by role: one `AppBar`, the page, and the panes it wants shown. A route,
   component, header option or inset chosen by width or platform here is the bug this structure prevents.
4. **Design system.** `AppBar`, `Pane`, insets. Chrome branches by platform only here.
5. **Native.** On iOS 26, T3's columns are `UISplitViewController` columns with a navigation bar each.
   Elsewhere the shell draws them in JS.

Platform splits live in layers 1, 2 and 4, as `.ios.tsx` and `.android.tsx` files.

## Select versus drill-in

- **Select** replaces the active detail page, keeping route keys when it updates in place. A sidebar
  row, a tab, a search result shown in the detail column.
- **Drill in** pushes, so Back returns. A row inside the detail page that opens something deeper.

`navigate` does either one depending on what is already on top, so the same tap behaves differently
on a phone and an iPad. T3's lint rejects `navigate` to its detail routes. In Expo Router, drill-in
is `router.push` and select is `router.replace` or a helper that swaps the detail route's params.
Custom tab bars calling `navigation.navigate(route.name)` are fine; that is how tabs switch.

Never work out navigation intent from transition events. UIKit emits them for sidebar appearances too.

## Traps T3 hit

- iPadOS 18 to 25 runs the JS columns, so code that looks Android-only is still live on those iPads.
- Opening a route from a sheet must wait for the sheet to finish closing. Presenting over a closing
  sheet races its dismissal on iOS.
- A pane hidden with opacity still has its native bar and scroll view in the window, and UIKit shows
  them over the visible pane. Detach panes instead of hiding them.
- Horizontal scroll views at their leading edge must yield to the full-screen back gesture.
- T3 keeps a fork of `react-native-screens` to protect header animations, the back gesture and
  Liquid Glass bars. Before forking, check whether the problem is a screen setting header options
  itself (rule 2).
