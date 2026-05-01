import test from "node:test";
import assert from "node:assert/strict";
import { computeMonthChain, totalExpenses } from "./calculations.ts";
import { sortRecurringExpensesAsc, sumRecurringExpenses } from "./recurring-expenses.ts";
import type { RecurringExpense } from "./types.ts";

const recurringExpenses: RecurringExpense[] = [
  { id: 2, monthId: 1, yearRecurringExpenseId: 2, label: "Gimnasio", amount: 45, sortOrder: 2 },
  { id: 1, monthId: 1, yearRecurringExpenseId: 1, label: "Alquiler", amount: 900, sortOrder: 1 },
  { id: 3, monthId: 1, yearRecurringExpenseId: null, label: "Parking", amount: 80, sortOrder: 1 },
];

test("recurring expenses sort by sort order and then id", () => {
  assert.deepEqual(sortRecurringExpensesAsc(recurringExpenses).map((entry) => entry.id), [1, 3, 2]);
});

test("recurring expense totals sum all monthly rows", () => {
  assert.equal(sumRecurringExpenses(recurringExpenses), 1025);
});

test("total expenses include recurring expenses", () => {
  assert.equal(
    totalExpenses({
      id: 1,
      yearId: 1,
      month: 1,
      homeExpense: 500,
      personalExpense: 300,
      investment: 200,
      payslip: 2500,
      additionalPayslip: 0,
      interests: 0,
      interestsManualOverride: false,
      personalRemaining: 0,
      recurringExpenses,
      additionalExpenses: [{ id: 10, monthId: 1, type: "expense", label: "Cena", amount: 60 }],
      additionalIncomes: [],
    }),
    2085
  );
});

test("month chain includes recurring expenses in savings and downstream balances", () => {
  const months = computeMonthChain(
    [
      {
        id: 1,
        yearId: 1,
        month: 1,
        homeExpense: 500,
        personalExpense: 300,
        investment: 200,
        payslip: 2500,
        additionalPayslip: 0,
        interests: 0,
        interestsManualOverride: true,
        personalRemaining: 0,
        recurringExpenses,
        additionalExpenses: [],
        additionalIncomes: [],
      },
      {
        id: 2,
        yearId: 1,
        month: 2,
        homeExpense: 500,
        personalExpense: 300,
        investment: 200,
        payslip: 2500,
        additionalPayslip: 0,
        interests: 0,
        interestsManualOverride: true,
        personalRemaining: 0,
        recurringExpenses: [],
        additionalExpenses: [],
        additionalIncomes: [],
      },
    ],
    1000
  );

  assert.equal(months[0].totalExpenses, 2025);
  assert.equal(months[0].savings, 475);
  assert.equal(months[0].endingBalance, 1475);
  assert.equal(months[1].startingBalance, 1475);
});
