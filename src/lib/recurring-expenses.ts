import type { RecurringExpense, Tag, YearRecurringExpense } from "./types";

export type RecurringExpenseInput = {
  id?: number | null;
  label: string;
  amount: number;
};

export const RECURRING_EXPENSE_AMOUNT_ERROR = "recurring_expense_amount_invalid";
export const RECURRING_EXPENSE_IDENTITY_ERROR = "recurring_expense_identity_invalid";

export function isValidRecurringExpenseAmount(amount: unknown): amount is number {
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
}

export function hasInvalidRecurringExpenseAmounts(
  entries: unknown[]
): boolean {
  return entries.some((entry) => {
    if (entry === null || typeof entry !== "object") return true;
    const candidate = entry as { label?: unknown; amount?: unknown };
    if (typeof candidate.label !== "string") return true;
    return !isValidRecurringExpenseAmount(candidate.amount);
  });
}

export function sortRecurringExpensesAsc<T extends { id: number; sortOrder: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function sumRecurringExpenses(entries: Array<Pick<RecurringExpense, "amount">>): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export function normalizeRecurringExpenseInputs(entries: RecurringExpenseInput[]) {
  if (hasInvalidRecurringExpenseAmounts(entries)) {
    throw new RangeError(RECURRING_EXPENSE_AMOUNT_ERROR);
  }

  return entries
    .map((entry, index) => ({
      id: entry.id ?? null,
      label: entry.label.trim(),
      amount: entry.amount,
      sortOrder: index,
    }))
    .filter((entry) => entry.label.length > 0);
}

export function parseYearRecurringExpense(row: {
  id: number;
  yearId: number;
  label: string;
  amount: string;
  sortOrder: number;
  tagId: number | null;
}): YearRecurringExpense {
  return {
    id: row.id,
    yearId: row.yearId,
    label: row.label,
    amount: parseFloat(row.amount),
    sortOrder: row.sortOrder,
    tagId: row.tagId ?? null,
  };
}

export function parseMonthlyRecurringExpense(
  row: {
    id: number;
    monthId: number;
    yearRecurringExpenseId: number | null;
    label: string;
    amount: string;
    sortOrder: number;
    tagId: number | null;
  },
  tag: Tag | null = null,
): RecurringExpense {
  return {
    id: row.id,
    monthId: row.monthId,
    yearRecurringExpenseId: row.yearRecurringExpenseId,
    label: row.label,
    amount: parseFloat(row.amount),
    sortOrder: row.sortOrder,
    tagId: row.tagId ?? null,
    tag,
  };
}
