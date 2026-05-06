import type { YearData } from "./types";

export interface EvolutionYearMetric {
  year: number;
  startingBalance: number;
  finalBalance: number;
  savedAmount: number;
  investedAmount: number;
  accumulatedInvested: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number | null;
}

export interface EvolutionSummary {
  latestFinalBalance: number;
  totalSaved: number;
  averageSavingsPerYear: number;
  accumulatedInvested: number;
  totalWealth: number;
  bestYear: {
    year: number;
    savedAmount: number;
  } | null;
}

export function deriveEvolutionMetrics(years: YearData[]): EvolutionYearMetric[] {
  const sortedYears = [...years].sort((a, b) => a.config.year - b.config.year);
  let accumulatedInvested = 0;
  const metrics: EvolutionYearMetric[] = [];

  for (const yearData of sortedYears) {
    const december = yearData.months.find((month) => month.month === 12);
    if (!december) continue;

    const investedAmount = yearData.months.reduce((sum, month) => sum + month.investment, 0);
    const totalIncome = yearData.months.reduce((sum, month) => sum + month.totalIncome, 0);
    const totalExpenses = yearData.months.reduce((sum, month) => sum + month.totalExpenses, 0);
    const savedAmount = december.endingBalance - yearData.config.startingBalance;
    accumulatedInvested += investedAmount;

    metrics.push({
      year: yearData.config.year,
      startingBalance: yearData.config.startingBalance,
      finalBalance: december.endingBalance,
      savedAmount,
      investedAmount,
      accumulatedInvested,
      totalIncome,
      totalExpenses,
      savingsRate: totalIncome > 0 ? savedAmount / totalIncome : null,
    });
  }

  return metrics;
}

export function summarizeEvolutionMetrics(metrics: EvolutionYearMetric[]): EvolutionSummary {
  const latest = metrics.at(-1);
  const best = metrics.reduce<EvolutionYearMetric | null>((currentBest, metric) => {
    if (!currentBest || metric.savedAmount > currentBest.savedAmount) return metric;
    return currentBest;
  }, null);

  const latestFinalBalance = latest?.finalBalance ?? 0;
  const accumulatedInvested = latest?.accumulatedInvested ?? 0;
  const totalSaved = metrics.reduce((sum, metric) => sum + metric.savedAmount, 0);
  return {
    latestFinalBalance,
    totalSaved,
    averageSavingsPerYear: metrics.length > 0 ? totalSaved / metrics.length : 0,
    accumulatedInvested,
    totalWealth: latestFinalBalance + accumulatedInvested,
    bestYear: best ? { year: best.year, savedAmount: best.savedAmount } : null,
  };
}
