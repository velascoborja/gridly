export const PERSONAL_REMAINING_OUT_OF_RANGE = "PERSONAL_REMAINING_OUT_OF_RANGE";

export function isPersonalRemainingValid(budget: unknown, remaining: unknown): boolean {
  return typeof budget === "number" && Number.isFinite(budget)
    && typeof remaining === "number" && Number.isFinite(remaining)
    && budget >= 0 && remaining >= 0 && remaining <= budget;
}

export function personalRemainingConflicts(
  months: Array<{ month: number; personalRemaining: number }>,
  budget: unknown,
  applyFromMonth = 1,
): number[] {
  return months.filter((month) => month.month >= applyFromMonth
    && !isPersonalRemainingValid(budget, month.personalRemaining))
    .map((month) => month.month).sort((a, b) => a - b);
}
