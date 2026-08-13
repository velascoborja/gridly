export const APPLY_FROM_MONTH_ERROR = "applyFromMonth must be an integer between 1 and 12";

export function parseApplyFromMonth(value: unknown): number | null {
  if (value === undefined) return 1;

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 12
    ? value
    : null;
}
