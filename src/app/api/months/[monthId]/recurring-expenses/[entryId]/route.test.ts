import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

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
