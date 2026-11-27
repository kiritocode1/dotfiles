# Native surfaces and performance (rules 1 and 7 to 10)

Source: [apps/mobile/modules](https://github.com/pingdotgg/t3code/tree/d1b4b60/apps/mobile/modules),
[12_mobile-navigation.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/12_mobile-navigation.md),
[13_mobile-development.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/13_mobile-development.md),
[10_web-ui.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/10_web-ui.md),
[16_performance-regressions.md](https://github.com/pingdotgg/t3code/blob/d1b4b60/docs/internals/16_performance-regressions.md).

## Rule 1: where to write native code

T3 ships 12 local native modules. The pattern is the parts touched on every interaction:

| Surface | T3 module |
| --- | --- |
| Text input | `t3-composer-editor`, a Swift editor |
| Socket | `t3-web-socket`, on URLSession |
| Streamed text | a fork of `react-native-enriched-markdown` with memory limits |
| Code | `t3-highlights`, a C lexer built from wasm with wasm2c |
| Terminal | `t3-terminal`, on libghostty |
| Widgets, notifications | `t3-subscription-widget`, `t3-agent-notifications` |

Each one replaced a measured problem rather than a guess. The socket is the clearest case. React
Native's WebSocket (SocketRocket) never offers permessage-deflate, so a large snapshot reached an
iPhone uncompressed. URLSession offers it on every handshake
([T3WebSocketModule.swift](https://github.com/pingdotgg/t3code/blob/d1b4b60/apps/mobile/modules/t3-web-socket/ios/T3WebSocketModule.swift)).
Find your own measured problem before writing a module.

Start with Expo Modules (`npx create-expo-module --local`). Use Nitro Modules when calls are hot
and synchronous. Local modules are `file:` dependencies the package manager copies, so after editing a
module's TypeScript run the install again or Metro serves the old copy.

Media goes to the system viewers: AVKit for video, Quick Look for documents, a native image viewer
for images. Do not layer a custom zoom transition over AVKit or Quick Look; it breaks AVKit's Close
and Quick Look's interactive dismiss.

## Rule 7: React Compiler coverage

The compiler memoizes a component only when it can prove the code follows React's rules. When it
can't, it skips the whole function without a build error, and the release build ships unmemoized.

- Turn it on: `experiments.reactCompiler: true` in Expo's app config, or babel-plugin-react-compiler.
- Copy [templates/reactCompilerCoverage.test.ts](../templates/reactCompilerCoverage.test.ts) into `src/`. It
  compiles every file with the app's own Babel config and fails on any skip not on its allow list.
- Delete `useMemo`, `useCallback` and `memo`. When a file leaves the allow list, remove its manual
  memoization in the same change.

What skips most, measured on sb (23 of 155 files skipped):

| Cause | Fix |
| --- | --- |
| Writing a Reanimated shared value with `sv.value = x` in a component (44 skips) | `sv.set(x)` and `sv.get()`, which [Reanimated's docs](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/) prescribe for the compiler |
| `try` with `finally` (6) | settle into a result, then clean up after the `await` |
| Reading a ref during render | read it in a handler or effect |
| A lint suppression comment | fix the rule it hides |

A `use*` helper that calls no hook is compiled as a plain function and caches nothing. Plain uses of
a value go before a hook call, not on both sides of it, or the compiler withholds the cache.

## Rule 8: animation

Reanimated's `withRepeat` commits to the shadow tree every frame and can starve React's commits,
freezing the screen beside heavy content. T3 runs looping animations (spinners, pulses, skeletons)
with React Native's `Animated` and `useNativeDriver: true`. On web: no animation that repaints
continuously; it pegs the GPU on high-refresh displays.

## Rule 9: measure

- Interaction timing: the `interaction-metrics` skill is T3's `mobile:metrics` made portable. Add its
  probe early, mark each screen's content with `<PerfMark>`, and compare refs with `ab`.
- Render counts move less than timings between runs, so gate on them too (`--renders`).
- Payload budgets: see [data-connection.md](data-connection.md#payload-budgets).
- Dev builds: counts and A/B differences are meaningful, absolute times are not.

## Rule 10: platform extras

T3's dependencies include expo-haptics, expo-quick-actions, expo-widgets, expo-symbols,
expo-glass-effect, expo-sharing and `@react-native-menu/menu`. A user notices their absence before
any performance number:

- haptics on primary actions and on state changes the user caused
- native context menus, not JS popovers
- SF Symbols for icons on iOS
- a home screen widget and quick actions for the main task
- Liquid Glass bars on iOS 26 (the glass check in `templates/route-options.ts`)

Grok's app puts chat, voice, camera and image generation one tap from launch. Count the taps from a
cold start to the app's main action, and get it to one.
