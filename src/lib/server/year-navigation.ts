import type { YearOption } from "@/lib/types";

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

export function getGridlyYears(options: YearOption[]): number[] {
  return options.filter((option) => option.source === "gridly").map((option) => option.year);
}

export function getNextCreatableYearFromOptions(options: YearOption[], fallbackYear: number): number {
  return getNextCreatableYear(getGridlyYears(options), fallbackYear);
}

export function pickDefaultYearOption(options: YearOption[], currentYear: number): YearOption {
  const current = options.find((option) => option.year === currentYear && option.source === "gridly");
  if (current) return current;

  const gridlyOptions = options.filter((option) => option.source === "gridly");
  if (gridlyOptions.length > 0) {
    return gridlyOptions.reduce((latest, option) => option.year > latest.year ? option : latest);
  }

  return { year: currentYear, source: "gridly" };
}
