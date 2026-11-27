import assert from "node:assert/strict";
import { test } from "node:test";

import { compareSeries, frameStats, noiseOfSeries, stepOf, type ProbeWindow } from "./stats.ts";

const window = (overrides: Partial<ProbeWindow>): ProbeWindow => ({
  startedAt: 0,
  inputs: [],
  commits: [],
  marks: [],
  keys: [],
  js: [],
  ui: [],
  renders: null,
  heapMB: null,
  ...overrides,
});

test("latency counts from the press's end, and commits before it are the runner's", () => {
  const step = stepOf(
    window({
      inputs: [
        { kind: "press-start", at: 100 },
        { kind: "press-end", at: 180 },
      ],
      commits: [
        { at: 50, ms: 3 },
        { at: 200, ms: 4 },
        { at: 260, ms: 5 },
      ],
      marks: [{ id: "screen:orders", at: 240, frameAt: 250, first: true }],
    }),
    { case: "open-orders", round: 0, until: "screen:orders" },
  );
  assert.equal(step.contentMs, 70);
  assert.equal(step.settledMs, 80);
  assert.equal(step.commits, 2);
  assert.equal(step.commitMs, 9);
  assert.equal(step.visit, "first");
});

test("a mark mounted before the input does not count as this step's content", () => {
  const step = stepOf(
    window({
      inputs: [{ kind: "press-end", at: 100 }],
      marks: [{ id: "screen:orders", at: 90, frameAt: 95, first: false }],
    }),
    { case: "open-orders", round: 0, until: "screen:orders" },
  );
  assert.equal(step.contentMs, null);
  assert.equal(step.visit, "revisit");
});

test("a 50 ms gap at 60 Hz drops two frames", () => {
  const frames = Array.from({ length: 20 }, (_, index) => index * (1000 / 60));
  frames.push(frames.at(-1)! + 50);
  const stats = frameStats(frames);
  assert.equal(stats.maxMs, 50);
  assert.equal(stats.droppedPct, round1((100 * 2) / (20 + 2)));
});

const round1 = (value: number) => Math.round(value * 10) / 10;

test("compare flags a 60 ms regression and ignores jitter inside the floor", () => {
  const a = new Map([
    ["open.contentMs", [120, 124, 118, 122]],
    ["open.commits", [3, 3, 3, 3]],
  ]);
  const b = new Map([
    ["open.contentMs", [181, 185, 179, 184]],
    ["open.commits", [3, 3, 4, 3]],
  ]);
  const result = compareSeries(a, b);
  assert.deepEqual(result.regressed, ["open.contentMs"]);
  assert.deepEqual(result.improved, []);
});

test("one launch a side is never gated", () => {
  const result = compareSeries(new Map([["open.contentMs", [100]]]), new Map([["open.contentMs", [300]]]));
  assert.deepEqual(result.regressed, []);
  assert.deepEqual(result.noisy, ["open.contentMs"]);
});

test("an A/A pair that spreads wider than half its median is marked too noisy to gate", () => {
  const { floors } = noiseOfSeries(
    [
      [new Map([["x.settledMs", [20, 90, 30]]]), new Map([["x.settledMs", [80, 25, 95]]])],
      [new Map([["y.contentMs", [200, 202, 201]]]), new Map([["y.contentMs", [201, 203, 200]]])],
    ],
    "chromium",
  );
  assert.equal(floors.floors["x.settledMs"]!.gate, false);
  assert.equal(floors.floors["y.contentMs"]!.gate, true);
});
