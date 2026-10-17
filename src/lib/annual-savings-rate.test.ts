import test from "node:test";
import assert from "node:assert/strict";
import { calculateSavingsRate, formatSavingsRate } from "./annual-savings-rate.ts";
import { computeMonthChain } from "./calculations.ts";
import { deriveEvolutionMetrics } from "./evolution.ts";
import type { YearConfig } from "./types.ts";

test("annual savings rate handles positive, negative, zero, and above-100% savings", () => {
  assert.equal(calculateSavingsRate(6000, 24000), 0.25);
  assert.equal(calculateSavingsRate(-6000, 24000), -0.25);
  assert.equal(calculateSavingsRate(0, 24000), 0);
  assert.equal(calculateSavingsRate(30000, 24000), 1.25);
});

test("annual savings rate is unavailable for zero or negative income", () => {
  assert.equal(calculateSavingsRate(0, 0), null);
  assert.equal(calculateSavingsRate(-1000, 0), null);
  assert.equal(calculateSavingsRate(-1000, -500), null);
});

test("expected income and expenses adjust savings while only income adjusts the denominator", () => {
  const baseSavings = 6000;
  const baseIncome = 24000;
  const scenarios = [
    { income: 0, expenses: 0, rate: 0.25 },
    { income: 1000, expenses: 0, rate: 0.28 },
    { income: 0, expenses: 500, rate: 5500 / 24000 },
    { income: 1000, expenses: 500, rate: 0.26 },
    { income: 0, expenses: 0, rate: 0.25 },
  ];

  for (const { income, expenses, rate } of scenarios) {
    assert.equal(calculateSavingsRate(baseSavings + income - expenses, baseIncome + income), rate);
  }
  assert.equal(calculateSavingsRate(1000, 1000), 1, "expected income alone can make the rate available");
});

test("annual savings rate formats exactly one decimal in Spanish and English", () => {
  assert.equal(formatSavingsRate(0.25, "es"), "25,0\u00a0%");
  assert.equal(formatSavingsRate(0.26, "en"), "26.0%");
  assert.equal(formatSavingsRate(-0.25, "es"), "-25,0\u00a0%");
  assert.equal(formatSavingsRate(0, "en"), "0.0%");
  assert.equal(formatSavingsRate(0.12356, "en"), "12.4%");
});

test("annual savings rate matches Evolution for a full year including investments and interest", () => {
  const config: YearConfig = {
    id: 1,
    year: 2026,
    startingBalance: 1000,
    estimatedSalary: 2000,
    hasExtraPayments: true,
    estimatedExtraPayment: 2000,
    monthlyInvestment: 250,
    monthlyHomeExpense: 700,
    monthlyPersonalBudget: 300,
    interestRate: 0.02,
  };
  const months = computeMonthChain(Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    yearId: config.id,
    month: index + 1,
    homeExpense: 700,
    personalExpense: 300,
    investment: 250,
    payslip: 2000,
    additionalPayslip: index === 5 || index === 11 ? 2000 : 0,
    interests: 0,
    interestsManualOverride: false,
    personalRemaining: 0,
    additionalExpenses: [],
    additionalExpenseGroups: [],
    additionalIncomes: [],
  })), config.startingBalance, config.interestRate);
  const [evolution] = deriveEvolutionMetrics([
    { source: "gridly", yearData: { config, months, recurringExpenses: [] } },
  ]);
  const annualRate = calculateSavingsRate(
    months.reduce((sum, month) => sum + month.savings, 0),
    months.reduce((sum, month) => sum + month.totalIncome, 0),
  );

  assert.ok(annualRate !== null && evolution.savingsRate !== null);
  assert.ok(Math.abs(annualRate - evolution.savingsRate) < 1e-12);
  assert.equal(formatSavingsRate(annualRate, "es"), formatSavingsRate(evolution.savingsRate, "es"));
});
