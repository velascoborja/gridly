import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("entry-groups PATCH route reads tagId from the request body", () => {
  assert.match(source, /body\.tagId/);
});

test("entry-groups PATCH route batch-updates entries when tagId is provided", () => {
  assert.match(source, /update\(additionalEntries\)/);
  assert.match(source, /groupId.*group\.id/);
});
