import { getNextCreatableYear } from "./year-navigation";

export function shouldAllowYearCreation(
  existingYears: number[],
  fallbackYear: number,
  requestedYear: number,
) {
  return requestedYear === getNextCreatableYear(existingYears, fallbackYear);
}

export function deriveStartingBalance(previousYear: {
  months: Array<{ month: number; endingBalance: number }>;
}) {
  const december = previousYear.months.find((month) => month.month === 12);

  if (!december) {
    throw new Error("Previous year is missing December data");
  }

  return Math.round((december.endingBalance + Number.EPSILON) * 100) / 100;
}
