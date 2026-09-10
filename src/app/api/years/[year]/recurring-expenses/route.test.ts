import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("PUT validates stable template identities", () => {
  assert.match(source, /RECURRING_EXPENSE_IDENTITY_ERROR/);
  assert.match(source, /new Map\(existingTemplates\.map\(\(template\) => \[template\.id, template\]\)\)/);
  assert.match(source, /new Set\(submittedIds\)\.size !== submittedIds\.length/);
});

test("PUT updates retained templates instead of deleting them", () => {
  assert.match(source, /update\(yearRecurringExpenses\)/);
  assert.match(source, /eq\(yearRecurringExpenses\.id, entry\.id\)/);
  assert.match(source, /const removedTemplateIds = existingTemplates/);
});

test("PUT copies the template tagId into the monthly copies", () => {
  assert.match(source, /tagId: template\.tagId/);
});

test("PUT rejects invalid amounts before starting a financial transaction", () => {
  assert.ok(
    source.indexOf("hasInvalidRecurringExpenseAmounts(body.recurringExpenses)") <
      source.indexOf("const result = await withFinancialTransaction"),
  );
  assert.match(source, /RECURRING_EXPENSE_AMOUNT_ERROR/);
});
