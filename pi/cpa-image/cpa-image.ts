#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const proxyUrl = "http://127.0.0.1:8317/v1";
const imageModel = "gpt-image-2.5";
const maxImageBytes = 20 * 1024 * 1024;
const maxResponseBytes = 40 * 1024 * 1024;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** Image generation options; input paths select editing and output paths never overwrite files. */
export type CpaImageOptions = {
  prompt: string;
  images?: string[];
  output?: string;
  quality?: "auto" | "low" | "medium" | "high";
  size?: "auto" | "1024x1024" | "1536x1024" | "1024x1536";
  cwd?: string;
  signal?: AbortSignal;
};

function resolveImagePath(path: string, cwd: string) {
  const clean = path.replace(/^@/, "");
  return resolve(cwd, clean.startsWith("~/") ? resolve(homedir(), clean.slice(2)) : clean);
}

function getProxyKey() {
  const key = process.env.CPA_KEY?.trim();
  if (!key) throw new Error("CPA image key missing. Start from a shell with CPA_KEY configured; do not run login or copy OAuth tokens.");
  return key;
}

function requestSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(180_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function readProxyJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    await response.body?.cancel();
    const recovery = response.status === 401 || response.status === 403
      ? "Check the proxy key/account status without logging out or refreshing credentials manually."
      : response.status === 429
        ? "Image quota is exhausted. Wait for quota to reset; do not retry repeatedly."
        : "Check the existing CPA service logs. No automatic retry was made.";
    throw new Error(`CPA image HTTP ${response.status}. ${recovery}`);
  }
  if (!response.body) throw new Error("CPA image response is empty.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxResponseBytes) {
        await reader.cancel();
        throw new Error("CPA image response exceeds the 40 MiB limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("CPA image response is not valid JSON. Check the existing CPA service logs.");
  }
}

async function callProxy(path: string, init: RequestInit, fetcher: typeof fetch) {
  try {
    return await readProxyJson(await fetcher(`${proxyUrl}${path}`, {
      ...init,
      redirect: "error",
      headers: { ...init.headers, Authorization: `Bearer ${getProxyKey()}` },
    }));
  } catch (error) {
    if (init.signal?.aborted) {
      throw new Error("CPA image request cancelled or timed out. Upstream work may still consume quota; no retry was made.");
    }
    if (error instanceof Error && error.message.startsWith("CPA image")) throw error;
    throw new Error("CPA image connection failed. Check the existing proxy with cpa-image health. No credentials were changed.");
  }
}

function getResponseData(value: unknown) {
  if (!value || typeof value !== "object" || !("data" in value) || !Array.isArray(value.data)) {
    throw new Error("CPA image response has no data array.");
  }
  const items: unknown[] = value.data;
  return items;
}

function decodeImageResult(value: unknown) {
  const items = getResponseData(value);
  const item = items[0];
  if (items.length !== 1 || !item || typeof item !== "object" || !("b64_json" in item) || typeof item.b64_json !== "string") {
    throw new Error("CPA image response must contain one base64 image. URL-only results are not downloaded.");
  }
  const base64 = item.b64_json;
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error("CPA image response contains invalid base64.");
  }
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("CPA image response is not a PNG image.");
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (!width || !height) throw new Error("CPA image response has invalid PNG dimensions.");
  return { bytes, base64, width, height };
}

async function loadInputImage(path: string) {
  const handle = await open(path, "r");
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > maxImageBytes) throw new Error("CPA image input must be a file no larger than 20 MiB.");
    const bytes = await handle.readFile();
    if (bytes.length > maxImageBytes) throw new Error("CPA image input exceeds 20 MiB.");
    const type = bytes.subarray(0, 8).equals(pngSignature) ? "image/png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg"
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp"
          : undefined;
    if (!type) throw new Error("CPA image input must be PNG, JPEG, or WebP.");
    return new Blob([new Uint8Array(bytes)], { type });
  } finally {
    await handle.close();
  }
}

/** Check advertised image models without generation, login, or credential-file access. */
export async function checkCpaImageHealth(signal?: AbortSignal, fetcher: typeof fetch = fetch) {
  const result = await callProxy("/models", { signal: requestSignal(signal) }, fetcher);
  const models = getResponseData(result).flatMap((item) =>
    item && typeof item === "object" && "id" in item && typeof item.id === "string" && item.id.startsWith("gpt-image-") ? [item.id] : [],
  );
  if (!models.includes(imageModel)) throw new Error("CPA image model gpt-image-2.5 is missing. Check which proxy binary is running.");
  return { ok: true, model: imageModel, models };
}

/** Generate or edit one PNG through CPA; preserve source files and propagate cancellation. */
export async function createCpaImage(options: CpaImageOptions, fetcher: typeof fetch = fetch) {
  options.signal?.throwIfAborted();
  getProxyKey();
  const prompt = options.prompt.trim();
  if (!prompt || prompt.length > 32_000) throw new Error("CPA image prompt must contain 1 to 32000 characters.");
  const quality = options.quality ?? "auto";
  const size = options.size ?? "auto";
  if (!["auto", "low", "medium", "high"].includes(quality)) throw new Error("CPA image quality must be auto, low, medium, or high.");
  if (!["auto", "1024x1024", "1536x1024", "1024x1536"].includes(size)) throw new Error("CPA image size is not supported. Run cpa-image --help.");
  const inputs = options.images ?? [];
  if (inputs.length > 4) throw new Error("CPA image supports up to four input images per edit.");
  const cwd = options.cwd ?? process.cwd();
  const path = resolveImagePath(options.output ?? `generated-images/${randomUUID()}.png`, cwd);
  if (!path.toLowerCase().endsWith(".png")) throw new Error("CPA image output must have a .png extension.");
  const fields = { model: imageModel, prompt, n: "1", quality, size, output_format: "png", response_format: "b64_json" };
  let body: BodyInit;
  let headers: Record<string, string> = {};
  if (inputs.length) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    for (const input of inputs) {
      const inputPath = resolveImagePath(input, cwd);
      form.append("image[]", await loadInputImage(inputPath), basename(inputPath));
    }
    body = form;
  } else {
    body = JSON.stringify({ ...fields, n: 1 });
    headers = { "Content-Type": "application/json" };
  }
  options.signal?.throwIfAborted();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  // Reserve the output before a charged request. Exclusive creation also rejects symlinks.
  const output = await open(path, "wx", 0o600).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      throw new Error("CPA image output already exists. Choose a new path; existing files are never overwritten.");
    }
    throw new Error("CPA image output cannot be created. Check directory permissions.");
  });
  let saved = false;
  try {
    const result = await callProxy(inputs.length ? "/images/edits" : "/images/generations", {
      method: "POST", body, headers, signal: requestSignal(options.signal),
    }, fetcher);
    const image = decodeImageResult(result);
    options.signal?.throwIfAborted();
    await output.writeFile(image.bytes);
    saved = true;
    return { path, model: imageModel, base64: image.base64, width: image.width, height: image.height, bytes: image.bytes.length };
  } finally {
    await output.close();
    if (!saved) await unlink(path);
  }
}

const help = `cpa-image: GPT Image 2.5 through the existing local CPA account pool

Usage:
  cpa-image health
  cpa-image generate --prompt 'Description' [--output new.png]
  cpa-image edit --image input.png [--image reference.png] --prompt 'Change' [--output new.png]

Options:
  --prompt TEXT        Image description or edit instructions
  --prompt-file PATH   Read a long prompt from UTF-8 text instead
  --image PATH         Local PNG/JPEG/WebP input, edit only, up to 4, 20 MiB each
  --output PATH        New PNG path, defaults to generated-images/<uuid>.png
  --quality VALUE      auto, low, medium, high; default auto
  --size VALUE         auto, 1024x1024, 1536x1024, 1024x1536; default auto
  --help               Show this help

Requires Node 24+ and CPA_KEY in the environment. Prints JSON, never tokens or base64.
Requests time out after 180 seconds and never retry automatically. Generation consumes quota.
Output files are private and never overwrite existing files. No OAuth files are accessed.
`;

async function runImageCli() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") { console.log(help); return; }
  const { values, positionals } = parseArgs({ args, options: {
    prompt: { type: "string" }, "prompt-file": { type: "string" }, image: { type: "string", multiple: true },
    output: { type: "string" }, quality: { type: "string" }, size: { type: "string" }, help: { type: "boolean" },
  }, strict: true, allowPositionals: true });
  if (values.help) { console.log(help); return; }
  if (positionals.length) throw new Error("CPA image unexpected arguments. Run cpa-image --help.");
  if (command === "health") {
    if (Object.keys(values).length) throw new Error("CPA image health takes no options.");
    console.log(JSON.stringify(await checkCpaImageHealth())); return;
  }
  if (command !== "generate" && command !== "edit") throw new Error("CPA image command must be health, generate, or edit.");
  if (command === "edit" && !values.image?.length) throw new Error("CPA image edit requires --image.");
  if (command === "generate" && values.image?.length) throw new Error("CPA image generate does not accept --image. Use edit instead.");
  if (values.prompt && values["prompt-file"]) throw new Error("CPA image use either --prompt or --prompt-file, not both.");
  const prompt = values["prompt-file"] ? await readFile(resolveImagePath(values["prompt-file"], process.cwd()), "utf8") : values.prompt;
  if (!prompt) throw new Error("CPA image requires --prompt or --prompt-file.");
  const quality = values.quality ?? "auto";
  if (quality !== "auto" && quality !== "low" && quality !== "medium" && quality !== "high") throw new Error("CPA image invalid --quality. Run cpa-image --help.");
  const size = values.size ?? "auto";
  if (size !== "auto" && size !== "1024x1024" && size !== "1536x1024" && size !== "1024x1536") throw new Error("CPA image invalid --size. Run cpa-image --help.");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const { base64: _base64, ...result } = await createCpaImage({ prompt, images: values.image, output: values.output, quality, size, signal: controller.signal });
    console.log(JSON.stringify(result));
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runImageCli().catch((error: unknown) => {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : "CPA image request failed." }));
    process.exitCode = 1;
  });
}
