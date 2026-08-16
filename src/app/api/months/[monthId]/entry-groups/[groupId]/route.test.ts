import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const deleteStart = source.indexOf("export async function DELETE");
const patchSource = source.slice(0, deleteStart);
const deleteSource = source.slice(deleteStart);

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

test("entry-groups route only lets completed groups reopen", () => {
  assert.match(source, /isCompletionOnlyRequest\(body, group\.isCompleted\)/);
  assert.match(source, /groupUpdate\.isCompleted = body\.isCompleted/);
  assert.match(source, /if \(group\.isCompleted\)/);
  assert.match(source, /status: 409/);
});

test("entry-groups PATCH only propagates carry-over for an actual month move", () => {
  assert.equal((patchSource.match(/affectsCarryOver =/g) ?? []).length, 2);
  assert.match(patchSource, /let affectsCarryOver = false/);
  assert.match(
    patchSource,
    /affectsCarryOver = ownedTargetMonth\.id !== month\.id/,
  );
  assert.match(
    patchSource,
    /if \(affectsCarryOver\) \{[\s\S]*propagateYearCarryOver/,
  );
});

test("entry-groups DELETE keeps carry-over propagation", () => {
  assert.match(deleteSource, /propagateYearCarryOver/);
});
