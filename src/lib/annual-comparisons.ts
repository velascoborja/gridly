import { calculateMonthFinancials } from "./calculations.ts";

export interface AnnualKpiMetric {
  year: number;
  savedAmount: number;
  finalBalance: number;
}

export interface AnnualComparisonMonthInput {
  month: number;
  homeExpense: number;
  personalExpense: number;
  investment: number;
  payslip: number;
  additionalPayslip: number;
  interests: number;
  interestsManualOverride: boolean;
  personalRemaining: number;
  additionalIncome: number;
  additionalExpense: number;
  recurringExpense: number;
}

export interface AnnualComparisonYearInput {
  year: number;
  startingBalance: number;
  interestRate: number;
  months: AnnualComparisonMonthInput[];
}

export interface HistoricalComparisonInput {
  year: number;
  startingBalance: number;
  finalBalance: number;
}

export interface AnnualKpiComparisonData {
  previousYear: {
    year: number;
    savedAmount: number;
    finalBalance: number;
  } | null;
  averageSavings: number | null;
}

export function deriveAnnualKpiComparison(
  metrics: AnnualKpiMetric[],
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

export function deriveAnnualComparisonMetrics(
  gridlyYears: AnnualComparisonYearInput[],
  historicalYears: HistoricalComparisonInput[]
): AnnualKpiMetric[] {
  const gridlyMetrics = gridlyYears.flatMap((yearData): AnnualKpiMetric[] => {
    let runningBalance = yearData.startingBalance;
    let decemberBalance: number | null = null;

    for (const month of [...yearData.months].sort((a, b) => a.month - b.month)) {
      const financials = calculateMonthFinancials({
        ...month,
        startingBalance: runningBalance,
        interestRate: yearData.interestRate,
      });
      runningBalance = financials.endingBalance;
      if (month.month === 12) decemberBalance = financials.endingBalance;
    }

    return decemberBalance === null
      ? []
      : [{
          year: yearData.year,
          savedAmount: decemberBalance - yearData.startingBalance,
          finalBalance: decemberBalance,
        }];
  });

  return [
    ...historicalYears.map((year) => ({
      year: year.year,
      savedAmount: year.finalBalance - year.startingBalance,
      finalBalance: year.finalBalance,
    })),
    ...gridlyMetrics,
  ].sort((a, b) => a.year - b.year);
}
