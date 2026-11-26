import test from "node:test";
import assert from "node:assert/strict";
import { computeMonthChain } from "./calculations.ts";
import { describeMonth, filterYearEntries, sumEntries, summarizeYear } from "./mcp-tool-data.ts";

const food = { id: 1, name: "Comida", color: "green" };
const leisure = { id: 2, name: "Ocio", color: "blue" };

function entry(id: number, monthId: number, type: "income" | "expense", label: string, amount: number, extra = {}) {
  return {
    id, monthId, type, label, amount,
    isRecurring: false, isInvestment: false, isCompleted: false, tagId: null, tag: null,
    ...extra,
  };
}

function rawMonth(month: number, overrides = {}) {
  return {
    id: month,
    yearId: 1,
    month,
    homeExpense: 500,
    personalExpense: 300,
    investment: 100,
    payslip: 2000,
    additionalPayslip: 0,
    interests: 0,
    interestsManualOverride: true,
    personalRemaining: 0,
    recurringExpenses: [],
    additionalExpenses: [],
    additionalExpenseGroups: [],
    additionalIncomes: [],
    ...overrides,
  };
}

function yearData() {
  const months = computeMonthChain(
    [
      rawMonth(1, {
        additionalExpenses: [
          entry(10, 1, "expense", "Supermercado", 80.5, { tagId: 1, tag: food }),
          entry(11, 1, "expense", "Fondo indexado", 50, { isInvestment: true }),
        ],
        additionalIncomes: [entry(12, 1, "income", "Venta bici", 120)],
        recurringExpenses: [
          { id: 20, monthId: 1, yearRecurringExpenseId: 5, label: "Gimnasio", amount: 40, sortOrder: 0, tagId: 2, tag: leisure },
        ],
      }),
      rawMonth(2, {
        additionalExpenseGroups: [
          {
            id: 30, monthId: 2, label: "Viaje Lisboa", isCompleted: false, tagId: 2, tag: leisure,
            entries: [entry(31, 2, "expense", "Hotel", 200, { groupId: 30 })],
          },
        ],
      }),
    ] as never,
    1000,
    0
  );

  return {
    config: {
      id: 1, year: 2026, startingBalance: 1000, estimatedSalary: 2000, hasExtraPayments: false,
      estimatedExtraPayment: 0, monthlyInvestment: 100, monthlyHomeExpense: 500, monthlyPersonalBudget: 300,
      interestRate: 0,
    },
    recurringExpenses: [],
    months,
  } as never;
}

test("filterYearEntries flattens additional, grouped and recurring entries", () => {
  const entries = filterYearEntries(yearData());
  assert.deepEqual(entries.map((e) => e.id).sort((a, b) => a - b), [10, 11, 12, 20, 31]);

  const hotel = entries.find((e) => e.id === 31)!;
  assert.equal(hotel.group, "Viaje Lisboa");
  assert.equal(hotel.tag, "Ocio", "grouped entries inherit the group tag");

  const gym = entries.find((e) => e.id === 20)!;
  assert.equal(gym.kind, "recurring");
  assert.equal(gym.isRecurring, true);
});

test("filterYearEntries filters by month, type, tag and accent-insensitive search", () => {
  const data = yearData();
  assert.deepEqual(filterYearEntries(data, { month: 2 }).map((e) => e.id), [31]);
  assert.deepEqual(filterYearEntries(data, { type: "income" }).map((e) => e.id), [12]);
  assert.deepEqual(filterYearEntries(data, { tag: "ocio" }).map((e) => e.id).sort(), [20, 31]);
  assert.deepEqual(filterYearEntries(data, { search: "lisboa" }).map((e) => e.id), [31]);
  assert.deepEqual(filterYearEntries(data, { search: "SÚPER" }).map((e) => e.id), [10]);
});

test("sumEntries totals income and expense separately", () => {
  assert.deepEqual(sumEntries(filterYearEntries(yearData(), { month: 1 })), {
    income: 120,
    expense: 170.5,
    count: 4,
  });
});

test("summarizeYear reports annual totals consistent with the month chain", () => {
  const summary = summarizeYear(yearData());
  const [jan, feb] = summary.months;

  assert.equal(summary.year, 2026);
  assert.equal(summary.totals.totalIncome, round(jan.totalIncome + feb.totalIncome));
  assert.equal(summary.totals.finalBalance, feb.endingBalance);
  assert.equal(summary.totals.savedAmount, round(feb.endingBalance - 1000));
  assert.equal(summary.totals.investedAmount, 250, "fixed investment plus investment-flagged entries");
  assert.equal(summary.totals.savingsRate, Number((summary.totals.savedAmount / summary.totals.totalIncome).toFixed(4)));
});

test("describeMonth exposes balances, fixed figures and entries", () => {
  const data = yearData() as { months: Parameters<typeof describeMonth>[1][] };
  const month = describeMonth(2026, data.months[0]);
  assert.equal(month.month, 1);
  assert.equal(month.startingBalance, 1000);
  assert.equal(month.fixedExpenses.home, 500);
  assert.equal(month.totalInvestment, 150);
  assert.equal(month.entries.length, 4);
});

function round(value: number) {
  return Math.round(value * 100) / 100;
}
