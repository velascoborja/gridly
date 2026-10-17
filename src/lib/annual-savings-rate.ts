export function calculateSavingsRate(savings: number, totalIncome: number): number | null {
  return totalIncome > 0 ? savings / totalIncome : null;
}

export function formatSavingsRate(rate: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rate);
}
