// Fails when the React Compiler skips a file. Adapted from T3 Code's
// apps/mobile/src/reactCompilerCoverage.test.ts.
//
// The compiler memoizes a component only when it can prove the code follows React's rules. When it
// can't (a ref read during render, setState in an effect, try/finally), it skips the whole function
// with no build error, and release builds ship it unmemoized. This test compiles every source file
// with the app's own Babel config and fails on any skip that is not listed below.
//
// Copy to <app>/src/reactCompilerCoverage.test.ts. Runs under Vitest or Jest. Expo apps need
// `experiments.reactCompiler: true` in app config; other apps need babel-plugin-react-compiler in
// babel.config.js. When a listed file compiles again, the test asks you to remove its entry, and
// you delete that file's manual useMemo/useCallback/memo in the same change.

import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(__dirname, "..");
const requireFromApp = createRequire(path.join(appRoot, "package.json"));
const babel: { transformFileSync: (file: string, options: Record<string, unknown>) => unknown } = requireFromApp("@babel/core");

/** file → why the compiler skips it. Keep this short and shrinking. */
const KNOWN_BAILOUTS: Record<string, string> = {};

// Metro's release-build caller. supportsReactCompiler is what Expo's preset checks.
const metroCaller = {
  name: "metro",
  bundler: "metro",
  platform: "ios",
  isDev: false,
  isServer: false,
  isNodeModule: false,
  supportsStaticESM: true,
  supportsReactCompiler: true,
};

const sourceFiles = fs
  .readdirSync(path.join(appRoot, "src"), { recursive: true })
  .map(String)
  .filter((file) => /\.tsx?$/.test(file) && !/\.(test\.tsx?|d\.ts)$/.test(file))
  .map((file) => `src/${file.split(path.sep).join("/")}`)
  .sort();

type Loc = { readonly start?: { readonly line?: number } } | null;
type CompilerEvent = {
  readonly kind: string;
  readonly fnLoc?: Loc;
  readonly detail?: {
    readonly options?: {
      readonly category?: string;
      readonly reason?: string;
      readonly loc?: Loc;
      readonly details?: readonly { readonly loc?: Loc; readonly message?: string }[];
    };
  };
};

/** Compiles one file with the app's babel.config.js, logging the compiler's events. */
function bailouts(file: string): string[] {
  const events: CompilerEvent[] = [];
  const config = requireFromApp("./babel.config.js")({ cache: () => {} });
  const logger = { logEvent: (_: string, event: CompilerEvent) => events.push(event) };
  const presets = config.presets.map((entry: string | [string, object]) => {
    const [name, options] = typeof entry === "string" ? [entry, {}] : entry;
    return name === "babel-preset-expo"
      ? [requireFromApp.resolve(name), { ...options, "react-compiler": { logger } }]
      : [name, options];
  });
  const plugins = (config.plugins ?? []).map((entry: string | [string, object]) => {
    const [name, options] = typeof entry === "string" ? [entry, {}] : entry;
    return name === "babel-plugin-react-compiler" ? [name, { ...options, logger }] : [name, options];
  });
  babel.transformFileSync(path.join(appRoot, file), {
    babelrc: false,
    configFile: false,
    cwd: appRoot,
    presets,
    plugins,
    caller: metroCaller,
    code: false,
  });
  return events
    .filter((e) => e.kind === "CompileError" || e.kind === "CompileSkip")
    .map((e) => {
      const o = e.detail?.options;
      const line = (o?.loc ?? o?.details?.[0]?.loc ?? e.fnLoc)?.start?.line ?? "?";
      return `line ${line}: ${o?.category ?? e.kind}. ${o?.details?.[0]?.message ?? o?.reason ?? ""}`;
    });
}

describe("React Compiler coverage", () => {
  it.each(sourceFiles)("compiles %s", (file) => {
    const found = bailouts(file);
    if (file in KNOWN_BAILOUTS) expect(found, `${file} compiles now; remove it from KNOWN_BAILOUTS`).not.toEqual([]);
    else expect(found).toEqual([]);
  });

  it("lists only files that exist", () => {
    expect(Object.keys(KNOWN_BAILOUTS).filter((file) => !sourceFiles.includes(file))).toEqual([]);
  });
});
