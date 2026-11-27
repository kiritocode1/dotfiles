#!/usr/bin/env node
// interaction-metrics: benchmarks real interactions in a React Native, web or Electron app
// through Argent and the in-app probe. See the skill's SKILL.md; `--help` lists commands.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

import {
  ArgentError,
  call,
  center,
  describe,
  describeSelector,
  evaluate,
  evaluateJson,
  findNode,
  listDevices,
  type Device,
  type Platform,
  type Selector,
} from "./argent.ts";
import {
  compareSeries,
  flatten,
  noiseOfSeries,
  stepOf,
  workloadDifferences,
  type Floors,
  type Launch,
  type ProbeWindow,
  type RunFile,
  type Step,
} from "./stats.ts";

// ---------------------------------------------------------------------------------------------
// Config

type Action =
  | { readonly tap: Selector | { readonly x: number; readonly y: number } }
  | { readonly type: string; readonly delayMs?: number }
  | { readonly key: string }
  | { readonly swipe: { readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly durationMs?: number } }
  | { readonly scroll: { readonly x?: number; readonly y?: number; readonly dy: number; readonly durationMs?: number } }
  | { readonly back: true }
  | { readonly open: string }
  | { readonly waitFor: Selector; readonly timeoutMs?: number }
  | { readonly eval: string }
  | { readonly pause: number };

interface Case {
  readonly name: string;
  readonly setup?: ReadonlyArray<Action>;
  readonly measure: Action | ReadonlyArray<Action>;
  /** `<PerfMark id>` whose first frame ends the latency measurement. */
  readonly until?: string;
  readonly teardown?: ReadonlyArray<Action>;
}

interface Config {
  readonly app: {
    readonly platform: Platform;
    /** Device id from `argent run list-devices`; default: the only running device of the platform. */
    readonly device?: string;
    /** Chromium: opened at the start of every launch. */
    readonly url?: string;
    /** React Native: bundle id or package, restarted at the start of every launch. */
    readonly bundleId?: string;
    /** Mark the app shows once it is ready for the first case. */
    readonly ready?: string;
  };
  /** How `ab` serves each checkout. `run` measures whatever is already serving. */
  readonly server?: {
    readonly command: string;
    /** Relative to the checkout root. */
    readonly cwd?: string;
    /** URL that answers 2xx once the server is ready. */
    readonly ready: string;
    readonly readyText?: string;
    readonly readyTimeoutMs?: number;
  };
  /** Run once in each new `ab` worktree, e.g. "pnpm install --frozen-lockfile --prefer-offline". */
  readonly setup?: string;
  /** React Native: paths whose change between refs needs a native rebuild, so `ab` refuses. */
  readonly nativePaths?: ReadonlyArray<string>;
  readonly rounds?: number;
  readonly launches?: number;
  readonly network?: "live" | "fixture";
  readonly build?: "dev" | "release";
  readonly cases: ReadonlyArray<Case>;
}

const CONFIG_NAME = "interaction-metrics.json";
const DEFAULT_NATIVE_PATHS = ["ios", "android", "app.json", "app.config.ts", "app.config.js", "modules", "plugins", "patches"];

class UsageError extends Error {}

function loadConfig(path: string) {
  if (!existsSync(path))
    throw new UsageError(`No ${CONFIG_NAME} at ${path}. Write one (see references/cases.md in the skill) or pass --config.`);
  const config = JSON.parse(readFileSync(path, "utf8")) as Config;
  const problems: string[] = [];
  if (!["chromium", "ios", "android"].includes(config.app?.platform)) problems.push('app.platform must be "chromium", "ios" or "android"');
  if (config.app?.platform === "chromium" && !config.app.url) problems.push("app.url is required for chromium");
  if (config.app?.platform !== "chromium" && !config.app?.bundleId) problems.push("app.bundleId is required for ios and android");
  if (!Array.isArray(config.cases) || config.cases.length === 0) problems.push("cases must list at least one case");
  const names = new Set<string>();
  for (const entry of config.cases ?? []) {
    if (!entry.name) problems.push("every case needs a name");
    if (names.has(entry.name)) problems.push(`case name "${entry.name}" appears twice`);
    names.add(entry.name);
    if (!entry.measure) problems.push(`case "${entry.name}" has no measure action`);
  }
  if (problems.length) throw new UsageError(`${path}:\n  - ${problems.join("\n  - ")}`);
  return config;
}

// ---------------------------------------------------------------------------------------------
// Device and probe

async function pickDevice(config: Config) {
  const devices = await listDevices();
  const wanted = config.app.device;
  const device = wanted
    ? devices.find((entry) => entry.id === wanted)
    : devices.filter((entry) => entry.platform === config.app.platform)[0];
  if (!device) {
    const running = devices.map((entry) => `${entry.platform}:${entry.id}`).join(", ") || "none";
    const how =
      config.app.platform === "chromium"
        ? "Launch Chrome or the Electron app with --remote-debugging-port=9222 (argent boot-device --electronAppPath for Electron)."
        : "Boot one with argent's boot-device and install the dev client.";
    throw new UsageError(`No running ${config.app.platform} device${wanted ? ` "${wanted}"` : ""}. Running: ${running}. ${how}`);
  }
  return device;
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function waitForProbe(device: Device, ready: string | undefined, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const info = await evaluateJson<{ version: number; marksSeen: string[] }>(
        device,
        "typeof __perfProbe === 'undefined' ? 'null' : __perfProbe.info()",
      );
      if (info && (!ready || info.marksSeen.includes(ready))) return info;
      last = info ? `probe up, waiting for mark "${ready}"` : "no __perfProbe in the runtime";
    } catch (error) {
      last = (error as Error).message;
    }
    await sleep(500);
  }
  throw new UsageError(
    `The probe never became ready (${last}). Check that the app imports probe-init first in development builds` +
      (ready ? `, and that <PerfMark id="${ready}"> mounts on the first screen.` : "."),
  );
}

async function relaunch(config: Config, device: Device) {
  if (device.platform === "chromium") {
    await call("open-url", { udid: device.id, url: config.app.url });
  } else {
    await call("restart-app", { udid: device.id, bundleId: config.app.bundleId });
    // A fresh JS runtime needs a fresh inspector session.
    await call("debugger-connect", { device_id: device.id }).catch(() => undefined);
  }
  return waitForProbe(device, config.app.ready);
}

async function act(device: Device, action: Action) {
  if ("tap" in action) {
    const target = action.tap;
    if ("x" in target && "y" in target) return call("gesture-tap", { udid: device.id, x: target.x, y: target.y });
    for (let attempt = 0; attempt < 10; attempt++) {
      const node = findNode(await describe(device), target as Selector);
      if (node) return call("gesture-tap", { udid: device.id, ...center(node) });
      await sleep(300);
    }
    throw new UsageError(`Nothing on screen matches ${describeSelector(target as Selector)}. Run \`describe\` to see the labels.`);
  }
  if ("type" in action) return call("keyboard", { udid: device.id, text: action.type, delayMs: action.delayMs ?? 50 });
  if ("key" in action) return call("keyboard", { udid: device.id, key: action.key });
  if ("swipe" in action) {
    const { from, to, durationMs } = action.swipe;
    return call("gesture-swipe", { udid: device.id, fromX: from[0], fromY: from[1], toX: to[0], toY: to[1], durationMs: durationMs ?? 300 });
  }
  if ("scroll" in action) {
    const { x = 0.5, y = 0.5, dy, durationMs } = action.scroll;
    return call("gesture-scroll", { udid: device.id, x, y, deltaY: dy, durationMs: durationMs ?? 300 });
  }
  if ("back" in action) {
    if (device.platform === "chromium") return evaluate(device, "history.back(), true");
    if (device.platform === "android") return call("button", { udid: device.id, button: "back" });
    return call("gesture-swipe", { udid: device.id, fromX: 0, fromY: 0.5, toX: 0.8, toY: 0.5, durationMs: 300 });
  }
  if ("open" in action) return call("open-url", { udid: device.id, url: action.open });
  if ("waitFor" in action) {
    const result = await call("await-ui-element", {
      udid: device.id,
      condition: "visible",
      selector: { ...(action.waitFor.label || action.waitFor.text ? { text: action.waitFor.label ?? action.waitFor.text } : {}), ...(action.waitFor.id ? { identifier: action.waitFor.id } : {}), ...(action.waitFor.role ? { role: action.waitFor.role } : {}) },
      timeoutMs: action.timeoutMs ?? 10_000,
    });
    if (result.success !== true) throw new UsageError(`waitFor ${describeSelector(action.waitFor)} never appeared: ${String(result.note ?? "")}`);
    return result;
  }
  if ("eval" in action) return evaluate(device, action.eval);
  if ("pause" in action) return sleep(action.pause);
  throw new UsageError(`Unknown action ${JSON.stringify(action)}`);
}

/** How long the app must stay without input, commits or new content to end a step. */
const QUIET_MS = 1_000;
/** A screen that keeps committing (a stream, a clock) ends this long after its content showed. */
const AFTER_CONTENT_MS = 1_200;
/** A case whose mark stays mounted on revisits ends after this much quiet without it. */
const QUIET_WITHOUT_MARK_MS = 2_500;
const STEP_TIMEOUT_MS = 15_000;

interface Peek {
  readonly now: number;
  readonly last: number;
  readonly inputs: number;
  readonly marks: ReadonlyArray<string>;
}

async function measure(device: Device, entry: Case, round: number, renders: boolean) {
  await evaluate(device, `__perfProbe.start(${JSON.stringify({ renders })})`);
  let window: ProbeWindow | null = null;
  try {
    for (const action of Array.isArray(entry.measure) ? entry.measure : [entry.measure]) await act(device, action as Action);
    const deadline = Date.now() + STEP_TIMEOUT_MS;
    let shownAt: number | null = null;
    while (Date.now() < deadline) {
      const peek = await evaluateJson<Peek>(device, "__perfProbe.peek()");
      if (entry.until && shownAt === null && peek.marks.includes(entry.until)) shownAt = peek.now;
      const idle = peek.inputs > 0 ? peek.now - peek.last : 0;
      const done = entry.until
        ? (shownAt !== null && (idle > QUIET_MS || peek.now - shownAt > AFTER_CONTENT_MS)) || idle > QUIET_WITHOUT_MARK_MS
        : idle > QUIET_MS;
      if (done) break;
      await sleep(150);
    }
  } finally {
    // Always close the window so a failed step cannot leak into the next one.
    window = await evaluateJson<ProbeWindow | null>(device, "__perfProbe.stop()");
  }
  if (!window) throw new UsageError("The probe window was already closed; is another runner using this app?");
  if (window.inputs.length === 0)
    throw new UsageError(
      `Case "${entry.name}": the probe saw no input. On React Native wrap the root in <PerfRoot>; on the web the probe must load before react-dom.`,
    );
  return stepOf(window, { case: entry.name, round, until: entry.until ?? null });
}

async function runLaunch(config: Config, device: Device, options: { cases: ReadonlyArray<Case>; rounds: number; renders: boolean; label: string; ref: string }) {
  await relaunch(config, device);
  const steps: Step[] = [];
  const skipped: Array<{ case: string; reason: string }> = [];
  for (let round = 0; round < options.rounds; round++) {
    for (const entry of options.cases) {
      try {
        for (const action of entry.setup ?? []) await act(device, action);
        const step = await measure(device, entry, round, options.renders);
        steps.push(step);
        log(`  ${options.label} r${round} ${entry.name}${step.visit === "step" ? "" : `.${step.visit}`}: content ${step.contentMs ?? "-"} ms, settled ${step.settledMs ?? "-"} ms, ${step.commits} commits`);
        for (const action of entry.teardown ?? []) await act(device, action);
      } catch (error) {
        const reason = (error as Error).message;
        skipped.push({ case: entry.name, reason });
        log(`  ${options.label} r${round} ${entry.name}: FAILED ${reason}`);
        // Get back to a known state for the next case.
        await relaunch(config, device);
      }
    }
  }
  const memory = await evaluateJson<{ heapMB: number | null }>(device, "__perfProbe.heap()").catch(() => ({ heapMB: null }));
  const launch: Launch = { label: options.label, ref: options.ref, steps, memoryMB: memory.heapMB };
  return { launch, skipped };
}

/** Problems a run can show without failing: marks that never mounted, a probe React never saw. */
function unseenMarks(cases: ReadonlyArray<Case>, launches: ReadonlyArray<Launch>) {
  const steps = launches.flatMap((launch) => launch.steps);
  const blind =
    steps.length > 0 && steps.every((step) => step.commits === 0)
      ? [{ case: "*", reason: "no React commits in any step: the probe loaded after the React renderer. Import probe-init before react-dom." }]
      : [];
  return [...blind, ...cases.flatMap((entry) => {
    if (!entry.until) return [];
    const shown = launches.some((launch) => launch.steps.some((step) => step.case === entry.name && step.contentMs !== null));
    return shown ? [] : [{ case: entry.name, reason: `mark "${entry.until}" never mounted after the input; check its <PerfMark id>` }];
  })];
}

// ---------------------------------------------------------------------------------------------
// Files and git

const log = (line: string) => process.stderr.write(`${line}\n`);

function git(cwd: string, args: ReadonlyArray<string>) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function repoRoot(from: string) {
  try {
    return git(from, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new UsageError(`${from} is not inside a git repository; ab needs refs to compare.`);
  }
}

function outDir(root: string, label: string, override?: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = override ? resolve(override) : join(root, ".perf", `${stamp}-${label}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function runFile(config: Config, device: Device, ref: string, commit: string | null, launches: Launch[], skipped: RunFile["skipped"], cases: ReadonlyArray<Case>, rounds: number, renders: boolean): RunFile {
  return {
    tool: "interaction-metrics",
    version: 1,
    ref,
    commit,
    platform: device.platform,
    device: device.name,
    build: config.build ?? "dev",
    workload: { cases: cases.map((entry) => entry.name), rounds, renders },
    network: config.network ?? "live",
    launches,
    skipped: [...skipped, ...unseenMarks(cases, launches)],
  };
}

const cell = (value: number | null | undefined) => (value === null || value === undefined ? "–" : String(value));

function summaryOf(run: RunFile) {
  const series = flatten(run);
  const lines = [
    `# ${run.ref} on ${run.platform} (${run.device}), ${run.build} build, network ${run.network}`,
    "",
    `${run.launches.length} launch(es) × ${run.workload.rounds} round(s). Values are the median over launches of each launch's median.`,
    run.build === "dev" ? "Dev build: counts and A/B differences are representative; absolute times are not." : "",
    "",
    "| metric | median | launches |",
    "| :-- | --: | --: |",
  ];
  for (const [metric, values] of [...series].sort(([x], [y]) => x.localeCompare(y))) {
    const sortedValues = [...values].sort((a, b) => a - b);
    const middle = sortedValues.length % 2 ? sortedValues[(sortedValues.length - 1) / 2]! : (sortedValues[sortedValues.length / 2 - 1]! + sortedValues[sortedValues.length / 2]!) / 2;
    lines.push(`| ${metric} | ${Math.round(middle * 10) / 10} | ${values.length} |`);
  }
  if (run.skipped.length) lines.push("", "## Skipped", "", ...run.skipped.map((entry) => `- ${entry.case}: ${entry.reason}`));
  return lines.filter((line, index, all) => !(line === "" && all[index - 1] === "")).join("\n");
}

function compareTable(a: RunFile, b: RunFile, threshold: number, floors?: Floors) {
  const result = compareSeries(flatten(a), flatten(b), threshold, floors);
  const lines = [
    `# ${a.ref} → ${b.ref} (${a.platform}, ${a.build} build, ${a.launches.length} vs ${b.launches.length} launches)`,
    "",
    "| metric | before | after | change | 95% interval | |",
    "| :-- | --: | --: | --: | --: | :-- |",
    ...result.rows.map(
      (row) =>
        `| ${row.metric} | ${cell(row.before)} | ${cell(row.after)} | ${row.changePct === null ? "–" : `${row.changePct > 0 ? "+" : ""}${row.changePct}%`} | ${row.interval ? `${row.interval[0]} to ${row.interval[1]}` : ""} | ${row.verdict === "noisy" ? row.note : row.verdict} |`,
    ),
    "",
    `Worse: ${result.regressed.join(", ") || "none"}`,
    `Better: ${result.improved.join(", ") || "none"}`,
    result.noisy.length ? `Moved but not gated: ${result.noisy.join(", ")}` : "",
    floors ? `Floors: calibrated (${floors.platform})` : "Floors: defaults; run `noise` on A/A runs to calibrate.",
  ];
  return { ...result, table: lines.join("\n") };
}

function readRun(path: string) {
  const run = JSON.parse(readFileSync(path, "utf8")) as RunFile;
  if (run.tool !== "interaction-metrics") throw new UsageError(`${path} is not an interaction-metrics run file.`);
  return run;
}

// ---------------------------------------------------------------------------------------------
// Servers for ab

/**
 * Whether `url` answers 2xx (and contains `text`). Local dev hosts (*.localhost, loopback) skip
 * certificate checks: portless and similar proxies sign with a local CA Node does not trust.
 */
function urlAnswers(url: string, text?: string) {
  const target = new URL(url);
  const local = target.hostname === "localhost" || target.hostname.endsWith(".localhost") || target.hostname === "127.0.0.1";
  const client = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<boolean>((done) => {
    const request = client(target, { method: "GET", timeout: 2_000, ...(local ? { rejectUnauthorized: false } : {}) }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => (body = (body + chunk).slice(-64_000)));
      response.on("end", () => {
        const ok = (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 300;
        done(ok && (!text || body.includes(text)));
      });
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => done(false));
    request.end();
  });
}

async function startServer(server: NonNullable<Config["server"]>, checkout: string) {
  const cwd = join(checkout, server.cwd ?? ".");
  const child = spawn("/bin/sh", ["-c", server.command], { cwd, detached: true, stdio: ["ignore", "pipe", "pipe"], env: process.env });
  let output = "";
  child.stdout?.on("data", (chunk) => (output = (output + chunk).slice(-4000)));
  child.stderr?.on("data", (chunk) => (output = (output + chunk).slice(-4000)));
  const deadline = Date.now() + (server.readyTimeoutMs ?? 120_000);
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new UsageError(`Server "${server.command}" in ${cwd} exited with ${child.exitCode}:\n${output}`);
    if (await urlAnswers(server.ready, server.readyText)) return child;
    await sleep(500);
  }
  stopServer(child);
  throw new UsageError(`Server "${server.command}" in ${cwd} never answered ${server.ready}:\n${output}`);
}

/** Stops only the process group this runner spawned, never anything found by name. */
function stopServer(child: ChildProcess) {
  if (child.pid === undefined || child.exitCode !== null) return Promise.resolve();
  return new Promise<void>((done) => {
    child.once("exit", () => done());
    try {
      process.kill(-child.pid!, "SIGTERM");
    } catch {
      done();
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid!, "SIGKILL");
      } catch {}
      done();
    }, 5_000);
  });
}

async function waitUrlGone(url: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && (await urlAnswers(url))) await sleep(300);
}

interface Side {
  readonly label: "A" | "B";
  readonly ref: string;
  readonly commit: string | null;
  readonly checkout: string;
  readonly created: boolean;
}

function prepareSide(root: string, label: "A" | "B", ref: string, config: Config, dryRun: boolean): Side {
  if (ref === ".") return { label, ref: "working tree", commit: git(root, ["rev-parse", "--short=12", "HEAD"]) + "+dirty", checkout: root, created: false };
  const commit = git(root, ["rev-parse", "--short=12", `${ref}^{commit}`]);
  const checkout = join(dirname(root), `${basename(root)}-perf-${label.toLowerCase()}-${commit}`);
  if (existsSync(checkout)) return { label, ref, commit, checkout, created: false };
  if (!dryRun) {
    git(root, ["worktree", "add", "--detach", checkout, commit]);
    if (config.setup) {
      log(`setup in ${checkout}: ${config.setup}`);
      // fd 2 for both: stdout stays clean for --json.
      execFileSync("/bin/sh", ["-c", config.setup], { cwd: checkout, stdio: ["ignore", 2, 2] });
    }
  }
  return { label, ref, commit, checkout, created: true };
}

/** Native files that differ between the sides; the working tree diffs against the other commit. */
function nativeChanges(root: string, a: Side, b: Side, paths: ReadonlyArray<string>) {
  const tree = [a, b].find((side) => side.ref === "working tree");
  const other = [a, b].find((side) => side !== tree)!;
  const args = tree ? ["diff", "--name-only", other.commit!.replace("+dirty", "")] : ["diff", "--name-only", a.commit!, b.commit!];
  return git(root, [...args, "--", ...paths]).split("\n").filter(Boolean);
}

// ---------------------------------------------------------------------------------------------
// Commands

const HELP = `interaction-metrics: time real interactions in a running app, and compare two git refs.

Usage: node metrics.ts <command> [options]

Commands:
  check                 Validate ${CONFIG_NAME}, find the device, confirm the probe answers.
  run                   Measure the app that is running now. Writes .perf/<stamp>-run/.
  ab <refA> <refB>      Serve each ref from its own worktree, alternating A B B A per launch,
                        and compare. "." means the working tree as it is.
  noise <abDir...>      Floors from A/A runs (ab HEAD HEAD): writes floors.json.
  compare <a> <b>       Compare two run files (A.json, B.json) by median per launch.

Options:
  --config <path>       Default: ./${CONFIG_NAME}
  --cases <a,b>         Only these cases.
  --rounds <n>          Rounds of every case per launch (config.rounds, default 2).
  --launches <n>        Launches per side; each launch is one sample (config.launches, default 3).
  --renders             Count component renders per step (dev builds; slows commits).
  --floors <file>       Calibrated floors from noise, for compare and ab.
  --threshold <pct>     Relative change a metric must also clear (default 10).
  --gate                compare/ab exit 3 when anything got worse.
  --out <dir>           Output directory.
  --keep                ab: keep the worktrees it created.
  --allow-native        ab: run even when native paths differ between the refs.
  --dry-run             ab: print the plan without creating worktrees or starting servers.
  --json                Print machine-readable results on stdout.

Numbers: each launch's median per metric is one sample. compare reports a change only when
the 95% bootstrap interval of the median difference clears both --threshold and the metric's
floor. A dev build's counts and A/B differences are meaningful; its absolute times are not.`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      config: { type: "string" },
      cases: { type: "string" },
      rounds: { type: "string" },
      launches: { type: "string" },
      renders: { type: "boolean", default: false },
      floors: { type: "string" },
      threshold: { type: "string" },
      gate: { type: "boolean", default: false },
      out: { type: "string" },
      keep: { type: "boolean", default: false },
      "allow-native": { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return 0;
  }
  const threshold = Number(values.threshold ?? 10);
  const floors = values.floors ? (JSON.parse(readFileSync(values.floors, "utf8")) as Floors) : undefined;
  const emit = (human: string, machine: unknown) => console.log(values.json ? JSON.stringify(machine, null, 2) : human);

  if (command === "compare") {
    if (rest.length !== 2) throw new UsageError("compare takes two run files: compare A.json B.json");
    const [a, b] = rest.map((path) => readRun(path!));
    const differences = workloadDifferences(a!, b!);
    if (differences.length) throw new UsageError(`These runs measured different workloads: ${differences.join("; ")}.`);
    const result = compareTable(a!, b!, threshold, floors);
    emit(result.table, result);
    return values.gate && result.regressed.length ? 3 : 0;
  }

  if (command === "noise") {
    if (rest.length === 0) throw new UsageError("noise takes one or more ab output directories from `ab HEAD HEAD`.");
    const pairs = rest.map((dir) => {
      const a = readRun(join(dir!, "A.json"));
      const b = readRun(join(dir!, "B.json"));
      if (a.commit?.replace("+dirty", "") !== b.commit?.replace("+dirty", "")) throw new UsageError(`${dir} compares ${a.commit} with ${b.commit}; noise needs A/A runs of one commit.`);
      return [flatten(a), flatten(b)] as const;
    });
    const platform = readRun(join(rest[0]!, "A.json")).platform;
    const result = noiseOfSeries(pairs, platform);
    const path = resolve(values.out ?? "floors.json");
    writeFileSync(path, JSON.stringify(result.floors, null, 2));
    const table = [
      "| metric | median | ± A/A interval | A/A diff | default floor | calibrated floor | gate |",
      "| :-- | --: | --: | --: | --: | --: | :-: |",
      ...result.rows.map((row) => `| ${row.metric} | ${row.median} | ${row.halfWidth} | ${row.aaDifference} | ${row.defaultFloor} | ${row.floor} | ${row.gate ? "yes" : "no"} |`),
      "",
      `Wrote ${path}`,
    ].join("\n");
    emit(table, { ...result, path });
    return 0;
  }

  const configPath = resolve(values.config ?? CONFIG_NAME);
  const config = loadConfig(configPath);
  const projectRoot = dirname(configPath);
  const cases = values.cases ? config.cases.filter((entry) => values.cases!.split(",").includes(entry.name)) : config.cases;
  if (cases.length === 0) throw new UsageError(`No case matches --cases ${values.cases}. Cases: ${config.cases.map((entry) => entry.name).join(", ")}`);
  const rounds = Number(values.rounds ?? config.rounds ?? 2);
  const launches = Number(values.launches ?? config.launches ?? 3);

  if (command === "check") {
    const device = await pickDevice(config);
    const info = await waitForProbe(device, undefined, 10_000);
    const missing = cases.flatMap((entry) => (entry.until && !info.marksSeen.includes(entry.until) ? [entry.until] : []));
    emit(
      [
        `device   ${device.platform} ${device.id} (${device.name})`,
        `probe    v${info.version}, engine ${(info as { engine?: string }).engine}, UI frames ${(info as { uiFrames?: boolean }).uiFrames ? "yes" : "no"}`,
        `marks    seen so far: ${info.marksSeen.join(", ") || "none"}`,
        missing.length ? `note     not mounted yet (fine if they live on later screens): ${missing.join(", ")}` : "",
        `cases    ${cases.map((entry) => entry.name).join(", ")}`,
      ].filter(Boolean).join("\n"),
      { device, info, missing },
    );
    return 0;
  }

  if (command === "run") {
    const device = await pickDevice(config);
    const all: Launch[] = [];
    const skipped: Array<{ case: string; reason: string }> = [];
    let commit: string | null = null;
    try {
      commit = git(projectRoot, ["rev-parse", "--short=12", "HEAD"]);
    } catch {}
    for (let index = 0; index < launches; index++) {
      log(`launch ${index + 1}/${launches}`);
      const result = await runLaunch(config, device, { cases, rounds, renders: values.renders, label: "run", ref: "current" });
      all.push(result.launch);
      skipped.push(...result.skipped);
    }
    const run = runFile(config, device, "current", commit, all, skipped, cases, rounds, values.renders);
    const dir = outDir(projectRoot, "run", values.out);
    writeFileSync(join(dir, "run.json"), JSON.stringify(run, null, 2));
    const summary = summaryOf(run);
    writeFileSync(join(dir, "summary.md"), summary);
    emit(`${summary}\n\nWrote ${dir}`, { dir, run });
    return 0;
  }

  if (command === "ab") {
    if (rest.length !== 2) throw new UsageError("ab takes two refs: ab main HEAD (\".\" is the working tree)");
    if (!config.server) throw new UsageError(`ab needs a "server" block in ${CONFIG_NAME} so it can serve each checkout.`);
    const root = repoRoot(projectRoot);
    const relative = projectRoot.slice(root.length + 1);
    const a = prepareSide(root, "A", rest[0]!, config, values["dry-run"]);
    const b = prepareSide(root, "B", rest[1]!, config, values["dry-run"]);
    if (config.app.platform !== "chromium") {
      const changed = nativeChanges(root, a, b, (config.nativePaths ?? DEFAULT_NATIVE_PATHS).map((path) => join(relative, path)));
      if (changed.length && !values["allow-native"])
        throw new UsageError(
          `Native code differs between ${a.ref} and ${b.ref} (${changed.slice(0, 5).join(", ")}). One installed dev client cannot serve both; build each side's client and measure them separately, or pass --allow-native if those files do not reach the binary.`,
        );
    }
    const order = Array.from({ length: launches * 2 }, (_, index) => ([a, b, b, a] as const)[index % 4]!);
    if (values["dry-run"]) {
      emit(
        [
          `A ${a.ref} (${a.commit}) → ${a.checkout}${a.created ? " (new worktree)" : ""}`,
          `B ${b.ref} (${b.commit}) → ${b.checkout}${b.created ? " (new worktree)" : ""}`,
          `setup    ${config.setup ?? "none"}`,
          `server   ${config.server.command} (cwd ${config.server.cwd ?? "."}), ready at ${config.server.ready}`,
          `order    ${order.map((side) => side.label).join(" ")}, ${rounds} round(s) of ${cases.map((entry) => entry.name).join(", ")} per launch`,
        ].join("\n"),
        { a, b, order: order.map((side) => side.label) },
      );
      return 0;
    }
    if (await urlAnswers(config.server.ready, config.server.readyText))
      throw new UsageError(`Something already answers ${config.server.ready}. Stop that server first (ab serves each ref itself), or use \`run\` to measure it as is.`);
    const device = await pickDevice(config);
    const results = { A: [] as Launch[], B: [] as Launch[] };
    const skipped = { A: [] as Array<{ case: string; reason: string }>, B: [] as Array<{ case: string; reason: string }> };
    // Widened on purpose: TS would otherwise narrow the initial null through the loop and finally.
    let server = null as { side: Side; child: ChildProcess } | null;
    try {
      for (const [index, side] of order.entries()) {
        if (server?.side !== side) {
          if (server) {
            await stopServer(server.child);
            await waitUrlGone(config.server.ready);
          }
          log(`serving ${side.label} (${side.ref}) from ${side.checkout}`);
          server = { side, child: await startServer(config.server, join(side.checkout, relative)) };
        }
        log(`launch ${index + 1}/${order.length}: ${side.label}`);
        const result = await runLaunch(config, device, { cases, rounds, renders: values.renders, label: side.label, ref: side.ref });
        results[side.label].push(result.launch);
        skipped[side.label].push(...result.skipped);
      }
    } finally {
      if (server) await stopServer(server.child);
      for (const side of [a, b])
        if (side.created && !values.keep) {
          try {
            git(root, ["worktree", "remove", "--force", side.checkout]);
          } catch (error) {
            log(`could not remove ${side.checkout}: ${(error as Error).message}`);
          }
        }
    }
    const runA = runFile(config, device, a.ref, a.commit, results.A, skipped.A, cases, rounds, values.renders);
    const runB = runFile(config, device, b.ref, b.commit, results.B, skipped.B, cases, rounds, values.renders);
    const dir = outDir(projectRoot, "ab", values.out);
    writeFileSync(join(dir, "A.json"), JSON.stringify(runA, null, 2));
    writeFileSync(join(dir, "B.json"), JSON.stringify(runB, null, 2));
    const result = compareTable(runA, runB, threshold, floors);
    const skippedLines = [...runA.skipped.map((entry) => `A ${entry.case}: ${entry.reason}`), ...runB.skipped.map((entry) => `B ${entry.case}: ${entry.reason}`)];
    const report = [result.table, skippedLines.length ? `\n## Skipped\n\n${skippedLines.map((line) => `- ${line}`).join("\n")}` : ""].join("");
    writeFileSync(join(dir, "compare.md"), report);
    emit(`${report}\n\nWrote ${dir}`, { dir, ...result, skipped: { A: runA.skipped, B: runB.skipped } });
    return values.gate && result.regressed.length ? 3 : 0;
  }

  throw new UsageError(`Unknown command "${command}". Run with --help.`);
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    if (error instanceof UsageError || error instanceof ArgentError) {
      log(`error: ${error.message}`);
      process.exit(error instanceof UsageError ? 2 : 1);
    }
    log(String((error as Error).stack ?? error));
    process.exit(1);
  },
);
