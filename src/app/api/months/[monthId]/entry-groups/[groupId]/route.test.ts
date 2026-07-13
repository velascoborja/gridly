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

test("entry-groups PATCH route can move a full group to another month in the same year", () => {
  assert.match(source, /body\.monthId !== undefined/);
  assert.match(source, /const targetMonthId = parseInt\(String\(body\.monthId\), 10\)/);
  assert.match(source, /ownedTargetMonth\.yearId !== month\.yearId/);
  assert.match(source, /groupUpdate\.monthId = ownedTargetMonth\.id/);
  assert.match(source, /set\(\{ monthId: targetMonth\.id \}\)/);
});

test("entry-groups PATCH route only accepts a tag owned by the authenticated user", () => {
  assert.match(source, /eq\(tags\.id, validatedTagId\)/);
  assert.match(source, /eq\(tags\.userId, user\.id\)/);
  assert.match(source, /ownedTag\.length === 0/);
});
