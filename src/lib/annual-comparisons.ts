import type { EvolutionYearMetric } from "./evolution";

export interface AnnualKpiComparisonData {
  previousYear: {
    year: number;
    savedAmount: number;
    finalBalance: number;
  } | null;
  averageSavings: number | null;
}

export function deriveAnnualKpiComparison(
  metrics: EvolutionYearMetric[],
  currentYear: number
): AnnualKpiComparisonData {
  const comparisonMetrics = metrics.filter((metric) => metric.year !== currentYear);
  const previousMetric = metrics
    .filter((metric) => metric.year < currentYear)
    .sort((a, b) => b.year - a.year)
    .at(0);

  return {
    previousYear: previousMetric
      ? {
          year: previousMetric.year,
          savedAmount: previousMetric.savedAmount,
          finalBalance: previousMetric.finalBalance,
        }
      : null,
    averageSavings:
      comparisonMetrics.length > 0
        ? comparisonMetrics.reduce((sum, metric) => sum + metric.savedAmount, 0) / comparisonMetrics.length
        : null,
  };
}
