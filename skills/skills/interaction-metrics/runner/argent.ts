// Thin adapter over the `argent run` CLI: one process per tool call, JSON in and out.
import { execFile } from "node:child_process";

export class ArgentError extends Error {
  readonly tool: string;
  constructor(tool: string, message: string) {
    super(`argent ${tool}: ${message}`);
    this.tool = tool;
  }
}

export type Platform = "chromium" | "ios" | "android";

export interface Device {
  readonly id: string;
  readonly platform: Platform;
  readonly name: string;
}

export function call(tool: string, args: Record<string, unknown>, timeoutMs = 60_000) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    execFile(
      "argent",
      ["run", tool, "--args", JSON.stringify(args), "--json"],
      { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const detail = (stderr || stdout || error.message).trim().split("\n").slice(0, 6).join(" ");
          reject(new ArgentError(tool, detail));
          return;
        }
        try {
          resolve(JSON.parse(stdout) as Record<string, unknown>);
        } catch {
          reject(new ArgentError(tool, `unreadable output: ${stdout.slice(0, 200)}`));
        }
      },
    );
  });
}

export async function listDevices() {
  const result = await call("list-devices", {});
  const devices = (result.devices ?? []) as ReadonlyArray<Record<string, unknown>>;
  return devices.flatMap((entry): Device[] => {
    const platform = entry.platform as string;
    const ready =
      (platform === "chromium" && entry.state === "Running") ||
      (platform === "ios" && entry.state === "Booted") ||
      (platform === "android" && entry.state === "device");
    const id = (entry.udid ?? entry.serial ?? entry.id) as string | undefined;
    if (!ready || !id || (platform !== "chromium" && platform !== "ios" && platform !== "android")) return [];
    return [{ id, platform, name: String(entry.name ?? entry.title ?? id) }];
  });
}

/** Evaluates `expression` in the app's JS runtime and returns its value. */
export async function evaluate(device: Device, expression: string) {
  const result = await call("debugger-evaluate", { device_id: device.id, expression });
  return result.result;
}

/** Evaluates an expression that returns a JSON string, as the probe's methods do. */
export async function evaluateJson<T>(device: Device, expression: string) {
  const value = await evaluate(device, expression);
  if (typeof value !== "string") throw new ArgentError("debugger-evaluate", `${expression} returned ${typeof value}, not a JSON string`);
  return JSON.parse(value) as T;
}

export interface UiNode {
  readonly role: string;
  readonly texts: ReadonlyArray<string>;
  readonly id: string | null;
  readonly clickable: boolean;
  readonly frame: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
}

/**
 * Parses `describe`'s text tree. Each element line ends in a normalized `(x,y,w,h)` frame and
 * carries its label or value in quotes, optionally keyed (`value="Orders"`, `id="submit"`).
 */
export function parseDescribe(description: string): UiNode[] {
  const nodes: UiNode[] = [];
  for (const line of description.split("\n")) {
    const frame = line.match(/\((-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)\)\s*$/);
    if (!frame) continue;
    const body = line.slice(0, frame.index).trim();
    const role = body.split(/\s+/)[0] ?? "";
    const texts: string[] = [];
    let id: string | null = null;
    for (const match of body.matchAll(/(?:([\w-]+)=)?"((?:[^"\\]|\\.)*)"/g)) {
      const [, key, value] = match;
      if (key === "id" || key === "identifier" || key === "testID" || key === "resource-id") id = value!;
      else texts.push(value!);
    }
    nodes.push({
      role,
      texts,
      id,
      clickable: /\[[^\]]*(clickable|button|enabled)[^\]]*\]/i.test(body),
      frame: { x: Number(frame[1]), y: Number(frame[2]), w: Number(frame[3]), h: Number(frame[4]) },
    });
  }
  return nodes;
}

export interface Selector {
  /** Exact label or value, or its start (a row "Orders, 3 new" matches "Orders"). */
  readonly label?: string;
  /** Substring of a label or value. */
  readonly text?: string;
  /** testID, accessibilityIdentifier, resource-id or DOM id. */
  readonly id?: string;
  /** Substring of the role, e.g. "button" or "input". */
  readonly role?: string;
}

export function describeSelector(selector: Selector) {
  return Object.entries(selector)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(" ");
}

/** The best on-screen match: exact label over prefix, clickable over not, innermost last. */
export function findNode(nodes: ReadonlyArray<UiNode>, selector: Selector) {
  const visible = nodes.filter((node) => node.frame.w > 0 && node.frame.h > 0);
  const scored = visible.flatMap((node) => {
    if (selector.role && !node.role.toLowerCase().includes(selector.role.toLowerCase())) return [];
    if (selector.id && node.id !== selector.id) return [];
    let score = 1;
    if (selector.label) {
      if (node.texts.includes(selector.label)) score = 3;
      else if (node.texts.some((text) => text.startsWith(selector.label!))) score = 2;
      else return [];
    }
    if (selector.text && !node.texts.some((text) => text.toLowerCase().includes(selector.text!.toLowerCase()))) return [];
    return [{ node, score: score + (node.clickable ? 0.5 : 0), area: node.frame.w * node.frame.h }];
  });
  scored.sort((a, b) => b.score - a.score || a.area - b.area);
  return scored[0]?.node ?? null;
}

export async function describe(device: Device) {
  const result = await call("describe", { udid: device.id });
  return parseDescribe(String(result.description ?? ""));
}

export const center = (node: UiNode) => ({
  x: Math.round((node.frame.x + node.frame.w / 2) * 1000) / 1000,
  y: Math.round((node.frame.y + node.frame.h / 2) * 1000) / 1000,
});
