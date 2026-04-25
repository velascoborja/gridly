import type { RecurringExpense, YearRecurringExpense } from "./types";

export type RecurringExpenseInput = {
  label: string;
  amount: number;
};

export function sortRecurringExpensesAsc<T extends { id: number; sortOrder: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function sumRecurringExpenses(entries: Array<Pick<RecurringExpense, "amount">>): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export function normalizeRecurringExpenseInputs(entries: RecurringExpenseInput[]) {
  return entries
    .map((entry, index) => ({
      label: entry.label.trim(),
      amount: Number(entry.amount),
      sortOrder: index,
    }))
    .filter((entry) => entry.label.length > 0 && Number.isFinite(entry.amount));
}

export function parseYearRecurringExpense(row: {
  id: number;
  yearId: number;
  label: string;
  amount: string;
  sortOrder: number;
}): YearRecurringExpense {
  return {
    id: row.id,
    yearId: row.yearId,
    label: row.label,
    amount: parseFloat(row.amount),
    sortOrder: row.sortOrder,
  };
}

export function parseMonthlyRecurringExpense(row: {
  id: number;
  monthId: number;
  yearRecurringExpenseId: number | null;
  label: string;
  amount: string;
  sortOrder: number;
}): RecurringExpense {
  return {
    id: row.id,
    monthId: row.monthId,
    yearRecurringExpenseId: row.yearRecurringExpenseId,
    label: row.label,
    amount: parseFloat(row.amount),
    sortOrder: row.sortOrder,
  };
}
