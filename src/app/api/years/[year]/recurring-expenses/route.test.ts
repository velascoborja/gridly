import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("PUT captures existing template tags by label before deleting", () => {
  assert.match(source, /new Map\(existingTemplates\.map\(\(t\) => \[t\.label, t\.tagId\]\)\)/);
});

test("PUT reapplies tagId by label match when recreating templates", () => {
  assert.match(source, /tagId: tagByLabel\.get\(entry\.label\) \?\? null/);
});

test("PUT copies the template tagId into the monthly copies", () => {
  assert.match(source, /tagId: template\.tagId/);
});
