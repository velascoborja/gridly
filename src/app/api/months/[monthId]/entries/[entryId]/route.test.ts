import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("entry PATCH supports moving an entry to another owned month in the same year", () => {
  assert.match(source, /body\.monthId !== undefined/);
  assert.match(source, /const targetMonthId = parseInt\(String\(body\.monthId\), 10\)/);
  assert.match(source, /targetMonth\.yearId !== month\.yearId/);
  assert.match(source, /updates\.monthId = targetMonth\.id/);
});

test("entry PATCH keeps existing label and amount edits while validating the source entry", () => {
  assert.match(source, /if \(body\.label !== undefined\) updates\.label = protectFinancialText\(String\(body\.label\)\)/);
  assert.match(source, /if \(body\.amount !== undefined\) updates\.amount = protectFinancialNumber\(body\.amount\)/);
  assert.match(source, /entry\.monthId !== month\.id/);
});
