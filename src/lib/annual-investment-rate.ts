export function calculateInvestmentRate(investedAmount: number, totalIncome: number | null): number | null {
  return totalIncome !== null && totalIncome > 0 ? investedAmount / totalIncome : null;
}
