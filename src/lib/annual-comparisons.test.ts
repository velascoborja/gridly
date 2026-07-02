import test from "node:test";
import assert from "node:assert/strict";
import { deriveAnnualKpiComparison } from "./annual-comparisons.ts";
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

test("annual KPI comparison average excludes the viewed year and includes all metric sources", () => {
  const comparison = deriveAnnualKpiComparison([
    { ...metric(2023, 100), source: "historical" },
    metric(2024, 300),
    metric(2025, 500),
  ], 2024);

  assert.equal(comparison.averageSavings, 300);
});

test("annual KPI comparison omits average when there are no other years", () => {
  const comparison = deriveAnnualKpiComparison([metric(2026, 900)], 2026);

  assert.equal(comparison.averageSavings, null);
});
