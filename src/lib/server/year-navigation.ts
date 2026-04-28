export function getNextCreatableYear(existingYears: number[], fallbackYear: number): number {
  if (existingYears.length === 0) {
    return fallbackYear;
  }

  return Math.max(...existingYears) + 1;
}

export function pickDefaultYear(availableYears: number[], currentYear: number): number {
  if (availableYears.includes(currentYear)) return currentYear;
  if (availableYears.length === 0) return currentYear;

  return Math.max(...availableYears);
}
