import assert from "node:assert/strict";
import { test, before, after, type TestContext } from "node:test";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkCpaImageHealth, createCpaImage } from "./cpa-image.ts";

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1kAAAAASUVORK5CYII=";
const oldKey = process.env.CPA_KEY;
before(() => { process.env.CPA_KEY = "unit-test-proxy-key"; });
after(() => {
  if (oldKey === undefined) delete process.env.CPA_KEY;
  else process.env.CPA_KEY = oldKey;
});

async function workspace(t: TestContext) {
  const cwd = await mkdtemp(join(tmpdir(), "cpa-image-test-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

function imageResponse() { return Response.json({ data: [{ b64_json: png }] }); }

test("generation uses CPA key and fixed model, saves a private PNG", async (t) => {
  const cwd = await workspace(t);
  let calls = 0;
  const result = await createCpaImage({ prompt: "A circle", output: "new.png", cwd }, async (url, init) => {
    calls++;
    assert.equal(url, "http://127.0.0.1:8317/v1/images/generations");
    assert.equal(init?.redirect, "error");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer unit-test-proxy-key");
    assert.equal(typeof init?.body, "string");
    if (typeof init?.body !== "string") throw new Error("Expected JSON body");
    assert.deepEqual(JSON.parse(init.body), {
      model: "gpt-image-2.5", prompt: "A circle", n: 1, quality: "auto", size: "auto", output_format: "png", response_format: "b64_json",
    });
    return imageResponse();
  });
  assert.equal(calls, 1);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.equal((await readFile(result.path)).toString("base64"), png);
  assert.equal((await stat(result.path)).mode & 0o777, 0o600);
});

test("editing sends multipart image bytes and leaves the source unchanged", async (t) => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, "input.png"), Buffer.from(png, "base64"));
  await createCpaImage({ prompt: "Make orange", images: ["@input.png"], output: "edited.png", cwd }, async (url, init) => {
    assert.equal(url, "http://127.0.0.1:8317/v1/images/edits");
    assert.ok(init?.body instanceof FormData);
    assert.equal(new Headers(init.headers).get("Content-Type"), null);
    assert.equal(init.body.get("model"), "gpt-image-2.5");
    const file = init.body.get("image[]");
    assert.ok(file instanceof Blob);
    assert.equal(file.type, "image/png");
    assert.equal(Buffer.from(await file.arrayBuffer()).toString("base64"), png);
    return imageResponse();
  });
  assert.equal((await readFile(join(cwd, "input.png"))).toString("base64"), png);
});

test("existing output fails before a charged request", async (t) => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, "existing.png"), "preserve me");
  await assert.rejects(createCpaImage({ prompt: "circle", output: "existing.png", cwd }, async () => {
    assert.fail("Must not call upstream for an existing output");
  }), /already exists/);
  assert.equal(await readFile(join(cwd, "existing.png"), "utf8"), "preserve me");
});

test("authentication errors omit sensitive upstream bodies and clean reserved output", async (t) => {
  const cwd = await workspace(t);
  let calls = 0;
  await assert.rejects(createCpaImage({ prompt: "circle", output: "new.png", cwd }, async () => {
    calls++;
    return new Response("secret-token account@example.com", { status: 401 });
  }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /HTTP 401/);
    assert.doesNotMatch(error.message, /secret-token|account@example/);
    return true;
  });
  assert.equal(calls, 1);
  assert.deepEqual(await readdir(cwd), []);
});

test("malformed/URL-only/non-image responses cannot create successful outputs", async (t) => {
  const cwd = await workspace(t);
  for (const data of [{}, { data: [{ url: "https://example.com/image.png" }] }, { data: [{ b64_json: "@@@@" }] }, { data: [{ b64_json: "aGVsbG8=" }] }]) {
    await assert.rejects(createCpaImage({ prompt: "circle", output: "new.png", cwd }, async () => Response.json(data)), /CPA image response/);
    assert.deepEqual(await readdir(cwd), []);
  }
});

test("cancellation reaches fetch and cleans the reserved output", async (t) => {
  const cwd = await workspace(t);
  const controller = new AbortController();
  await assert.rejects(createCpaImage({ prompt: "circle", output: "new.png", cwd, signal: controller.signal }, async (_url, init) => {
    controller.abort();
    assert.equal(init?.signal?.aborted, true);
    throw new DOMException("Aborted", "AbortError");
  }), /cancelled or timed out/);
  assert.deepEqual(await readdir(cwd), []);
});

test("invalid input image fails before network or output creation", async (t) => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, "bad.png"), "not an image");
  await assert.rejects(createCpaImage({ prompt: "circle", images: ["bad.png"], output: "new.png", cwd }, async () => {
    assert.fail("Must not upload invalid input");
  }), /PNG, JPEG, or WebP/);
  assert.deepEqual(await readdir(cwd), ["bad.png"]);
});

test("health reads models without generating an image", async () => {
  const result = await checkCpaImageHealth(undefined, async (url, init) => {
    assert.equal(url, "http://127.0.0.1:8317/v1/models");
    assert.equal(init?.body, undefined);
    return Response.json({ data: [{ id: "gpt-image-2.5" }, { id: "gpt-6-astra" }] });
  });
  assert.deepEqual(result.models, ["gpt-image-2.5"]);
});
