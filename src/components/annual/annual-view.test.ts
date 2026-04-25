import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("annual extra payment edits sync recalculated year data to parent state", () => {
  const source = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");

  assert.match(source, /onYearDataChange\?: \(yearData: YearData\) => void/);
  assert.match(source, /const nextConfig = \{ \.\.\.config, hasExtraPayments, estimatedExtraPayment \}/);
  assert.match(source, /onYearDataChange\?\.\(\{[\s\S]*config: nextConfig,[\s\S]*months: recomputedMonths,[\s\S]*\}\)/);
});

test("year page lets annual summary update shared year data", () => {
  const source = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<AnnualView[\s\S]*onYearDataChange=\{setCurrentYearData\}/);
});

test("annual interest rate setting edits inline with percent formatting", () => {
  const source = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /prompt\(/);
  assert.match(source, /label=\{t\("interestRate"\)\}/);
  assert.match(source, /formatDisplayValue=\{\(v\) => `\$\{\(v \* 100\)\.toFixed\(2\)\}%`\}/);
  assert.match(source, /formatEditValue=\{\(v\) => String\(\+\(v \* 100\)\.toFixed\(2\)\)\}/);
  assert.match(source, /parseInputValue=\{\(input\) => parseFloat\(input\.replace\(",", "\."\)\) \/ 100\}/);
});

test("annual settings can reapply recurring expense templates to every month", () => {
  const viewSource = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(viewSource, /handleRecurringExpensesApplied/);
  assert.match(viewSource, /onRecurringExpensesApplied=\{handleRecurringExpensesApplied\}/);
  assert.match(formSource, /RecurringExpenseTemplateEditor/);
  assert.match(formSource, /AlertDialog/);
  assert.match(formSource, /\/api\/years\/\$\{config\.year\}\/recurring-expenses/);
});
