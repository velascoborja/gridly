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
    additionalExpenseGroups: [],
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
    { source: "gridly", yearData: yearData(2024, 1000, [
      month({ month: 1, investment: 100, totalIncome: 1500, totalExpenses: 900, endingBalance: 1600 }),
      month({ month: 12, investment: 200, totalIncome: 1700, totalExpenses: 1200, endingBalance: 2500 }),
    ]) },
    { source: "gridly", yearData: yearData(2025, 2500, [
      month({ month: 12, investment: 300, totalIncome: 2000, totalExpenses: 1400, endingBalance: 3300 }),
    ]) },
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
    { source: "gridly", yearData: yearData(2024, 500, [
      month({ month: 12, totalIncome: 0, totalExpenses: 100, endingBalance: 400 }),
    ]) },
  ]);

  assert.equal(metric.savingsRate, null);
});

test("deriveEvolutionMetrics excludes years without a December month", () => {
  const metrics = deriveEvolutionMetrics([
    { source: "gridly", yearData: yearData(2024, 1000, [month({ month: 11, endingBalance: 1100 })]) },
    { source: "gridly", yearData: yearData(2025, 1100, [month({ month: 12, endingBalance: 1300 })]) },
  ]);

  assert.deepEqual(metrics.map((metric) => metric.year), [2025]);
});

test("deriveEvolutionMetrics sorts years ascending before accumulating investments", () => {
  const metrics = deriveEvolutionMetrics([
    { source: "gridly", yearData: yearData(2026, 2000, [month({ month: 12, investment: 300, endingBalance: 2600 })]) },
    { source: "gridly", yearData: yearData(2024, 1000, [month({ month: 12, investment: 100, endingBalance: 1300 })]) },
    { source: "gridly", yearData: yearData(2025, 1300, [month({ month: 12, investment: 200, endingBalance: 2000 })]) },
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

test("deriveEvolutionMetrics merges gridly and historical sources chronologically", () => {
  const metrics = deriveEvolutionMetrics([
    { source: "gridly", yearData: yearData(2024, 1000, [month({ month: 12, investment: 200, totalIncome: 2000, totalExpenses: 1200, endingBalance: 1800 })]) },
    { source: "historical", year: 2022, startingBalance: 500, finalBalance: 900, investedAmount: 100, savingsRate: null },
    { source: "historical", year: 2023, startingBalance: 900, finalBalance: 750, investedAmount: 50, savingsRate: null },
  ]);

  assert.deepEqual(metrics.map((metric) => ({
    source: metric.source,
    year: metric.year,
    savedAmount: metric.savedAmount,
    investedAmount: metric.investedAmount,
    accumulatedInvested: metric.accumulatedInvested,
    totalIncome: metric.totalIncome,
    totalExpenses: metric.totalExpenses,
    savingsRate: metric.savingsRate,
  })), [
    {
      source: "historical",
      year: 2022,
      savedAmount: 400,
      investedAmount: 100,
      accumulatedInvested: 100,
      totalIncome: null,
      totalExpenses: null,
      savingsRate: null,
    },
    {
      source: "historical",
      year: 2023,
      savedAmount: -150,
      investedAmount: 50,
      accumulatedInvested: 150,
      totalIncome: null,
      totalExpenses: null,
      savingsRate: null,
    },
    {
      source: "gridly",
      year: 2024,
      savedAmount: 800,
      investedAmount: 200,
      accumulatedInvested: 350,
      totalIncome: 2000,
      totalExpenses: 1200,
      savingsRate: 800 / 2000,
    },
  ]);
});

test("getAllYearDataForUser callers can exclude future years before deriving metrics", () => {
  const eligibleYears = [
    yearData(2025, 1000, [month({ month: 12, investment: 100, endingBalance: 1400 })]),
    yearData(2026, 1400, [month({ month: 12, investment: 200, endingBalance: 2100 })]),
    yearData(2027, 2100, [month({ month: 12, investment: 300, endingBalance: 2900 })]),
  ].filter((data) => data.config.year <= 2026);
  const metrics = deriveEvolutionMetrics(eligibleYears.map((data) => ({ source: "gridly" as const, yearData: data })));

  assert.deepEqual(metrics.map((metric) => ({
    year: metric.year,
    accumulatedInvested: metric.accumulatedInvested,
  })), [
    {
      year: 2025,
      accumulatedInvested: 100,
    },
    {
      year: 2026,
      accumulatedInvested: 300,
    },
  ]);
});

test("summarizeEvolutionMetrics derives dashboard totals and best year", () => {
  const metrics = deriveEvolutionMetrics([
    { source: "gridly", yearData: yearData(2024, 1000, [month({ month: 12, investment: 100, totalIncome: 1000, endingBalance: 1300 })]) },
    { source: "gridly", yearData: yearData(2025, 1300, [month({ month: 12, investment: 250, totalIncome: 2000, endingBalance: 1900 })]) },
  ]);

  assert.deepEqual(summarizeEvolutionMetrics(metrics), {
    latestFinalBalance: 1900,
    totalSaved: 900,
    averageSavingsPerYear: 450,
    averageSavingsRate: 0.3,
    accumulatedInvested: 350,
    totalWealth: 2250,
    topYears: [
      { year: 2025, savedAmount: 600 },
      { year: 2024, savedAmount: 300 },
    ],
  });
});

test("summarizeEvolutionMetrics returns zero totals and null best year for empty metrics", () => {
  assert.deepEqual(summarizeEvolutionMetrics([]), {
    latestFinalBalance: 0,
    totalSaved: 0,
    averageSavingsPerYear: 0,
    averageSavingsRate: null,
    accumulatedInvested: 0,
    totalWealth: 0,
    topYears: [],
  });
});
