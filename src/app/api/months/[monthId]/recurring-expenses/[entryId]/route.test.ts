import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const deleteStart = source.indexOf("export async function DELETE");
const patchSource = source.slice(0, deleteStart);
const deleteSource = source.slice(deleteStart);

test("recurring expense PATCH rejects invalid amounts before opening a transaction", () => {
  assert.match(patchSource, /isValidRecurringExpenseAmount\(body\.amount\)/);
  assert.match(patchSource, /RECURRING_EXPENSE_AMOUNT_ERROR/);
  assert.ok(
    patchSource.indexOf("isValidRecurringExpenseAmount(body.amount)") <
      patchSource.indexOf("const result = await withFinancialTransaction"),
  );
});

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
    /const nextAmount = body\.amount !== undefined \? body\.amount : undefined/,
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
