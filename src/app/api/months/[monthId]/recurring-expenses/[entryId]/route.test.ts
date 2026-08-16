import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const deleteStart = source.indexOf("export async function DELETE");
const patchSource = source.slice(0, deleteStart);
const deleteSource = source.slice(deleteStart);

test("PATCH reads tagId from the body", () => {
  assert.match(source, /body\.tagId !== undefined/);
});

test("PATCH validates tag ownership for a numeric tagId", () => {
  assert.match(source, /eq\(tags\.userId, user\.id\)/);
});

test("PATCH propagates the tag to the template row", () => {
  assert.match(source, /update\(yearRecurringExpenses\)[\s\S]*eq\(yearRecurringExpenses\.id, entry\.yearRecurringExpenseId\)/);
});

test("PATCH propagates the tag to all monthly copies of the series", () => {
  assert.match(source, /eq\(monthlyRecurringExpenses\.yearRecurringExpenseId, entry\.yearRecurringExpenseId\)/);
});

test("PATCH only propagates carry-over when the normalized amount changes", () => {
  assert.equal((patchSource.match(/affectsCarryOver =/g) ?? []).length, 1);
  assert.match(
    patchSource,
    /const nextAmount = body\.amount !== undefined \? Number\(body\.amount\) \|\| 0 : undefined/,
  );
  assert.match(
    patchSource,
    /nextAmount !== undefined && nextAmount !== Number\(entry\.amount\)/,
  );
  assert.match(
    patchSource,
    /if \(affectsCarryOver\) \{[\s\S]*propagateYearCarryOver/,
  );
});

test("recurring expense DELETE keeps carry-over propagation", () => {
  assert.match(deleteSource, /propagateYearCarryOver/);
});
