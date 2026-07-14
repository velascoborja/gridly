import test from "node:test";
import assert from "node:assert/strict";
import { avgAdditionalEntriesPerMonth } from "./additional-entries.ts";
import type { MonthData } from "./types.ts";

function makeMonth(
  additionalExpenses: { id: number; amount: number }[],
  additionalIncomes: { id: number; amount: number }[]
): MonthData {
  return {
    id: 1,
    yearId: 1,
    month: 1,
    homeExpense: 0,
    homeExpenseManualOverride: false,
    personalExpense: 0,
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
    recurringExpenses: [],
    additionalExpenses: additionalExpenses.map((e) => ({
      ...e,
      monthId: 1,
      type: "expense" as const,
      label: "",
      isRecurring: false,
      isCompleted: false,
      tagId: null,
      tag: null,
    })),
    additionalExpenseGroups: [],
    additionalIncomes: additionalIncomes.map((e) => ({
      ...e,
      monthId: 1,
      type: "income" as const,
      label: "",
      isRecurring: false,
      isCompleted: false,
      tagId: null,
      tag: null,
    })),
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    startingBalance: 0,
    endingBalance: 0,
  };
}

test("avgAdditionalEntriesPerMonth divides total expenses by 12", () => {
  // Month 1 has 120 in additional expenses, months 2-12 have none
  const months: MonthData[] = [
    makeMonth([{ id: 1, amount: 120 }], []),
    ...Array.from({ length: 11 }, () => makeMonth([], [])),
  ];
  const result = avgAdditionalEntriesPerMonth(months, "expense");
  assert.strictEqual(result, 10); // 120 / 12
});

test("avgAdditionalEntriesPerMonth divides total incomes by 12", () => {
  // Two months each with 60 in additional incomes, rest have none
  const months: MonthData[] = [
    makeMonth([], [{ id: 1, amount: 60 }]),
    makeMonth([], [{ id: 2, amount: 60 }]),
    ...Array.from({ length: 10 }, () => makeMonth([], [])),
  ];
  const result = avgAdditionalEntriesPerMonth(months, "income");
  assert.strictEqual(result, 10); // 120 / 12
});

test("avgAdditionalEntriesPerMonth returns 0 when no entries exist", () => {
  const months: MonthData[] = Array.from({ length: 12 }, () => makeMonth([], []));
  assert.strictEqual(avgAdditionalEntriesPerMonth(months, "expense"), 0);
  assert.strictEqual(avgAdditionalEntriesPerMonth(months, "income"), 0);
});
