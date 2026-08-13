import test from "node:test";
import assert from "node:assert/strict";
import { deriveAnnualComparisonMetrics, deriveAnnualKpiComparison } from "./annual-comparisons.ts";
import type { EvolutionYearMetric } from "./evolution.ts";

function metric(year: number, savedAmount: number, finalBalance = 0): EvolutionYearMetric {
  return {
    source: "gridly",
    year,
    startingBalance: finalBalance - savedAmount,
    finalBalance,
    savedAmount,
    investedAmount: 0,
    interestsEarned: 0,
    accumulatedInvested: 0,
    totalIncome: null,
    totalExpenses: null,
    savingsRate: null,
  };
}

test("annual KPI comparison uses the exact previous calendar year when present", () => {
  const comparison = deriveAnnualKpiComparison([
    metric(2024, 300, 1300),
    metric(2025, 700, 2000),
    metric(2026, 900, 2900),
  ], 2026);

  assert.deepEqual(comparison.previousYear, {
    year: 2025,
    savedAmount: 700,
    finalBalance: 2000,
  });
});

test("annual KPI comparison falls back to the nearest earlier registered year", () => {
  const comparison = deriveAnnualKpiComparison([
    metric(2022, 200, 1200),
    metric(2024, 400, 1600),
    metric(2026, 900, 2500),
  ], 2026);

  assert.equal(comparison.previousYear?.year, 2024);
});

test("annual KPI comparison omits previous data when no earlier year exists", () => {
  const comparison = deriveAnnualKpiComparison([
    metric(2026, 900, 2500),
    metric(2027, 1000, 3500),
  ], 2026);

  assert.equal(comparison.previousYear, null);
});

test("annual KPI comparison average excludes the viewed year", () => {
  const comparison = deriveAnnualKpiComparison([
    metric(2023, 100),
    metric(2024, 300),
    metric(2025, 500),
  ], 2024);

  assert.equal(comparison.averageSavings, 300);
});

test("annual KPI comparison omits average when there are no other years", () => {
  const comparison = deriveAnnualKpiComparison([metric(2026, 900)], 2026);

  assert.equal(comparison.averageSavings, null);
});

test("compact annual metrics reproduce the month chain with automatic and manual interest", () => {
  const metrics = deriveAnnualComparisonMetrics([
    {
      year: 2024,
      startingBalance: 1200,
      interestRate: 0.12,
      months: [
        {
          month: 1,
          homeExpense: 400,
          personalExpense: 200,
          investment: 100,
          payslip: 2000,
          additionalPayslip: 0,
          interests: 999,
          interestsManualOverride: false,
          personalRemaining: 50,
          additionalIncome: 75,
          additionalExpense: 125,
          recurringExpense: 300,
        },
        {
          month: 12,
          homeExpense: 500,
          personalExpense: 250,
          investment: 100,
          payslip: 2200,
          additionalPayslip: 1000,
          interests: 25,
          interestsManualOverride: true,
          personalRemaining: 0,
          additionalIncome: 100,
          additionalExpense: 200,
          recurringExpense: 350,
        },
      ],
    },
  ], []);

  // January interest is round2(1200 * 0.12 / 12) = 12.
  // January ends at 2212; December saves 1925 and ends at 4137.
  assert.deepEqual(metrics, [{ year: 2024, savedAmount: 2937, finalBalance: 4137 }]);
});

test("compact annual metrics skip incomplete Gridly years and include historical summaries", () => {
  const metrics = deriveAnnualComparisonMetrics([
    {
      year: 2025,
      startingBalance: 1000,
      interestRate: 0,
      months: [{
        month: 11,
        homeExpense: 0,
        personalExpense: 0,
        investment: 0,
        payslip: 100,
        additionalPayslip: 0,
        interests: 0,
        interestsManualOverride: true,
        personalRemaining: 0,
        additionalIncome: 0,
        additionalExpense: 0,
        recurringExpense: 0,
      }],
    },
  ], [{ year: 2023, startingBalance: 400, finalBalance: 650 }]);

  assert.deepEqual(metrics, [{ year: 2023, savedAmount: 250, finalBalance: 650 }]);
});
