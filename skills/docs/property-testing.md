# Property testing skill (parked)

Status: idea, not built. Noted 2026-11-19.

## Decision so far

Make one `property-testing` skill, not one per tool. Two layers:

1. Code level. Patterns: round-trip (parse/serialize), invariant, model or oracle, metamorphic,
   state machine. Tools: fast-check, or Effect Schema arbitraries when the types already exist.
   Good targets: parsers, reducers, sync, money and date math.
2. UI level. Bombadil (https://antithesishq.github.io/bombadil/).

Before writing the UI half, run Bombadil on one real web app so the skill describes observed
behavior, not the manual.

## Bombadil notes (manual v0.7.10, not yet run)

- Spec is a TypeScript module exporting properties and action generators.
  `extract(state => ...)` reads the DOM into a `Cell`; properties are LTL formulas built from
  `always`, `eventually(...).within(5, "seconds")`, `next`, `now`, `.implies`.
- `export * from "@antithesishq/bombadil/browser/defaults"` gives `noHttpErrorCodes`,
  `noUncaughtExceptions`, `noUnhandledPromiseRejections`, `noConsoleErrors` with no custom code.
- `noResourceLeak` from `browser/extras/resources` checks growth of `dom_nodes`,
  `js_event_listeners` or heap within a sliding window.
- Run: `bombadil browser test <url> spec.ts --headless --time-limit 5m --exit-on-violation
  --output-path out`. Debug with `--reproduce=out`, `bombadil browser shrink`, and `inspect`.
- CI: `antithesishq/bombadil-action@v2`.
- Limits: pre-1.0, shrink is experimental, reproduction can diverge outside Antithesis,
  DOM only (no React Native), macOS and Linux. Random exploration will not reach deep or
  authenticated flows without custom action generators and seeded test users.
