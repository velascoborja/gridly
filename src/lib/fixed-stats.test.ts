import test from "node:test";
import assert from "node:assert/strict";
import { computeFixedStats, mergeFixedStatsByYear } from "./fixed-stats.ts";
import type { MonthData, RecurringExpense, YearData } from "./types.ts";

function recurringExpense(overrides: Partial<Pick<RecurringExpense, "label" | "amount">>): RecurringExpense {
  return {
    id: 1,
    monthId: 1,
    yearRecurringExpenseId: null,
    label: overrides.label ?? "Test",
    amount: overrides.amount ?? 0,
    sortOrder: 0,
    tagId: null,
    tag: null,
  };
}

function month(overrides: Partial<MonthData>): MonthData {
  return {
    id: overrides.id ?? overrides.month ?? 1,
    yearId: 1,
    month: overrides.month ?? 1,
    homeExpense: overrides.homeExpense ?? 0,
    homeExpenseManualOverride: false,
    personalExpense: overrides.personalExpense ?? 0,
    personalExpenseManualOverride: false,
    investment: 0,
    investmentManualOverride: false,
    payslip: 0,
    payslipManualOverride: false,
    additionalPayslip: 0,
    additionalPayslipManualOverride: false,
    interests: 0,
    interestsManualOverride: false,
    personalRemaining: 0,
    recurringExpenses: overrides.recurringExpenses ?? [],
    additionalExpenses: [],
    additionalExpenseGroups: [],
    additionalIncomes: [],
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    startingBalance: 0,
    endingBalance: 0,
  };
}

function yearData(months: MonthData[]): YearData {
  return {
    config: {
      id: 1,
      year: 2024,
      startingBalance: 0,
      estimatedSalary: 0,
      hasExtraPayments: false,
      estimatedExtraPayment: 0,
      monthlyInvestment: 0,
      monthlyHomeExpense: 0,
      monthlyPersonalBudget: 0,
      interestRate: 0,
    },
    recurringExpenses: [],
    months,
  };
}

test("empty year returns grandTotal 0 and empty stats", () => {
  const result = computeFixedStats(yearData([]));
  assert.equal(result.grandTotal, 0);
  assert.deepEqual(result.stats, []);
});

test("months with zero values produce no stats", () => {
  const result = computeFixedStats(yearData([month({ month: 1, homeExpense: 0, personalExpense: 0 })]));
  assert.equal(result.grandTotal, 0);
  assert.deepEqual(result.stats, []);
});

test("home expense accumulates entries per month", () => {
  const result = computeFixedStats(yearData([
    month({ month: 1, homeExpense: 800 }),
    month({ month: 2, homeExpense: 800 }),
  ]));
  assert.equal(result.grandTotal, 1600);
  assert.equal(result.stats.length, 1);
  assert.equal(result.stats[0].key, "home");
  assert.equal(result.stats[0].totalAmount, 1600);
  assert.equal(result.stats[0].entries.length, 2);
  assert.equal(result.stats[0].entries[0].month, 1);
  assert.equal(result.stats[0].entries[0].amount, 800);
  assert.equal(result.stats[0].entries[0].description, "");
});

test("personal expense accumulates correctly", () => {
  const result = computeFixedStats(yearData([month({ month: 1, personalExpense: 400 })]));
  assert.equal(result.stats[0].key, "personal");
  assert.equal(result.stats[0].totalAmount, 400);
  assert.equal(result.grandTotal, 400);
});

test("recurring expenses roll into one bucket with labels", () => {
  const result = computeFixedStats(yearData([
    month({
      month: 1,
      recurringExpenses: [
        recurringExpense({ label: "Spotify", amount: 10 }),
        recurringExpense({ label: "Gym", amount: 30 }),
      ],
    }),
  ]));
  assert.equal(result.stats[0].key, "recurring");
  assert.equal(result.stats[0].totalAmount, 40);
  assert.equal(result.stats[0].entries.length, 2);
  assert.equal(result.stats[0].entries[0].description, "Spotify");
  assert.equal(result.stats[0].entries[1].description, "Gym");
});

test("all three categories with correct shares, sorted by amount desc", () => {
  const result = computeFixedStats(yearData([
    month({
      month: 1,
      homeExpense: 800,
      personalExpense: 400,
      recurringExpenses: [recurringExpense({ label: "Sub", amount: 20 })],
    }),
  ]));
  assert.equal(result.grandTotal, 1220);
  assert.equal(result.stats.length, 3);
  assert.equal(result.stats[0].key, "home");
  assert.ok(Math.abs(result.stats[0].shareOfTotal - 800 / 1220) < 0.001);
  assert.equal(result.stats[1].key, "personal");
  assert.equal(result.stats[2].key, "recurring");
});

test("stats sorted by totalAmount descending regardless of key order", () => {
  const result = computeFixedStats(yearData([
    month({ month: 1, homeExpense: 100, personalExpense: 500 }),
  ]));
  assert.equal(result.stats[0].key, "personal");
  assert.equal(result.stats[1].key, "home");
});

test("recurring entries with zero amount are excluded", () => {
  const result = computeFixedStats(yearData([
    month({
      month: 1,
      recurringExpenses: [recurringExpense({ label: "Zero", amount: 0 })],
    }),
  ]));
  assert.equal(result.grandTotal, 0);
  assert.deepEqual(result.stats, []);
});

test("mergeFixedStatsByYear sums amounts and stamps year on entries", () => {
  const stats2023 = computeFixedStats(yearData([month({ month: 12, homeExpense: 800 })]));
  const stats2024 = computeFixedStats(yearData([month({ month: 12, homeExpense: 900 })]));
  const merged = mergeFixedStatsByYear([
    { year: 2023, stats: stats2023 },
    { year: 2024, stats: stats2024 },
  ]);
  assert.equal(merged.grandTotal, 1700);
  assert.equal(merged.stats[0].key, "home");
  assert.equal(merged.stats[0].totalAmount, 1700);
  assert.equal(merged.stats[0].entries.length, 2);
  assert.equal(merged.stats[0].entries[0].year, 2023);
  assert.equal(merged.stats[0].entries[1].year, 2024);
});

test("mergeFixedStatsByYear with empty input returns empty", () => {
  const merged = mergeFixedStatsByYear([]);
  assert.equal(merged.grandTotal, 0);
  assert.deepEqual(merged.stats, []);
});

test("mergeFixedStatsByYear recomputes shares based on merged grand total", () => {
  const stats2023 = computeFixedStats(yearData([month({ month: 1, homeExpense: 600, personalExpense: 400 })]));
  const merged = mergeFixedStatsByYear([{ year: 2023, stats: stats2023 }]);
  assert.ok(Math.abs(merged.stats[0].shareOfTotal - 600 / 1000) < 0.001);
});
