import test from "node:test";
import assert from "node:assert/strict";
import { computeMonthChain, totalExpenses } from "./calculations.ts";
import {
  applyRecurringSeriesTag,
  hasInvalidRecurringExpenseAmounts,
  normalizeRecurringExpenseInputs,
  RECURRING_EXPENSE_AMOUNT_ERROR,
  sortRecurringExpensesAsc,
  sumRecurringExpenses,
  parseYearRecurringExpense,
  parseMonthlyRecurringExpense,
} from "./recurring-expenses.ts";
import type { RecurringExpense, Tag, YearRecurringExpense } from "./types.ts";

const recurringExpenses: RecurringExpense[] = [
  { id: 2, monthId: 1, yearRecurringExpenseId: 2, label: "Gimnasio", amount: 45, sortOrder: 2, tagId: null, tag: null },
  { id: 1, monthId: 1, yearRecurringExpenseId: 1, label: "Alquiler", amount: 900, sortOrder: 1, tagId: null, tag: null },
  { id: 3, monthId: 1, yearRecurringExpenseId: null, label: "Parking", amount: 80, sortOrder: 1, tagId: null, tag: null },
];

test("recurring expenses sort by sort order and then id", () => {
  assert.deepEqual(sortRecurringExpensesAsc(recurringExpenses).map((entry) => entry.id), [1, 3, 2]);
});

test("recurring expense totals sum all monthly rows", () => {
  assert.equal(sumRecurringExpenses(recurringExpenses), 1025);
});

test("recurring expense inputs reject negative and non-finite labeled amounts", () => {
  for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY, "12", null]) {
    const entries = [{ label: "Rent", amount }];
    assert.equal(hasInvalidRecurringExpenseAmounts(entries), true);
    assert.throws(
      () => normalizeRecurringExpenseInputs(entries as never),
      (error: unknown) => error instanceof RangeError && error.message === RECURRING_EXPENSE_AMOUNT_ERROR,
    );
  }
});

test("recurring expense inputs accept zero and preserve template identity", () => {
  assert.deepEqual(
    normalizeRecurringExpenseInputs([{ id: 17, label: "  Rent  ", amount: 0 }]),
    [{ id: 17, label: "Rent", amount: 0, sortOrder: 0 }],
  );
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
      additionalExpenses: [{ id: 10, monthId: 1, type: "expense", label: "Cena", amount: 60, isRecurring: false, isInvestment: false, isCompleted: false, tagId: null, tag: null }],
      additionalExpenseGroups: [],
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
        additionalExpenseGroups: [],
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
        additionalExpenseGroups: [],
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

test("parseYearRecurringExpense carries tagId through (null default)", () => {
  const result = parseYearRecurringExpense({
    id: 1, yearId: 9, label: "Rent", amount: "100.00", sortOrder: 0, tagId: null,
  });
  assert.equal(result.tagId, null);
});

test("parseYearRecurringExpense carries a numeric tagId", () => {
  const result = parseYearRecurringExpense({
    id: 1, yearId: 9, label: "Rent", amount: "100.00", sortOrder: 0, tagId: 7,
  });
  assert.equal(result.tagId, 7);
});

test("parseMonthlyRecurringExpense carries tagId and defaults tag to null", () => {
  const result = parseMonthlyRecurringExpense({
    id: 2, monthId: 3, yearRecurringExpenseId: 1, label: "Rent", amount: "100.00", sortOrder: 0, tagId: 7,
  });
  assert.equal(result.tagId, 7);
  assert.equal(result.tag, null);
});

test("parseMonthlyRecurringExpense attaches a resolved tag when passed", () => {
  const tag = { id: 7, name: "Hogar", color: "blue" };
  const result = parseMonthlyRecurringExpense(
    { id: 2, monthId: 3, yearRecurringExpenseId: 1, label: "Rent", amount: "100.00", sortOrder: 0, tagId: 7 },
    tag,
  );
  assert.deepEqual(result.tag, tag);
});

test("retagging a recurring series updates its template and every linked monthly copy only", () => {
  const tag: Tag = { id: 7, name: "Casa", color: "blue" };
  const templates: YearRecurringExpense[] = [
    { id: 1, yearId: 1, label: "Alquiler", amount: 900, sortOrder: 1, tagId: null },
    { id: 2, yearId: 1, label: "Gimnasio", amount: 45, sortOrder: 2, tagId: null },
  ];
  const months = [
    { month: 1, recurringExpenses },
    {
      month: 2,
      recurringExpenses: [
        { id: 11, monthId: 2, yearRecurringExpenseId: 1, label: "Alquiler", amount: 900, sortOrder: 1, tagId: null, tag: null },
      ],
    },
    {
      month: 3,
      recurringExpenses: [
        { id: 21, monthId: 3, yearRecurringExpenseId: 2, label: "Gimnasio", amount: 45, sortOrder: 2, tagId: null, tag: null },
      ],
    },
  ];
  const input = structuredClone({ recurringExpenses: templates, months });

  const result = applyRecurringSeriesTag(input, 1, tag.id, tag);

  assert.deepEqual(result.recurringExpenses.map((template) => template.tagId), [7, null]);
  assert.deepEqual(
    result.months.flatMap((month) => month.recurringExpenses.map((entry) => [entry.id, entry.tagId, entry.tag?.id ?? null])),
    [[2, null, null], [1, 7, 7], [3, null, null], [11, 7, 7], [21, null, null]]
  );
  assert.equal(result.months[2], input.months[2], "months without the series keep their identity");
  assert.deepEqual(input, { recurringExpenses: templates, months }, "input is not mutated");
});
