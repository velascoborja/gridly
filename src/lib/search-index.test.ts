import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchIndex, filterSearchIndex } from "./search-index.ts";
import type { YearData } from "./types.ts";

function makeYearData(): YearData {
  return {
    config: {
      id: 1, year: 2025, startingBalance: 0, estimatedSalary: 0,
      hasExtraPayments: false, estimatedExtraPayment: 0, monthlyInvestment: 0,
      monthlyHomeExpense: 0, monthlyPersonalBudget: 0, interestRate: 0,
    },
    recurringExpenses: [],
    months: [
      {
        id: 10, yearId: 1, month: 1,
        homeExpense: 0, homeExpenseManualOverride: false,
        personalExpense: 0, personalExpenseManualOverride: false,
        investment: 0, investmentManualOverride: false,
        payslip: 0, payslipManualOverride: false,
        additionalPayslip: 0, additionalPayslipManualOverride: false,
        interests: 0, interestsManualOverride: false,
        personalRemaining: 0,
        additionalIncomes: [{ id: 1, monthId: 10, type: "income", label: "Freelance web", amount: 500 }],
        additionalExpenses: [{ id: 2, monthId: 10, type: "expense", label: "Cena cumpleaños", amount: 45 }],
        additionalExpenseGroups: [{
          id: 99, monthId: 10, label: "Viaje Roma",
          entries: [{ id: 3, monthId: 10, type: "expense", label: "Vuelo Roma", amount: 200 }],
        }],
        recurringExpenses: [{ id: 4, monthId: 10, yearRecurringExpenseId: null, label: "Alquiler", amount: 900, sortOrder: 0 }],
        totalIncome: 0, totalExpenses: 0, savings: 0, startingBalance: 0, endingBalance: 0,
      },
    ],
  };
}

test("buildSearchIndex includes additional income entries", () => {
  const index = buildSearchIndex(makeYearData());
  const income = index.find((e) => e.id === "entry-1");
  assert.ok(income);
  assert.strictEqual(income.label, "Freelance web");
  assert.strictEqual(income.amount, 500);
  assert.strictEqual(income.month, 1);
  assert.strictEqual(income.kind, "income");
});

test("buildSearchIndex includes ungrouped additional expense entries", () => {
  const index = buildSearchIndex(makeYearData());
  const expense = index.find((e) => e.id === "entry-2");
  assert.ok(expense);
  assert.strictEqual(expense.label, "Cena cumpleaños");
  assert.strictEqual(expense.kind, "expense");
  assert.strictEqual(expense.groupLabel, undefined);
});

test("buildSearchIndex includes grouped additional expense entries with groupLabel", () => {
  const index = buildSearchIndex(makeYearData());
  const grouped = index.find((e) => e.id === "entry-3");
  assert.ok(grouped);
  assert.strictEqual(grouped.label, "Vuelo Roma");
  assert.strictEqual(grouped.kind, "expense");
  assert.strictEqual(grouped.groupLabel, "Viaje Roma");
});

test("buildSearchIndex includes recurring expenses", () => {
  const index = buildSearchIndex(makeYearData());
  const recurring = index.find((e) => e.id === "recurring-4");
  assert.ok(recurring);
  assert.strictEqual(recurring.label, "Alquiler");
  assert.strictEqual(recurring.amount, 900);
  assert.strictEqual(recurring.kind, "recurring");
});

test("filterSearchIndex returns empty array for empty query", () => {
  const index = buildSearchIndex(makeYearData());
  assert.deepStrictEqual(filterSearchIndex(index, ""), []);
  assert.deepStrictEqual(filterSearchIndex(index, "  "), []);
});

test("filterSearchIndex matches case-insensitively", () => {
  const index = buildSearchIndex(makeYearData());
  const results = filterSearchIndex(index, "freelance");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].label, "Freelance web");
});

test("filterSearchIndex returns no results for non-matching query", () => {
  const index = buildSearchIndex(makeYearData());
  assert.deepStrictEqual(filterSearchIndex(index, "zzznotfound"), []);
});

test("filterSearchIndex matches by exact amount", () => {
  const index = buildSearchIndex(makeYearData());
  const results = filterSearchIndex(index, "500");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].label, "Freelance web");
});

test("filterSearchIndex matches by partial amount substring", () => {
  const index = buildSearchIndex(makeYearData());
  // "90" matches amount 900 (Alquiler)
  const results = filterSearchIndex(index, "90");
  assert.ok(results.some((e) => e.label === "Alquiler"));
});

test("filterSearchIndex returns both label and amount matches without duplicates", () => {
  const index = buildSearchIndex(makeYearData());
  // "45" matches amount 45 (Cena cumpleaños) — not a label match
  const results = filterSearchIndex(index, "45");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].label, "Cena cumpleaños");
});

test("filterSearchIndex sorts results by month ascending", () => {
  const data = makeYearData();
  data.months.push({
    id: 20, yearId: 1, month: 3,
    homeExpense: 0, homeExpenseManualOverride: false,
    personalExpense: 0, personalExpenseManualOverride: false,
    investment: 0, investmentManualOverride: false,
    payslip: 0, payslipManualOverride: false,
    additionalPayslip: 0, additionalPayslipManualOverride: false,
    interests: 0, interestsManualOverride: false,
    personalRemaining: 0,
    additionalIncomes: [{ id: 5, monthId: 20, type: "income", label: "Freelance marzo", amount: 300 }],
    additionalExpenses: [],
    additionalExpenseGroups: [],
    recurringExpenses: [],
    totalIncome: 0, totalExpenses: 0, savings: 0, startingBalance: 0, endingBalance: 0,
  });
  const results = filterSearchIndex(buildSearchIndex(data), "freelance");
  assert.strictEqual(results[0].month, 1);
  assert.strictEqual(results[1].month, 3);
});
