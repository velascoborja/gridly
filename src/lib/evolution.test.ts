import test from "node:test";
import assert from "node:assert/strict";
import { deriveEvolutionMetrics, summarizeEvolutionMetrics } from "./evolution.ts";
import type { MonthData, YearData } from "./types.ts";

function month(overrides: Partial<MonthData>): MonthData {
  return {
    id: overrides.id ?? overrides.month ?? 1,
    yearId: overrides.yearId ?? 1,
    month: overrides.month ?? 1,
    homeExpense: 0,
    homeExpenseManualOverride: false,
    personalExpense: 0,
    personalExpenseManualOverride: false,
    investment: overrides.investment ?? 0,
    investmentManualOverride: false,
    payslip: 0,
    payslipManualOverride: false,
    additionalPayslip: 0,
    additionalPayslipManualOverride: false,
    interests: 0,
    interestsManualOverride: false,
    personalRemaining: 0,
    recurringExpenses: [],
    additionalExpenses: [],
    additionalIncomes: [],
    totalIncome: overrides.totalIncome ?? 0,
    totalExpenses: overrides.totalExpenses ?? 0,
    savings: overrides.savings ?? 0,
    startingBalance: overrides.startingBalance ?? 0,
    endingBalance: overrides.endingBalance ?? 0,
  };
}

function yearData(year: number, startingBalance: number, months: MonthData[]): YearData {
  return {
    config: {
      id: year,
      year,
      startingBalance,
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

test("deriveEvolutionMetrics calculates cash savings separately from investments", () => {
  const metrics = deriveEvolutionMetrics([
    yearData(2024, 1000, [
      month({ month: 1, investment: 100, totalIncome: 1500, totalExpenses: 900, endingBalance: 1600 }),
      month({ month: 12, investment: 200, totalIncome: 1700, totalExpenses: 1200, endingBalance: 2500 }),
    ]),
    yearData(2025, 2500, [
      month({ month: 12, investment: 300, totalIncome: 2000, totalExpenses: 1400, endingBalance: 3300 }),
    ]),
  ]);

  assert.deepEqual(metrics.map((metric) => ({
    year: metric.year,
    startingBalance: metric.startingBalance,
    finalBalance: metric.finalBalance,
    savedAmount: metric.savedAmount,
    investedAmount: metric.investedAmount,
    accumulatedInvested: metric.accumulatedInvested,
    totalIncome: metric.totalIncome,
    totalExpenses: metric.totalExpenses,
    savingsRate: metric.savingsRate,
  })), [
    {
      year: 2024,
      startingBalance: 1000,
      finalBalance: 2500,
      savedAmount: 1500,
      investedAmount: 300,
      accumulatedInvested: 300,
      totalIncome: 3200,
      totalExpenses: 2100,
      savingsRate: 1500 / 3200,
    },
    {
      year: 2025,
      startingBalance: 2500,
      finalBalance: 3300,
      savedAmount: 800,
      investedAmount: 300,
      accumulatedInvested: 600,
      totalIncome: 2000,
      totalExpenses: 1400,
      savingsRate: 800 / 2000,
    },
  ]);
});

test("deriveEvolutionMetrics returns null savings rate when income is zero", () => {
  const [metric] = deriveEvolutionMetrics([
    yearData(2024, 500, [
      month({ month: 12, totalIncome: 0, totalExpenses: 100, endingBalance: 400 }),
    ]),
  ]);

  assert.equal(metric.savingsRate, null);
});

test("deriveEvolutionMetrics excludes years without a December month", () => {
  const metrics = deriveEvolutionMetrics([
    yearData(2024, 1000, [month({ month: 11, endingBalance: 1100 })]),
    yearData(2025, 1100, [month({ month: 12, endingBalance: 1300 })]),
  ]);

  assert.deepEqual(metrics.map((metric) => metric.year), [2025]);
});

test("deriveEvolutionMetrics sorts years ascending before accumulating investments", () => {
  const metrics = deriveEvolutionMetrics([
    yearData(2026, 2000, [month({ month: 12, investment: 300, endingBalance: 2600 })]),
    yearData(2024, 1000, [month({ month: 12, investment: 100, endingBalance: 1300 })]),
    yearData(2025, 1300, [month({ month: 12, investment: 200, endingBalance: 2000 })]),
  ]);

  assert.deepEqual(metrics.map((metric) => ({
    year: metric.year,
    investedAmount: metric.investedAmount,
    accumulatedInvested: metric.accumulatedInvested,
  })), [
    {
      year: 2024,
      investedAmount: 100,
      accumulatedInvested: 100,
    },
    {
      year: 2025,
      investedAmount: 200,
      accumulatedInvested: 300,
    },
    {
      year: 2026,
      investedAmount: 300,
      accumulatedInvested: 600,
    },
  ]);
});

test("summarizeEvolutionMetrics derives dashboard totals and best year", () => {
  const metrics = deriveEvolutionMetrics([
    yearData(2024, 1000, [month({ month: 12, investment: 100, totalIncome: 1000, endingBalance: 1300 })]),
    yearData(2025, 1300, [month({ month: 12, investment: 250, totalIncome: 2000, endingBalance: 1900 })]),
  ]);

  assert.deepEqual(summarizeEvolutionMetrics(metrics), {
    latestFinalBalance: 1900,
    totalSaved: 900,
    accumulatedInvested: 350,
    bestYear: {
      year: 2025,
      savedAmount: 600,
    },
  });
});

test("summarizeEvolutionMetrics returns zero totals and null best year for empty metrics", () => {
  assert.deepEqual(summarizeEvolutionMetrics([]), {
    latestFinalBalance: 0,
    totalSaved: 0,
    accumulatedInvested: 0,
    bestYear: null,
  });
});
