import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("export includes recurring expenses in monthly expense sections", () => {
  const source = readFileSync(new URL("./export.ts", import.meta.url), "utf8");

  assert.match(source, /recurringExpenses: "Recurring expenses"/);
  assert.match(source, /recurringExpenses: "Gastos recurrentes"/);
  assert.match(source, /for \(const entry of month\.recurringExpenses \?\? \[\]\)/);
});

test("export defines buildMonthSheet and buildSummarySheet functions", () => {
  const source = readFileSync(new URL("./export.ts", import.meta.url), "utf8");

  assert.match(source, /function buildMonthSheet/);
  assert.match(source, /function buildSummarySheet/);
});

test("export includes new KPI translation keys", () => {
  const source = readFileSync(new URL("./export.ts", import.meta.url), "utf8");

  assert.match(source, /totalSaved: "Total ahorrado"/);
  assert.match(source, /totalSaved: "Total saved"/);
  assert.match(source, /fixedExpenses: "Gastos fijos"/);
  assert.match(source, /fixedExpenses: "Fixed expenses"/);
  assert.match(source, /additionalExpensesLabel: "Gastos adicionales"/);
  assert.match(source, /additionalExpensesLabel: "Additional expenses"/);
  assert.match(source, /fixedIncome: "Ingresos fijos"/);
  assert.match(source, /fixedIncome: "Fixed income"/);
  assert.match(source, /additionalIncomeLabel: "Ingresos adicionales"/);
  assert.match(source, /additionalIncomeLabel: "Additional income"/);
});
