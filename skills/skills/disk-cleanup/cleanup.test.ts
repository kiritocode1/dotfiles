import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { findArtifacts, plan, protectedInside, protectedReason, runningCwds } from "./cleanup.ts";

const home = realpathSync(mkdtempSync(join(tmpdir(), "cleanup-test-")));
after(() => rmSync(home, { recursive: true, force: true }));

test("browser profiles are protected except their cache folders", () => {
  const chrome = join(home, "Library/Application Support/Google/Chrome");
  assert.match(protectedReason(join(chrome, "Default/Login Data"), home) ?? "", /inside/);
  assert.match(protectedReason(join(chrome, "Default/Cookies"), home) ?? "", /inside/);
  assert.match(protectedReason(chrome, home) ?? "", /inside/);
  assert.equal(protectedReason(join(chrome, "Default/Code Cache"), home), null);
  assert.equal(protectedReason(join(home, "Library/Application Support/net.imput.helium/Default/GPUCache"), home), null);
});

test("ancestors of protected folders, secrets and paths outside home are refused", () => {
  assert.match(protectedReason(join(home, "Library"), home) ?? "", /contains ~\/Library\/Keychains/);
  assert.match(protectedReason(home, home) ?? "", /contains/);
  assert.match(protectedReason(join(home, "Downloads/deploy.pem"), home) ?? "", /key, secret/);
  assert.match(protectedReason(join(home, "app/.env.local"), home) ?? "", /key, secret/);
  assert.match(protectedReason("/etc", home) ?? "", /outside/);
  assert.equal(protectedReason("/Applications/Foo.app", home), null);
  assert.equal(protectedReason(join(home, "Downloads/photo.jpg"), home), null);
});

test("a folder holding a key is found, node_modules is not searched", () => {
  const dl = join(home, "Downloads");
  mkdirSync(join(dl, "node_modules/pkg"), { recursive: true });
  writeFileSync(join(dl, "node_modules/pkg/test.pem"), "");
  assert.deepEqual(protectedInside(dl), []);
  writeFileSync(join(dl, "ca-bundle.pem"), "-----BEGIN CERTIFICATE-----\n");
  assert.deepEqual(protectedInside(dl), [], "a public certificate is not a secret");
  writeFileSync(join(dl, "server.pem"), "-----BEGIN RSA PRIVATE KEY-----\n");
  assert.deepEqual(protectedInside(dl), [join(dl, "server.pem")]);
});

test("artifacts are found without descending into them, and busy projects are skipped", async () => {
  const root = join(home, "CREATE");
  for (const d of ["idle/node_modules/x/node_modules", "idle/apps/web/.next", "busy/node_modules", "idle/build", "idle/.git/node_modules"]) {
    mkdirSync(join(root, d), { recursive: true });
  }
  const found = findArtifacts([root], ["node_modules", ".next"], 6);
  assert.deepEqual(found, [join(root, "busy/node_modules"), join(root, "idle/apps/web/.next"), join(root, "idle/node_modules")]);

  const sleeper = spawn("sleep", ["30"], { cwd: join(root, "busy"), stdio: "ignore" });
  try {
    await new Promise((r) => setTimeout(r, 300));
    const cwds = runningCwds();
    assert.ok(cwds.includes(join(root, "busy")), "lsof sees the sleeping process");
    const { del, skipped } = plan(found, [root], cwds, home);
    assert.deepEqual(del, [join(root, "idle/apps/web/.next"), join(root, "idle/node_modules")]);
    assert.equal(skipped.length, 1);
    assert.match(skipped[0]?.reason ?? "", /process is running/);
  } finally {
    sleeper.kill();
  }
});
