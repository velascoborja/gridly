import type { YearData } from "./types";

export type EvolutionMetricSource =
  | { source: "gridly"; yearData: YearData }
  | {
      source: "historical";
      year: number;
      startingBalance: number;
      finalBalance: number;
      investedAmount: number;
    };

export interface EvolutionYearMetric {
  source: "gridly" | "historical";
  year: number;
  startingBalance: number;
  finalBalance: number;
  savedAmount: number;
  investedAmount: number;
  accumulatedInvested: number;
  totalIncome: number | null;
  totalExpenses: number | null;
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

export function deriveEvolutionMetrics(sources: EvolutionMetricSource[]): EvolutionYearMetric[] {
  const sortedSources = [...sources].sort((a, b) => {
    const aYear = a.source === "gridly" ? a.yearData.config.year : a.year;
    const bYear = b.source === "gridly" ? b.yearData.config.year : b.year;
    return aYear - bYear;
  });
  let accumulatedInvested = 0;
  const metrics: EvolutionYearMetric[] = [];

  for (const source of sortedSources) {
    if (source.source === "historical") {
      accumulatedInvested += source.investedAmount;
      metrics.push({
        source: "historical",
        year: source.year,
        startingBalance: source.startingBalance,
        finalBalance: source.finalBalance,
        savedAmount: source.finalBalance - source.startingBalance,
        investedAmount: source.investedAmount,
        accumulatedInvested,
        totalIncome: null,
        totalExpenses: null,
        savingsRate: null,
      });
      continue;
    }

    const yearData = source.yearData;
    const december = yearData.months.find((month) => month.month === 12);
    if (!december) continue;

    const investedAmount = yearData.months.reduce((sum, month) => sum + month.investment, 0);
    const totalIncome = yearData.months.reduce((sum, month) => sum + month.totalIncome, 0);
    const totalExpenses = yearData.months.reduce((sum, month) => sum + month.totalExpenses, 0);
    const savedAmount = december.endingBalance - yearData.config.startingBalance;
    accumulatedInvested += investedAmount;

    metrics.push({
      source: "gridly",
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
