import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const deleteStart = source.indexOf("export async function DELETE");
const patchSource = source.slice(0, deleteStart);
const deleteSource = source.slice(deleteStart);

test("entry PATCH supports moving an entry to another owned month in the same year", () => {
  assert.match(source, /body\.monthId !== undefined/);
  assert.match(source, /const targetMonthId = parseInt\(String\(body\.monthId\), 10\)/);
  assert.match(source, /targetMonth\.yearId !== month\.yearId/);
  assert.match(source, /updates\.monthId = targetMonth\.id/);
});

test("entry PATCH keeps existing label and amount edits while validating the source entry", () => {
  assert.match(source, /if \(body\.label !== undefined\)/);
  assert.match(source, /updates\.label = body\.label/);
  assert.match(source, /if \(body\.amount !== undefined\) updates\.amount = String\(body\.amount\)/);
  assert.match(source, /entry\.monthId !== month\.id/);
});

test("entry mutations enforce completion locks from the entry and its group", () => {
  assert.match(source, /isCompletionOnlyRequest\(body, entry\.isCompleted\)/);
  assert.match(source, /sourceGroup\?\.isCompleted/);
  assert.match(source, /group\.isCompleted/);
  assert.match(source, /status: 409/);
});

test("entry PATCH persists completion state", () => {
  assert.match(source, /updates\.isCompleted = body\.isCompleted/);
});

test("entries PATCH route reads isRecurring from the request body", () => {
  assert.match(source, /body\.isRecurring/);
});

test("entries PATCH route sets isRecurring on the updates object", () => {
  assert.match(source, /updates\.isRecurring/);
});

test("entries PATCH route applies destination group tagId when moving entry into a group", () => {
  assert.match(source, /updates\.tagId = group\.tagId \?\? null/);
});

test("entries PATCH route only accepts a tag owned by the authenticated user", () => {
  assert.match(source, /eq\(tags\.id, newTagId\)/);
  assert.match(source, /eq\(tags\.userId, user\.id\)/);
  assert.match(source, /ownedTag\.length === 0/);
});

test("entry PATCH only propagates for a changed amount or actual month move", () => {
  assert.equal((patchSource.match(/affectsCarryOver =/g) ?? []).length, 2);
  assert.match(
    patchSource,
    /body\.amount !== undefined && Number\(body\.amount\) !== Number\(entry\.amount\)/,
  );
  assert.match(
    patchSource,
    /if \(targetMonth\.id !== entry\.monthId\) \{\s*affectsCarryOver = true/,
  );
  assert.match(
    patchSource,
    /if \(affectsCarryOver\) \{[\s\S]*propagateYearCarryOver/,
  );
});

test("entry DELETE keeps carry-over propagation", () => {
  assert.match(deleteSource, /propagateYearCarryOver/);
});
