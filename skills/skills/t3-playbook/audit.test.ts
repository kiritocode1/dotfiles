import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { audit, checkFile, isScreenFile } from "./audit.ts";

const rules = (rel: string, text: string) => checkFile(rel, text).map((f) => f.rule);

test("screens are route and feature files, not layouts, platform splits or chrome", () => {
  assert.equal(isScreenFile("src/app/leave.tsx"), true);
  assert.equal(isScreenFile("src/features/threads/ThreadFeed.tsx"), true);
  assert.equal(isScreenFile("src/app/_layout.tsx"), false);
  assert.equal(isScreenFile("src/features/threads/Composer.ios.tsx"), false);
  assert.equal(isScreenFile("src/components/ui/picker/index.tsx"), false);
  assert.equal(isScreenFile("src/features/layout/Shell.tsx"), false);
  assert.equal(isScreenFile("src/api/client.ts"), false);
});

test("platform and size checks count only in screens", () => {
  const line = "if (Platform.OS === 'android') open();";
  assert.deepEqual(rules("src/app/leave.tsx", line), ["screen-branches"]);
  assert.deepEqual(rules("src/components/ui/date.tsx", line), []);
  assert.deepEqual(rules("src/app/a.tsx", "const { width } = useWindowDimensions();"), ["screen-branches"]);
  assert.deepEqual(rules("src/app/a.tsx", "// Platform.OS is checked in the shell"), []);
});

test("navigate is flagged except in custom tab bars", () => {
  assert.deepEqual(rules("src/app/list.tsx", "navigation.navigate('Thread', { id })"), ["navigate"]);
  assert.deepEqual(rules("src/components/ui/swipe-tabs.tsx", "navigation.navigate(name)"), []);
  assert.deepEqual(rules("src/app/_layout.tsx", "<Tabs tabBar={(p) => <Bar {...p} />} />\nnavigation.navigate(route.name)"), []);
});

test("memoization and Reanimated loops are flagged anywhere", () => {
  assert.deepEqual(rules("src/hooks/x.ts", "const v = useMemo(() => a, [a]);"), ["manual-memo"]);
  assert.deepEqual(rules("src/hooks/x.ts", "export default React.memo(Row);"), ["manual-memo"]);
  assert.deepEqual(rules("src/components/ui/skeleton.tsx", "opacity.value = withRepeat(t, -1);"), ["reanimated-loop"]);
});

const dir = mkdtempSync(join(tmpdir(), "t3-audit-"));
after(() => rmSync(dir, { recursive: true, force: true }));

test("audit reads the compiler setting and skips native folders and tests", () => {
  writeFileSync(join(dir, "package.json"), "{}");
  writeFileSync(join(dir, "app.json"), JSON.stringify({ expo: { experiments: { reactCompiler: true } } }));
  for (const d of ["src/app", "ios/Pods", "node_modules/x"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "src/app/home.tsx"), "const w = useWindowDimensions();");
  writeFileSync(join(dir, "src/app/home.test.tsx"), "const w = useWindowDimensions();");
  writeFileSync(join(dir, "ios/Pods/a.ts"), "useMemo(() => 1, []);");
  writeFileSync(join(dir, "node_modules/x/a.ts"), "useMemo(() => 1, []);");
  const r = audit(dir);
  assert.equal(r.compiler, "app.json");
  assert.equal(r.files, 1);
  assert.deepEqual(r.findings.map((f) => `${f.rule} ${f.file}:${f.line}`), ["screen-branches src/app/home.tsx:1"]);
});
