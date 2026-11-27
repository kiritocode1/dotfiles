// Read-only check of a React Native app against the t3-playbook rules that grep can find.
//
//   node audit.ts [appDir] [--json]
//
// Advisory: every finding names a file and line for a person to judge. Exit 0 always, 1 on error.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export type Rule = "screen-branches" | "screen-presentation" | "navigate" | "manual-memo" | "reanimated-loop";
export type Finding = { rule: Rule; file: string; line: number; text: string };

/** What each rule means, with the reference that explains the fix. */
export const RULES: Record<Rule, { title: string; fix: string }> = {
  "screen-branches": {
    title: "Screen checks the platform or window size",
    fix: "Move the branch to the router, shell or design system layer (references/navigation-layout.md, Layers).",
  },
  "screen-presentation": {
    title: "Screen sets its own presentation or header options",
    fix: "Give the route a preset from templates/route-options.ts where the stack is declared.",
  },
  navigate: {
    title: "navigate() picks select or drill-in by whatever is on top",
    fix: "Use push for drill-in and replace (or a select helper) for select (references/navigation-layout.md).",
  },
  "manual-memo": {
    title: "Manual memoization",
    fix: "Enable the React Compiler, delete useMemo/useCallback/memo, and gate with templates/reactCompilerCoverage.test.ts.",
  },
  "reanimated-loop": {
    title: "Reanimated loop",
    fix: "Use Animated with useNativeDriver: true for loops beside heavy content (references/native-and-perf.md).",
  },
};

const SKIP_DIRS = new Set(["node_modules", "ios", "android", ".expo", ".git", "dist", "build", ".next", "web-build"]);
// Layers allowed to branch on platform and size: the shell, the design system and native wrappers.
const CHROME_DIRS = new Set(["ui", "design-system", "layout", "navigation", "native", "theme"]);
// Folders whose files are screens or feature code. Anything else (api, store, utils) is not checked for rule 3.
const SCREEN_DIRS = new Set(["app", "features", "screens"]);

const CHECKS: { rule: Rule; re: RegExp; screensOnly: boolean }[] = [
  { rule: "screen-branches", re: /\bPlatform\.(OS|select)\b|\buseWindowDimensions\s*\(|\bDimensions\.get\s*\(/, screensOnly: true },
  { rule: "screen-presentation", re: /\b(presentation|sheetAllowedDetents|headerShown|headerTransparent)\s*:/, screensOnly: true },
  { rule: "navigate", re: /\.navigate\s*\(/, screensOnly: false },
  { rule: "manual-memo", re: /\buse(Memo|Callback)\s*\(|\b(React\.)?memo\s*\(/, screensOnly: false },
  { rule: "reanimated-loop", re: /\bwithRepeat\s*\(/, screensOnly: false },
];

/** Source files of the app, skipping native folders, builds and tests. */
export function sourceFiles(root: string): string[] {
  const out: string[] = [];
  const visit = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) visit(full);
      } else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.(test|spec)\.|\.d\.ts$/.test(e.name)) {
        out.push(full);
      }
    }
  };
  visit(root);
  return out.sort();
}

/** True for feature and route files; false for layouts, platform splits and the chrome layers. */
export function isScreenFile(rel: string): boolean {
  const parts = rel.split(sep);
  const name = basename(rel);
  if (name.startsWith("_layout.") || /\.(ios|android|native|web)\.[jt]sx?$/.test(name)) return false;
  if (parts.some((p) => CHROME_DIRS.has(p))) return false;
  return parts.slice(0, -1).some((p) => SCREEN_DIRS.has(p));
}

/** A custom tab bar, where navigate(route.name) is React Navigation's documented way to switch tabs. */
const isTabBar = (rel: string, text: string) => /tab/i.test(basename(rel)) || /BottomTabBarProps|\btabBar\s*=/.test(text);

/** Findings for one file's text. Line comments are ignored. */
export function checkFile(rel: string, text: string): Finding[] {
  const screen = isScreenFile(rel);
  const tabBar = isTabBar(rel, text);
  const findings: Finding[] = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.replace(/\/\/.*$/, "");
    if (/^\s*(\*|\/\*)/.test(line)) return;
    for (const c of CHECKS) {
      if (c.screensOnly && !screen) continue;
      if (c.rule === "navigate" && tabBar) continue;
      if (c.re.test(line)) findings.push({ rule: c.rule, file: rel, line: i + 1, text: raw.trim().slice(0, 120) });
    }
  });
  return findings;
}

/** Where the React Compiler is turned on, or null. Expo config, Babel config, or a Vite config. */
export function compilerEnabled(root: string): string | null {
  const candidates = ["app.json", "app.config.ts", "app.config.js", "babel.config.js", "vite.config.ts", "vite.config.js"];
  for (const name of candidates) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    if (/reactCompiler"?\s*:\s*true/.test(text) || /babel-plugin-react-compiler/.test(text)) return name;
  }
  return null;
}

export function audit(root: string) {
  const files = sourceFiles(root);
  const findings = files.flatMap((f) => checkFile(relative(root, f), readFileSync(f, "utf8")));
  return { root, files: files.length, compiler: compilerEnabled(root), findings };
}

function report(result: ReturnType<typeof audit>) {
  console.log(`${result.root}: ${result.files} source files\n`);
  console.log(`React Compiler: ${result.compiler ? `on (${result.compiler})` : "off. Turn it on before removing manual memoization."}\n`);
  for (const rule of Object.keys(RULES) as Rule[]) {
    const hits = result.findings.filter((f) => f.rule === rule);
    const byFile = new Map<string, Finding[]>();
    for (const h of hits) byFile.set(h.file, [...(byFile.get(h.file) ?? []), h]);
    console.log(`${RULES[rule].title}: ${hits.length} in ${byFile.size} files`);
    if (!hits.length) continue;
    const top = [...byFile].sort((a, b) => b[1].length - a[1].length).slice(0, 6);
    for (const [file, list] of top) console.log(`  ${file}:${list.map((h) => h.line).join(",")}  ${list[0]?.text ?? ""}`);
    if (byFile.size > top.length) console.log(`  and ${byFile.size - top.length} more files`);
    const fix =
      rule === "manual-memo" && result.compiler
        ? "The compiler is on, so these are redundant. Delete them and gate with templates/reactCompilerCoverage.test.ts."
        : RULES[rule].fix;
    console.log(`  fix: ${fix}`);
  }
  console.log(`\nAdvisory. Rules 1, 5, 6, 9 and 10 need a person; see the review checklist in SKILL.md.`);
}

const HELP = `t3-playbook audit: check a React Native app against the rules grep can find.

  node audit.ts [appDir] [--json]

Read-only. appDir defaults to the current folder and should be the folder with app.json or
package.json. Screens are files under app/, features/ or screens/, minus _layout files,
.ios/.android/.native/.web splits and ui, layout, navigation, native and theme folders.`;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(HELP);
  } else {
    const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
    if (!existsSync(join(root, "package.json"))) {
      console.error(`${root} has no package.json. Pass the app folder, e.g. node audit.ts apps/mobile.`);
      process.exit(1);
    }
    const result = audit(root);
    if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else report(result);
  }
}

export const here = dirname(fileURLToPath(import.meta.url));
