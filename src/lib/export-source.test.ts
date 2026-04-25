import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("export includes recurring expenses in monthly expense sections", () => {
  const source = readFileSync(new URL("./export.ts", import.meta.url), "utf8");

  assert.match(source, /recurringExpenses: "Recurring expenses"/);
  assert.match(source, /recurringExpenses: "Gastos recurrentes"/);
  assert.match(source, /for \(const entry of month\.recurringExpenses \?\? \[\]\)/);
});
