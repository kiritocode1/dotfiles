// The pure half of the runner: one probe window to one step's metrics, runs to series, and how
// two series compare. Ported from T3 Code's scripts/metrics/{core,mobile}/report.ts.

/** What the probe's `stop()` returns. */
export interface ProbeWindow {
  readonly startedAt: number;
  readonly inputs: ReadonlyArray<{ readonly kind: string; readonly at: number }>;
  readonly commits: ReadonlyArray<{ readonly at: number; readonly ms: number }>;
  readonly marks: ReadonlyArray<{
    readonly id: string;
    readonly at: number;
    readonly frameAt: number | null;
    readonly first: boolean;
  }>;
  readonly keys: ReadonlyArray<number>;
  readonly js: ReadonlyArray<number>;
  readonly ui: ReadonlyArray<number>;
  readonly renders: ReadonlyArray<{ readonly name: string; readonly count: number }> | null;
  readonly heapMB: number | null;
}

export type Visit = "first" | "revisit" | "step";

export interface Step {
  readonly case: string;
  readonly visit: Visit;
  readonly round: number;
  /** Input end to the frame after the commit that mounted the case's `until` mark. */
  readonly contentMs: number | null;
  /** Input end to the last React commit before the app went quiet. */
  readonly settledMs: number | null;
  readonly commits: number;
  /** Render time React measured in those commits; development builds only. */
  readonly commitMs: number;
  readonly jsDroppedPct: number | null;
  readonly jsMaxFrameMs: number | null;
  readonly uiDroppedPct: number | null;
  readonly uiMaxFrameMs: number | null;
  readonly keyP50Ms: number | null;
  readonly keyP90Ms: number | null;
  readonly renders: number | null;
  readonly topRenders: ReadonlyArray<{ readonly name: string; readonly count: number }>;
  readonly heapMB: number | null;
}

/** One app launch: every case once per round. A launch's median per metric is one sample. */
export interface Launch {
  readonly label: string;
  readonly ref: string;
  readonly steps: ReadonlyArray<Step>;
  readonly memoryMB: number | null;
}

export interface RunFile {
  readonly tool: "interaction-metrics";
  readonly version: 1;
  readonly ref: string;
  readonly commit: string | null;
  readonly platform: string;
  readonly device: string;
  readonly build: "dev" | "release";
  readonly workload: { readonly cases: ReadonlyArray<string>; readonly rounds: number; readonly renders: boolean };
  readonly network: "live" | "fixture";
  readonly launches: ReadonlyArray<Launch>;
  readonly skipped: ReadonlyArray<{ readonly case: string; readonly reason: string }>;
}

export const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

const sorted = (values: ReadonlyArray<number>) => [...values].sort((a, b) => a - b);

/** Nearest-rank percentile, so p90 of few samples is a value that was measured. */
export function percentile(values: ReadonlyArray<number>, p: number) {
  if (values.length === 0) return null;
  const ordered = sorted(values);
  return ordered[Math.min(ordered.length - 1, Math.max(0, Math.ceil((p / 100) * ordered.length) - 1))]!;
}

export function median(values: ReadonlyArray<number>) {
  if (values.length === 0) return null;
  const ordered = sorted(values);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle]! : (ordered[middle - 1]! + ordered[middle]!) / 2;
}

/** Dropped frames against the display's refresh, guessed from the fastest gaps when not given. */
export function frameStats(timestamps: ReadonlyArray<number>, refreshMs?: number) {
  const gaps = timestamps.slice(1).map((time, index) => time - timestamps[index]!);
  if (gaps.length < 10) return { droppedPct: null, maxMs: null };
  const refresh = refreshMs ?? ((percentile(gaps, 5) ?? 16) < 12 ? 1000 / 120 : 1000 / 60);
  const dropped = gaps.reduce((total, gap) => total + Math.max(0, Math.round(gap / refresh) - 1), 0);
  return {
    droppedPct: round((100 * dropped) / (gaps.length + dropped)),
    maxMs: round(Math.max(...gaps)),
  };
}

/**
 * Where latency counts from: the first press's end (a tap's release), else its start. A window
 * with keys counts from the first key, and a scroll window from the first wheel event.
 */
export function inputAt(window: Pick<ProbeWindow, "inputs">) {
  const first = (kinds: ReadonlyArray<string>) => window.inputs.find((input) => kinds.includes(input.kind))?.at;
  return first(["key"]) ?? first(["press-end", "press-cancel"]) ?? first(["press-start", "wheel"]) ?? null;
}

/** One step's metrics from its window; commits before the input are the runner's own calls. */
export function stepOf(
  window: ProbeWindow,
  step: { readonly case: string; readonly round: number; readonly until: string | null },
): Step {
  const from = inputAt(window);
  const start = from ?? window.startedAt;
  // Frames count from the first touch of any kind, so a whole swipe is inside the window.
  const framesFrom = window.inputs[0]?.at ?? start;
  const commits = window.commits.filter((commit) => commit.at >= start);
  const shown = step.until
    ? window.marks.find((mark) => mark.id === step.until && mark.at >= start && mark.frameAt !== null)
    : undefined;
  const since = (at: number | null | undefined) =>
    from === null || at === null || at === undefined ? null : round(Math.max(0, at - from), 0);
  const js = frameStats(window.js.filter((at) => at >= framesFrom));
  const ui = frameStats(window.ui.filter((at) => at >= framesFrom));
  // A mark that stays mounted (a kept-alive tab) does not fire again, so its revisit has no
  // contentMs; the runner warns separately when a mark never mounts at all.
  const visit: Visit = step.until ? (shown?.first ? "first" : "revisit") : "step";
  return {
    case: step.case,
    visit,
    round: step.round,
    contentMs: since(shown?.frameAt),
    settledMs: since(commits.at(-1)?.at),
    commits: commits.length,
    commitMs: round(commits.reduce((sum, commit) => sum + commit.ms, 0), 0),
    jsDroppedPct: js.droppedPct,
    jsMaxFrameMs: js.maxMs,
    uiDroppedPct: ui.droppedPct,
    uiMaxFrameMs: ui.maxMs,
    keyP50Ms: window.keys.length ? round(median(window.keys)!, 1) : null,
    keyP90Ms: window.keys.length ? round(percentile(window.keys, 90)!, 1) : null,
    renders: window.renders ? window.renders.reduce((sum, entry) => sum + entry.count, 0) : null,
    topRenders: window.renders?.slice(0, 8) ?? [],
    heapMB: window.heapMB,
  };
}

const NUMERIC = [
  "contentMs",
  "settledMs",
  "commits",
  "commitMs",
  "jsDroppedPct",
  "jsMaxFrameMs",
  "uiDroppedPct",
  "uiMaxFrameMs",
  "keyP50Ms",
  "keyP90Ms",
  "renders",
] as const satisfies ReadonlyArray<keyof Step>;

/** Metric name to one value per launch (the launch's median), the independent samples. */
export function flatten(run: Pick<RunFile, "launches">) {
  const values = new Map<string, number[]>();
  for (const launch of run.launches) {
    const inLaunch = new Map<string, number[]>();
    const add = (key: string, value: number | null) => {
      if (value === null || !Number.isFinite(value)) return;
      inLaunch.set(key, [...(inLaunch.get(key) ?? []), value]);
    };
    for (const step of launch.steps) {
      const key = step.visit === "step" ? step.case : `${step.case}.${step.visit}`;
      for (const field of NUMERIC) add(`${key}.${field}`, step[field]);
    }
    add("memory.heapMB", launch.memoryMB);
    for (const [key, samples] of inLaunch) values.set(key, [...(values.get(key) ?? []), median(samples)!]);
  }
  return values;
}

/** 95% bootstrap interval of median(b) - median(a), with a fixed seed so reruns agree. */
export function bootstrapMedianDifference(a: ReadonlyArray<number>, b: ReadonlyArray<number>) {
  let seed = 0x5eed;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const resample = (values: ReadonlyArray<number>) =>
    median(Array.from(values, () => values[Math.floor(random() * values.length)]!))!;
  const differences = sorted(Array.from({ length: 2_000 }, () => resample(b) - resample(a)));
  return [differences[49]!, differences[1_949]!] as const;
}

export interface Floors {
  readonly platform: string;
  readonly floors: Readonly<Record<string, { readonly floor: number; readonly gate: boolean }>>;
}

/** The absolute change a metric must clear, past the relative threshold, to count. */
export function floorFor(metric: string) {
  if (metric.endsWith("Ms")) return 8;
  if (metric.endsWith("DroppedPct")) return 5;
  if (metric.endsWith("heapMB")) return 3;
  // Counts barely move between runs of one commit, so small changes are real.
  if (metric.endsWith(".renders")) return 5;
  if (metric.endsWith(".commits")) return 1;
  return 0;
}

export type Verdict = "worse" | "better" | "noisy" | "";

/**
 * A metric counts when the bootstrap interval of its median change clears both the relative
 * threshold and its floor: the calibrated one from `noise` when given, else the default.
 */
export function compareSeries(
  a: ReadonlyMap<string, ReadonlyArray<number>>,
  b: ReadonlyMap<string, ReadonlyArray<number>>,
  threshold = 10,
  floors?: Floors,
) {
  const rows: Array<{
    metric: string;
    before: number | null;
    after: number | null;
    changePct: number | null;
    interval: readonly [number, number] | null;
    verdict: Verdict;
    note: string;
  }> = [];
  for (const metric of [...new Set([...a.keys(), ...b.keys()])].sort()) {
    const x = a.get(metric);
    const y = b.get(metric);
    if (!x || !y) {
      rows.push({
        metric,
        before: x ? median(x) : null,
        after: y ? median(y) : null,
        changePct: null,
        interval: null,
        verdict: "",
        note: "only one side",
      });
      continue;
    }
    const calibrated = floors?.floors[metric];
    const mx = median(x)!;
    const my = median(y)!;
    const limit = Math.max(calibrated?.floor ?? floorFor(metric), (Math.abs(mx) * threshold) / 100);
    // Launches are the independent samples; with one a side there is no interval to gate on.
    const repeated = x.length > 1 && y.length > 1;
    const [low, high] = repeated ? bootstrapMedianDifference(x, y) : [my - mx, my - mx];
    const moved = low > limit ? "worse" : high < -limit ? "better" : "";
    const gated = repeated && (calibrated?.gate ?? true);
    rows.push({
      metric,
      before: round(mx, 1),
      after: round(my, 1),
      changePct: mx === 0 ? null : round(((my - mx) / Math.abs(mx)) * 100, 0),
      interval: repeated ? [round(low, 1), round(high, 1)] : null,
      verdict: moved && !gated ? "noisy" : moved,
      note: moved && !gated ? (repeated ? `${moved}, too noisy to gate` : `${moved}, one launch a side`) : "",
    });
  }
  return {
    rows,
    regressed: rows.filter((row) => row.verdict === "worse").map((row) => row.metric),
    improved: rows.filter((row) => row.verdict === "better").map((row) => row.metric),
    noisy: rows.filter((row) => row.verdict === "noisy").map((row) => row.metric),
  };
}

/** Two significant digits, rounded up, so a derived floor never sits under what was seen. */
const ceilSignificant = (value: number) => {
  if (value <= 0) return 0;
  const step = 10 ** (Math.floor(Math.log10(value)) - 1);
  return round(Math.ceil(value / step) * step, 6);
};

/** An A/A interval wider than this share of a metric's median makes it too noisy to gate on. */
export const NOISY_SHARE = 0.5;

/**
 * Floors from A/A pairs (one commit against itself): half the widest interval or the largest A/A
 * median difference, whichever is larger.
 */
export function noiseOfSeries(
  pairs: ReadonlyArray<readonly [ReadonlyMap<string, ReadonlyArray<number>>, ReadonlyMap<string, ReadonlyArray<number>>]>,
  platform: string,
) {
  const found = new Map<string, { medians: number[]; halfWidth: number; aaDifference: number }>();
  for (const [a, b] of pairs) {
    for (const [metric, x] of a) {
      const y = b.get(metric);
      if (!y) continue;
      const difference = median(y)! - median(x)!;
      const [low, high] = x.length > 1 && y.length > 1 ? bootstrapMedianDifference(x, y) : [difference, difference];
      const entry = found.get(metric) ?? { medians: [], halfWidth: 0, aaDifference: 0 };
      entry.medians.push(median([...x, ...y])!);
      entry.halfWidth = Math.max(entry.halfWidth, (high - low) / 2);
      entry.aaDifference = Math.max(entry.aaDifference, Math.abs(difference));
      found.set(metric, entry);
    }
  }
  const rows = [...found.entries()]
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([metric, entry]) => {
      const middle = median(entry.medians)!;
      return {
        metric,
        median: round(middle, 2),
        halfWidth: round(entry.halfWidth, 2),
        aaDifference: round(entry.aaDifference, 2),
        defaultFloor: floorFor(metric),
        floor: ceilSignificant(Math.max(entry.halfWidth / 2, entry.aaDifference)),
        gate: entry.halfWidth === 0 || entry.halfWidth <= Math.abs(middle) * NOISY_SHARE,
      };
    });
  const floors: Floors = {
    platform,
    floors: Object.fromEntries(rows.map((row) => [row.metric, { floor: row.floor, gate: row.gate }])),
  };
  return { rows, floors };
}

/** Settings that change what a metric means; `compare` refuses files that differ in them. */
export function workloadDifferences(a: RunFile, b: RunFile) {
  const differences: string[] = [];
  if (a.platform !== b.platform) differences.push(`platform ${a.platform} vs ${b.platform}`);
  if (a.build !== b.build) differences.push(`build ${a.build} vs ${b.build}`);
  if (a.workload.rounds !== b.workload.rounds) differences.push(`rounds ${a.workload.rounds} vs ${b.workload.rounds}`);
  if (a.workload.renders !== b.workload.renders) differences.push("one side counted renders, which slows commits");
  if (a.workload.cases.join() !== b.workload.cases.join()) differences.push("different cases");
  return differences;
}
