import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("monthly Markdown export defines the template sections", () => {
  const source = readFileSync(new URL("./monthly-markdown-export.ts", import.meta.url), "utf8");

  assert.match(source, /export function buildMonthlyMarkdown/);
  assert.match(source, /nextMonthExpenses: "Gastos mes siguiente"/);
  assert.match(source, /fixedExpenses: "Gastos fijos"/);
  assert.match(source, /currentMonthExpenses: "Gastos mes actual"/);
  assert.match(source, /income: "Ingreso"/);
  assert.match(source, /fixedIncome: "Ingresos fijos"/);
  assert.match(source, /additionalIncome: "Ingresos adicionales"/);
  assert.match(source, /current: "Actual"/);
});

test("monthly Markdown export includes recurring, grouped, and additional rows", () => {
  const source = readFileSync(new URL("./monthly-markdown-export.ts", import.meta.url), "utf8");

  assert.match(source, /month\.recurringExpenses\.map/);
  assert.match(source, /month\.additionalIncomes\.map/);
  assert.match(source, /\[t\.additionalPayslip, month\.additionalPayslip\],\n      \.\.\.additionalIncomeRows/);
  assert.match(source, /currentExpenseRows\(month\)/);
  assert.match(source, /\`\$\{group\.label\} - \$\{entry\.label\}\`/);
  assert.match(source, /formatMoney\(amount, locale\)/);
  assert.match(source, /sortMoneyRowsDesc\(rows\)/);
  assert.match(source, /b\[1\] - a\[1\]/);
});
