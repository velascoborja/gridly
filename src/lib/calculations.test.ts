import test from "node:test";
import assert from "node:assert/strict";
import { applyYearConfigToMonth } from "./calculations.ts";
import type { YearConfig } from "./types.ts";

const config: YearConfig = {
  id: 1,
  year: 2026,
  startingBalance: 1000,
  estimatedSalary: 2500,
  hasExtraPayments: true,
  estimatedExtraPayment: 2500,
  monthlyInvestment: 300,
  monthlyHomeExpense: 900,
  monthlyPersonalBudget: 500,
  interestRate: 0.02,
};

const rawMonth = {
  id: 1,
  yearId: 1,
  month: 3,
  homeExpense: 100,
  personalExpense: 100,
  investment: 100,
  payslip: 100,
  additionalPayslip: 100,
  interests: 10,
  interestsManualOverride: true,
  personalRemaining: 50,
  recurringExpenses: [],
  additionalExpenses: [],
  additionalIncomes: [],
};

test("year config application preserves months before the selected apply-from month", () => {
  assert.deepEqual(applyYearConfigToMonth(rawMonth, config, 4), rawMonth);
});

test("year config application updates months from the selected apply-from month onward", () => {
  const updated = applyYearConfigToMonth({ ...rawMonth, month: 4 }, config, 4);

  assert.equal(updated.payslip, 2500);
  assert.equal(updated.homeExpense, 900);
  assert.equal(updated.personalExpense, 500);
  assert.equal(updated.investment, 300);
  assert.equal(updated.interests, 0);
  assert.equal(updated.interestsManualOverride, false);
});
