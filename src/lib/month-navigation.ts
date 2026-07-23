import { formatMonthName } from "./utils.ts";

export interface MonthNavigationOption {
  month: number;
  label: string;
}

function normalizeMonthSearch(value: string, locale: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase(locale)
    .trim();
}

export function buildMonthNavigationOptions(locale: string): MonthNavigationOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      month,
      label: formatMonthName(month, locale),
    };
  });
}

export function filterMonthNavigationOptions(
  options: MonthNavigationOption[],
  query: string,
  locale: string,
): MonthNavigationOption[] {
  const normalizedQuery = normalizeMonthSearch(query, locale);
  if (!normalizedQuery) return options;

  return options.filter((option) =>
    normalizeMonthSearch(option.label, locale).startsWith(normalizedQuery)
  );
}
