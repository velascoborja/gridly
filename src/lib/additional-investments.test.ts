import test from "node:test";
import assert from "node:assert/strict";
import { computeMonthChain, estimatedMonthData, totalMonthlyInvestment } from "./calculations.ts";
import { calculateInvestmentRate } from "./annual-investment-rate.ts";
import { calcEstimatedPortfolioValues, deriveEvolutionMetrics, summarizeEvolutionMetrics } from "./evolution.ts";
import type { AdditionalEntry, YearData } from "./types.ts";
import { avgAdditionalEntriesPerMonth } from "./additional-entries.ts";
import { computeTagStats } from "./tag-stats.ts";

const config = {
  id: 1, year: 2026, startingBalance: 1000, estimatedSalary: 2000,
  hasExtraPayments: false, estimatedExtraPayment: 0, monthlyInvestment: 0,
  monthlyHomeExpense: 0, monthlyPersonalBudget: 0, interestRate: 0.03,
};
const contribution: AdditionalEntry = {
  id: 1, monthId: 1, type: "expense", label: "ETF", amount: 200,
  isInvestment: true, isRecurring: false, isCompleted: false, tagId: null, tag: null,
};

function year(isInvestment: boolean): YearData {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    ...estimatedMonthData(index + 1, config), id: index + 1, yearId: 1,
    investment: index === 0 ? 300 : 0,
    additionalExpenses: index === 0 ? [{ ...contribution, isInvestment }] : [],
  }));
  return { config, recurringExpenses: [], months: computeMonthChain(rows, config.startingBalance, config.interestRate) };
}

test("additional investment is added to programmed investment once, including completed entries", () => {
  const input = { investment: 300, additionalExpenses: [contribution,
    { ...contribution, id: 2, amount: 50, isInvestment: false }] };
  assert.equal(totalMonthlyInvestment(input), 500);
  assert.equal(calculateInvestmentRate(totalMonthlyInvestment(input), 2000), 0.25);
  assert.equal(totalMonthlyInvestment({ ...input, additionalExpenses: [{ ...contribution, isCompleted: true }] }), 500);
  assert.equal(totalMonthlyInvestment({ investment: 0, additionalExpenses: [] }), 0);
  assert.equal(totalMonthlyInvestment({ investment: 0, additionalExpenses: [contribution] }), 200);
  assert.equal(totalMonthlyInvestment({ investment: 0, additionalExpenses: [{ ...contribution, amount: -50 }] }), -50);
});

test("marking an existing expense changes investment metrics without changing the cash chain", () => {
  const ordinary = year(false);
  const invested = year(true);
  assert.equal(invested.months[0].totalExpenses, 500);
  for (let index = 0; index < 12; index++) {
    for (const field of ["totalExpenses", "totalIncome", "savings", "startingBalance", "endingBalance", "interests"] as const) {
      assert.equal(invested.months[index][field], ordinary.months[index][field]);
    }
  }
  const [before] = deriveEvolutionMetrics([{ source: "gridly", yearData: ordinary }]);
  const [after] = deriveEvolutionMetrics([{ source: "gridly", yearData: invested }]);
  assert.equal(after.investedAmount, 500);
  assert.equal(after.savedAmount, before.savedAmount);
  assert.equal(after.totalIncome, before.totalIncome);
  assert.equal(after.totalExpenses, before.totalExpenses);
  assert.equal(after.savingsRate, before.savingsRate);
  assert.equal(avgAdditionalEntriesPerMonth(invested.months, "expense"), 200 / 12);
  assert.equal(computeTagStats(invested).totalAdditional, 200);
  assert.equal(summarizeEvolutionMetrics([after]).totalWealth - summarizeEvolutionMetrics([before]).totalWealth, 200);
});

test("Evolution carries additional investments into accumulated investment and portfolio projections", () => {
  const current = year(true);
  const next = { ...year(true), config: { ...config, year: 2027 } };
  const metrics = deriveEvolutionMetrics([{ source: "gridly", yearData: next }, { source: "gridly", yearData: current }]);
  assert.deepEqual(metrics.map((metric) => metric.accumulatedInvested), [500, 1000]);
  assert.equal(summarizeEvolutionMetrics(metrics).accumulatedInvested, 1000);
  assert.deepEqual(calcEstimatedPortfolioValues(metrics, 10), [
    { year: 2026, estimatedPortfolioValue: 500 }, { year: 2027, estimatedPortfolioValue: 1050 },
  ]);
});
