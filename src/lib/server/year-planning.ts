export function shouldAllowYearCreation(
  existingYears: number[],
  calendarYear: number,
  requestedYear: number,
) {
  if (!Number.isInteger(requestedYear)) return false;
  if (existingYears.length === 0) return true;

  const latestYear = Math.max(...existingYears);
  return requestedYear === latestYear + 1 ||
    (requestedYear === calendarYear && requestedYear > latestYear);
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
