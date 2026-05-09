import type { AdditionalEntry, RecurringExpense, YearRecurringExpense } from "../types.ts";
import { parseMonthlyRecurringExpense, parseYearRecurringExpense } from "../recurring-expenses.ts";
import { decryptField, encryptField } from "./protected-fields.ts";

export function protectFreeTextLabel(label: unknown): string {
  const normalized = String(label ?? "").trim();
  return encryptField(normalized);
}

export function revealFreeTextLabel(label: string): string {
  return decryptField(label) ?? "";
}

export function parseProtectedAdditionalEntry(row: {
  id: number;
  monthId: number;
  type: string;
  label: string;
  amount: string;
}): AdditionalEntry {
  return {
    id: row.id,
    monthId: row.monthId,
    type: row.type === "income" ? "income" : "expense",
    label: revealFreeTextLabel(row.label),
    amount: parseFloat(row.amount),
  };
}

export function parseProtectedYearRecurringExpense(row: {
  id: number;
  yearId: number;
  label: string;
  amount: string;
  sortOrder: number;
}): YearRecurringExpense {
  return parseYearRecurringExpense({
    ...row,
    label: revealFreeTextLabel(row.label),
  });
}

export function parseProtectedMonthlyRecurringExpense(row: {
  id: number;
  monthId: number;
  yearRecurringExpenseId: number | null;
  label: string;
  amount: string;
  sortOrder: number;
}): RecurringExpense {
  return parseMonthlyRecurringExpense({
    ...row,
    label: revealFreeTextLabel(row.label),
  });
}
