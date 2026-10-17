import test from "node:test";
import assert from "node:assert/strict";
import { applyYearConfigToMonth, calculateMonthFinancials, calculateMonthlyInterest, computeMonthChain, savings, totalExpenses, totalIncome } from "./calculations.ts";
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
  additionalExpenseGroups: [],
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

// Reclassification must preserve the former month chain, including invalid legacy adjustments.

for (const remaining of [0, 50, 100, 150, -20]) {
  test(`surplus ${remaining} reduces expenses, preserves savings and full downstream chain`, () => {
    const month = { ...rawMonth, personalRemaining: remaining };
    assert.equal(totalIncome(month), 210);
    assert.equal(totalExpenses(month), 300 - remaining);
    assert.equal(savings(month), -90 + remaining);
    const rows = Array.from({ length: 12 }, (_, i) => ({ ...month, month: i + 1,
      interestsManualOverride: i === 4 }));
    let previousBalance = 1000;
    const chain = computeMonthChain(rows, 1000, 0.03);
    for (const current of chain) {
      const interests = current.month === 5 ? 10 : calculateMonthlyInterest(previousBalance, 0.03);
      const formerIncome = 200 + interests + remaining;
      const formerSavings = formerIncome - 300;
      assert.ok(Math.abs(current.startingBalance - previousBalance) < 1e-9);
      assert.equal(current.interests, interests);
      assert.ok(Math.abs(current.totalIncome - (formerIncome - remaining)) < 1e-9);
      assert.equal(current.totalExpenses, 300 - remaining);
      assert.ok(Math.abs(current.savings - formerSavings) < 1e-9);
      assert.ok(Math.abs(current.endingBalance - (previousBalance + formerSavings)) < 1e-9);
      previousBalance += formerSavings;
    }
    const nextYear = computeMonthChain(rows, chain.at(-1)!.endingBalance, 0.03);
    assert.ok(Math.abs(nextYear[0].startingBalance - previousBalance) < 1e-9);
  });
}

test("aggregated financials include additional and recurring entries with corrected totals", () => {
  const result = calculateMonthFinancials({ startingBalance: 1000, interestRate: 0,
    interests: 10, interestsManualOverride: true, payslip: 2000, additionalPayslip: 2000,
    personalRemaining: 50, homeExpense: 500, personalExpense: 100, investment: 200,
    additionalIncome: 20, additionalExpense: 30, recurringExpense: 10 });
  assert.deepEqual(result, { interests: 10, totalIncome: 4030, totalExpenses: 790,
    savings: 3240, endingBalance: 4240 });
});
