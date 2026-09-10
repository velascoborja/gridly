export const GROUPED_ENTRY_TYPE_ERROR = "grouped_entry_must_be_expense";
export const GROUPED_ENTRY_RECURRING_ERROR = "grouped_entry_cannot_be_recurring";
export const GROUPED_ENTRY_MONTH_ERROR = "grouped_entry_month_mismatch";

export function validateGroupedEntryState(input: {
  type: unknown;
  isRecurring: boolean;
  entryMonthId: number;
  groupMonthId: number;
}): string | null {
  if (input.type !== "expense") return GROUPED_ENTRY_TYPE_ERROR;
  if (input.isRecurring) return GROUPED_ENTRY_RECURRING_ERROR;
  if (input.entryMonthId !== input.groupMonthId) return GROUPED_ENTRY_MONTH_ERROR;
  return null;
}
