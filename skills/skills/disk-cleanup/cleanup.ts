// Disk cleanup for macOS. Deletes only what rebuilds itself and lists the rest.
//
//   node cleanup.ts scan   [--json]
//   node cleanup.ts clean  [--dry-run] [--json]
//   node cleanup.ts remove <path>... [--dry-run] [--json]
//
// Caches go through Mole (`mo clean`). Project folders listed in config.json are deleted here,
// skipping any project that has a running process inside it. Exit codes: 0 ok, 1 error, 2 refused.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statfsSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = homedir();
const HERE = dirname(fileURLToPath(import.meta.url));

type Config = {
  roots: string[];
  maxDepth: number;
  artifacts: string[];
  yours: { path: string; what: string }[];
};

type Sized = { path: string; kb: number };
type Skipped = { path: string; reason: string };
type YoursRow = Sized & { what: string; how: string };

export const expand = (p: string, home = HOME) => (p === "~" ? home : p.startsWith("~/") ? join(home, p.slice(2)) : resolve(p));
const tilde = (p: string) => (p.startsWith(HOME + sep) ? "~" + p.slice(HOME.length) : p);
const within = (child: string, parent: string) => child === parent || child.startsWith(parent + sep);

function loadConfig(): Config {
  const raw = JSON.parse(readFileSync(join(HERE, "config.json"), "utf8")) as Config;
  return { ...raw, roots: raw.roots.map((r) => expand(r)) };
}

// ── Protection ────────────────────────────────────────────────────────────────

// Browser profile folders that may be deleted. Everything else in a profile (Login Data,
// Cookies, Web Data, Local State, extensions) is protected.
const BROWSER_CACHE = /^(Cache|Code Cache|GPUCache|DawnGraphiteCache|DawnWebGPUCache|GraphiteDawnCache|ShaderCache|GrShaderCache|component_crx_cache)$/;
const isSecretName = (name: string) =>
  name === ".git" || name === ".ssh" || /^\.env(\..+)?$/.test(name) || /\.(pem|key)$/.test(name);

/** Like isSecretName, but a .pem only counts when it holds a private key (or cannot be read),
 *  so public CA bundles such as the Android emulator's do not block deleting the SDK. */
function isSecretFile(path: string): boolean {
  if (!path.endsWith(".pem")) return isSecretName(basename(path));
  try {
    return readFileSync(path, "utf8").includes("PRIVATE KEY");
  } catch {
    return true;
  }
}

/** Why `target` must not be deleted, or null when it may be. Checks the path, not its contents. */
export function protectedReason(target: string, home = HOME): string | null {
  const p = resolve(target);
  const profiles = [
    join(home, "Library/Application Support/Google/Chrome"),
    join(home, "Library/Application Support/net.imput.helium"),
  ];
  const fixed = [join(home, "Library/Keychains"), join(home, ".ssh"), join(home, "Library/Mobile Documents"), ...profiles];
  for (const f of fixed) {
    if (within(p, f)) {
      const inCache = profiles.includes(f) && p.slice(f.length).split(sep).some((s) => BROWSER_CACHE.test(s));
      if (!inCache) return `inside ${f.replace(home, "~")}`;
    } else if (within(f, p)) {
      return `contains ${f.replace(home, "~")}`;
    }
  }
  if (isSecretName(basename(p))) return `${basename(p)} is a key, secret or repository`;
  const app = dirname(p) === "/Applications" && p.endsWith(".app");
  if (!app && (p === home || !within(p, home))) return "outside your home folder";
  return null;
}

/** Protected files inside a folder (keys, .env, .git), first `limit` found. Skips node_modules. */
export function protectedInside(dir: string, limit = 5): string[] {
  const hits: string[] = [];
  const visit = (d: string) => {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (hits.length >= limit) return;
      const full = join(d, e.name);
      if (isSecretName(e.name) && isSecretFile(full)) hits.push(full);
      else if (e.isDirectory() && e.name !== "node_modules") visit(full);
    }
  };
  visit(dir);
  return hits;
}

// ── Measuring ─────────────────────────────────────────────────────────────────

function freeBytes(): number {
  const vol = existsSync("/System/Volumes/Data") ? "/System/Volumes/Data" : "/";
  const s = statfsSync(vol);
  return s.bavail * s.bsize;
}

/** Sizes in KB from one `du` call, so hard links shared between paths count once. */
function sizes(paths: string[]): Sized[] {
  if (!paths.length) return [];
  const r = spawnSync("du", ["-sk", ...paths], { encoding: "utf8", maxBuffer: 16 << 20 });
  const kb = new Map<string, number>();
  for (const line of r.stdout.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab > 0) kb.set(line.slice(tab + 1), Number(line.slice(0, tab)));
  }
  return paths.map((path) => ({ path, kb: kb.get(path) ?? 0 }));
}

const gb = (kb: number) => (kb >= 1048576 ? (kb / 1048576).toFixed(1) + " GB" : Math.round(kb / 1024) + " MB");

/** One line per project: "~/x/sb: 3 folders (a process is running in ~/x/sb)". */
function skippedLines(skipped: Skipped[], roots: string[]): string[] {
  const byProject = new Map<string, Skipped[]>();
  for (const s of skipped) {
    const p = projectOf(s.path, roots);
    byProject.set(p, [...(byProject.get(p) ?? []), s]);
  }
  return [...byProject].map(([p, list]) => {
    const reasons = [...new Set(list.map((s) => s.reason))].join("; ");
    return `${tilde(p)}: ${list.length} folder${list.length > 1 ? "s" : ""} (${reasons})`;
  });
}

const PLATFORM: Record<string, string> = { iphone: "iOS", appletv: "tvOS", watch: "watchOS", xr: "visionOS" };
const has = (cmd: string) => spawnSync("which", [cmd], { stdio: "ignore" }).status === 0;

// ── Project folders ───────────────────────────────────────────────────────────

/** Folders named in `names` under each root, not descending into a match or into .git. */
export function findArtifacts(roots: string[], names: string[], maxDepth: number): string[] {
  const wanted = new Set(names);
  const out: string[] = [];
  const visit = (dir: string, depth: number) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue; // symlinks report false here, so links are never followed
      const full = join(dir, e.name);
      if (wanted.has(e.name)) out.push(full);
      else if (e.name !== ".git" && depth < maxDepth) visit(full, depth + 1);
    }
  };
  for (const root of roots) visit(root, 1);
  return out.sort();
}

/** Working folders of every process you own. Throws when lsof gives nothing, so clean never guesses. */
export function runningCwds(): string[] {
  const r = spawnSync("lsof", ["-a", "-u", userInfo().username, "-d", "cwd", "-Fn"], { encoding: "utf8", maxBuffer: 16 << 20 });
  const cwds = (r.stdout ?? "").split("\n").filter((l) => l.startsWith("n/")).map((l) => l.slice(1));
  if (!cwds.length) throw new Error("lsof returned no working folders, so running projects cannot be detected. Nothing was deleted.");
  return [...new Set(cwds)];
}

/** The top-level project under a root that holds `path`, e.g. ~/Desktop/CREATE/sb. */
export function projectOf(path: string, roots: string[]): string {
  const root = roots.find((r) => within(path, r)) ?? dirname(path);
  return join(root, relative(root, path).split(sep)[0] ?? "");
}

/** Splits artifacts into deletable and skipped, by running process and by protection. */
export function plan(artifacts: string[], roots: string[], cwds: string[], home = HOME) {
  const del: string[] = [];
  const skipped: Skipped[] = [];
  for (const a of artifacts) {
    const project = projectOf(a, roots);
    const busy = cwds.find((c) => within(c, project));
    const reason = busy ? `a process is running in ${tilde(busy)}` : protectedReason(a, home);
    if (reason) skipped.push({ path: a, reason });
    else del.push(a);
  }
  return { del, skipped };
}

// ── Mole ──────────────────────────────────────────────────────────────────────

type MoleResult = { ran: boolean; summary: string; skipped: string[]; note?: string };

/** Runs `mo clean` with stdin closed, which Mole treats as non-interactive: user caches only, no prompt. */
function mole(dryRun: boolean): MoleResult {
  if (!has("mo")) return { ran: false, summary: "", skipped: [], note: "Mole is not installed (brew install mole); caches were not cleaned." };
  const r = spawnSync("mo", ["clean", ...(dryRun ? ["--dry-run"] : [])], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 << 20,
    timeout: 20 * 60_000,
  });
  const lines = ((r.stdout ?? "") + (r.stderr ?? ""))
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const summary = lines.filter((l) => /potential space|space freed|freed|cleaned/i.test(l) && l.length < 160).pop() ?? "";
  const skipped = lines.filter((l) => /skipped|in use|is running/i.test(l) && l.includes("·"));
  if (r.status !== 0) return { ran: false, summary, skipped, note: `mo clean exited ${r.status ?? r.signal}: ${lines.slice(-3).join(" | ")}` };
  return { ran: true, summary, skipped };
}

// ── Your data (never deleted by clean) ────────────────────────────────────────

function yours(cfg: Config): YoursRow[] {
  const rows: YoursRow[] = [];
  const add = (path: string, what: string, how: string) => existsSync(path) && rows.push({ path, what, how, kb: 0 });

  for (const y of cfg.yours) add(expand(y.path), y.what, "cleanup remove");
  for (const root of cfg.roots) {
    for (const p of safeList(root)) add(join(p, ".plannotator"), "Plannotator reviews", "cleanup remove");
  }
  const apps = safeList("/Applications").filter((p) => p.endsWith(".app"));
  for (const a of apps) add(a, "app", "mo uninstall");

  const measured = sizes(rows.map((r) => r.path));
  rows.forEach((r, i) => (r.kb = measured[i]?.kb ?? 0));
  const appRows = rows.filter((r) => r.what === "app").sort((a, b) => b.kb - a.kb).slice(0, 8);
  const out = rows.filter((r) => r.what !== "app" && r.kb > 50 * 1024).concat(appRows);
  return out.concat(simRuntimes()).sort((a, b) => b.kb - a.kb);
}

function simRuntimes(): YoursRow[] {
  if (!has("xcrun")) return [];
  const r = spawnSync("xcrun", ["simctl", "runtime", "list", "-j"], { encoding: "utf8" });
  const d = spawnSync("xcrun", ["simctl", "list", "devices", "-j"], { encoding: "utf8" });
  try {
    const runtimes = JSON.parse(r.stdout) as Record<string, { identifier: string; version: string; sizeBytes: number; runtimeIdentifier: string; platformIdentifier: string }>;
    const devices = (JSON.parse(d.stdout) as { devices: Record<string, unknown[]> }).devices;
    return Object.values(runtimes).map((rt) => {
      const n = devices[rt.runtimeIdentifier]?.length ?? 0;
      const key = rt.platformIdentifier.replace("com.apple.platform.", "").replace("simulator", "");
      const what = `${PLATFORM[key] ?? key} ${rt.version} simulator (${n} devices)`;
      return { path: rt.identifier, kb: Math.round(rt.sizeBytes / 1024), what, how: `xcrun simctl runtime delete ${rt.identifier}` };
    });
  } catch {
    return [];
  }
}

function safeList(dir: string): string[] {
  try {
    return readdirSync(dir).map((n) => join(dir, n));
  } catch {
    return [];
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

function scan(json: boolean) {
  const cfg = loadConfig();
  const found = findArtifacts(cfg.roots, cfg.artifacts, cfg.maxDepth);
  const { del, skipped } = plan(found, cfg.roots, runningCwds());
  const rebuildable = sizes(del);
  const m = mole(true);
  const rows = yours(cfg);
  const result = {
    freeGB: +(freeBytes() / 2 ** 30).toFixed(1),
    rebuildable: { projectKB: rebuildable.reduce((s, r) => s + r.kb, 0), folders: rebuildable, skipped, mole: m },
    needsQuit: m.skipped,
    yours: rows,
  };
  if (json) return print(result);
  console.log(`Free: ${result.freeGB} GB\n`);
  console.log(`1. Rebuildable, deleted by \`clean\``);
  console.log(`   project folders: ${gb(result.rebuildable.projectKB)} in ${del.length} folders`);
  for (const r of rebuildable.sort((a, b) => b.kb - a.kb).slice(0, 12)) console.log(`     ${gb(r.kb).padStart(8)}  ${tilde(r.path)}`);
  console.log(`   caches (Mole): ${m.summary || m.note || "nothing"}`);
  if (skipped.length) {
    console.log(`   skipped:`);
    for (const l of skippedLines(skipped, cfg.roots)) console.log(`     ${l}`);
  }
  console.log(`\n2. Skipped by Mole, usually because the app is open`);
  console.log(m.skipped.length ? m.skipped.map((l) => `   ${l}`).join("\n") : "   none");
  console.log(`\n3. Yours, never deleted automatically`);
  for (const r of rows) {
    const where = r.how.startsWith("xcrun") ? r.how : `${tilde(r.path)}  [${r.how}]`;
    console.log(`   ${gb(r.kb).padStart(8)}  ${r.what.padEnd(34)} ${where}`);
  }
}

function clean(dryRun: boolean, json: boolean) {
  const cfg = loadConfig();
  const before = freeBytes();
  const { del, skipped } = plan(findArtifacts(cfg.roots, cfg.artifacts, cfg.maxDepth), cfg.roots, runningCwds());
  const deleted = sizes(del);
  if (!dryRun) for (const p of del) rmSync(p, { recursive: true, force: true });
  const m = mole(dryRun);
  const pnpm = !dryRun && has("pnpm") && spawnSync("pnpm", ["store", "prune"], { stdio: "ignore" }).status === 0;
  const after = freeBytes();
  const result = {
    dryRun,
    freedGB: dryRun ? 0 : +((after - before) / 2 ** 30).toFixed(1),
    freeGB: +(after / 2 ** 30).toFixed(1),
    deleted,
    skipped,
    mole: m,
    pnpmPruned: pnpm,
  };
  if (json) return print(result);
  const verb = dryRun ? "Would delete" : "Deleted";
  console.log(`${verb} ${deleted.length} project folders (${gb(deleted.reduce((s, r) => s + r.kb, 0))}).`);
  for (const l of skippedLines(skipped, cfg.roots)) console.log(`  skipped ${l}`);
  console.log(`Mole: ${m.summary || m.note || (m.ran ? "done" : "not run")}`);
  for (const l of m.skipped) console.log(`  ${l}`);
  if (!dryRun) console.log(`pnpm store prune: ${pnpm ? "done" : "skipped"}\nFreed ${result.freedGB} GB. Free now ${result.freeGB} GB.`);
}

function remove(paths: string[], dryRun: boolean, json: boolean) {
  if (!paths.length) throw new Error("remove needs at least one path. Run `scan` to see the candidates.");
  const targets = paths.map((p) => expand(p));
  const refused: Skipped[] = [];
  for (const t of targets) {
    if (!existsSync(t)) refused.push({ path: t, reason: "does not exist" });
    const why = protectedReason(t);
    if (why) refused.push({ path: t, reason: why });
    const inside = protectedInside(t);
    if (inside.length) refused.push({ path: t, reason: `holds ${inside.map(tilde).join(", ")}; move or delete those yourself first` });
  }
  if (refused.length) {
    if (json) print({ removed: [], refused });
    else for (const r of refused) console.error(`refused ${tilde(r.path)}: ${r.reason}`);
    console.error("Nothing was deleted.");
    process.exit(2);
  }
  const before = freeBytes();
  const measured = sizes(targets);
  if (!dryRun) for (const t of targets) rmSync(t, { recursive: true, force: true });
  const freedGB = dryRun ? 0 : +((freeBytes() - before) / 2 ** 30).toFixed(1);
  if (json) return print({ dryRun, removed: measured, refused, freedGB });
  for (const m of measured) console.log(`${dryRun ? "would remove" : "removed"} ${gb(m.kb).padStart(8)}  ${tilde(m.path)}`);
  if (!dryRun) console.log(`Freed ${freedGB} GB.`);
}

const print = (v: unknown) => console.log(JSON.stringify(v, null, 2));

const HELP: Record<string, string> = {
  main: `cleanup: free disk space on macOS without touching what you need.

  scan               measure everything, in three tiers. Read-only.
  clean              delete tier 1: project folders from config.json, then \`mo clean\` caches
                     and \`pnpm store prune\`. Skips projects with a running process.
  remove <path>...   delete tier 3 rows you picked. Refuses protected paths.

Flags: --dry-run (clean, remove), --json, --help. Config: ${tilde(join(HERE, "config.json"))}`,
  scan: `cleanup scan [--json]\n\nRead-only. Runs \`mo clean --dry-run\` and sizes every tier.`,
  clean: `cleanup clean [--dry-run] [--json]\n\nDeletes only rebuildable folders and caches. Never deletes dist, build, target, .vercel or .wrangler.`,
  remove: `cleanup remove <path>... [--dry-run] [--json]\n\nDeletes nothing if any path is protected: browser profiles (except cache folders),\nKeychains, ~/.ssh, iCloud, .git, .env*, *.pem, *.key, or a folder holding one of those.`,
};

function main(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const [cmd, ...rest] = argv.filter((a) => !a.startsWith("--"));
  if (!cmd || flags.has("--help")) return console.log(HELP[cmd ?? "main"] ?? HELP.main);
  const json = flags.has("--json");
  const dry = flags.has("--dry-run");
  if (cmd === "scan") return scan(json);
  if (cmd === "clean") return clean(dry, json);
  if (cmd === "remove") return remove(rest, dry, json);
  throw new Error(`unknown command "${cmd}". Commands: scan, clean, remove.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
