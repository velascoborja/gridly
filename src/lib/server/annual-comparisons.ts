import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  additionalEntries,
  historicalYears,
  monthlyRecurringExpenses,
  months,
  years,
} from "@/db/schema";
import {
  deriveAnnualComparisonMetrics,
  deriveAnnualKpiComparison,
  type AnnualComparisonYearInput,
} from "@/lib/annual-comparisons";

export async function getAnnualKpiComparisonContextForUser(userId: string, currentYear: number) {
  const [yearMonthRows, additionalTotals, recurringTotals, historicalRows] = await Promise.all([
    db
      .select({
        yearId: years.id,
        year: years.year,
        startingBalance: years.startingBalance,
        interestRate: years.interestRate,
        monthId: months.id,
        month: months.month,
        homeExpense: months.homeExpense,
        personalExpense: months.personalExpense,
        investment: months.investment,
        payslip: months.payslip,
        additionalPayslip: months.additionalPayslip,
        interests: months.interests,
        interestsManualOverride: months.interestsManualOverride,
        personalRemaining: months.personalRemaining,
      })
      .from(years)
      .leftJoin(months, and(eq(months.yearId, years.id), ne(years.year, currentYear)))
      .where(eq(years.userId, userId))
      .orderBy(asc(years.year), asc(months.month)),
    db
      .select({
        monthId: additionalEntries.monthId,
        type: additionalEntries.type,
        total: sql<string>`sum(${additionalEntries.amount})`,
      })
      .from(additionalEntries)
      .innerJoin(months, eq(additionalEntries.monthId, months.id))
      .innerJoin(years, eq(months.yearId, years.id))
      .where(and(eq(years.userId, userId), ne(years.year, currentYear)))
      .groupBy(additionalEntries.monthId, additionalEntries.type),
    db
      .select({
        monthId: monthlyRecurringExpenses.monthId,
        total: sql<string>`sum(${monthlyRecurringExpenses.amount})`,
      })
      .from(monthlyRecurringExpenses)
      .innerJoin(months, eq(monthlyRecurringExpenses.monthId, months.id))
      .innerJoin(years, eq(months.yearId, years.id))
      .where(and(eq(years.userId, userId), ne(years.year, currentYear)))
      .groupBy(monthlyRecurringExpenses.monthId),
    db
      .select({
        year: historicalYears.year,
        startingBalance: historicalYears.startingBalance,
        finalBalance: historicalYears.finalBalance,
      })
      .from(historicalYears)
      .where(eq(historicalYears.userId, userId))
      .orderBy(asc(historicalYears.year)),
  ]);

  const additionalByMonth = new Map<number, { income: number; expense: number }>();
  for (const row of additionalTotals) {
    const totals = additionalByMonth.get(row.monthId) ?? { income: 0, expense: 0 };
    if (row.type === "income") totals.income = parseFloat(row.total);
    if (row.type === "expense") totals.expense = parseFloat(row.total);
    additionalByMonth.set(row.monthId, totals);
  }
  const recurringByMonth = new Map(recurringTotals.map((row) => [row.monthId, parseFloat(row.total)]));

  const gridlyYearsById = new Map<number, AnnualComparisonYearInput>();
  for (const row of yearMonthRows) {
    let yearData = gridlyYearsById.get(row.yearId);
    if (!yearData) {
      yearData = {
        year: row.year,
        startingBalance: parseFloat(row.startingBalance),
        interestRate: parseFloat(row.interestRate),
        months: [],
      };
      gridlyYearsById.set(row.yearId, yearData);
    }

    if (row.monthId === null || row.month === null) continue;
    const additional = additionalByMonth.get(row.monthId) ?? { income: 0, expense: 0 };
    yearData.months.push({
      month: row.month,
      homeExpense: parseFloat(row.homeExpense!),
      personalExpense: parseFloat(row.personalExpense!),
      investment: parseFloat(row.investment!),
      payslip: parseFloat(row.payslip!),
      additionalPayslip: parseFloat(row.additionalPayslip!),
      interests: parseFloat(row.interests!),
      interestsManualOverride: row.interestsManualOverride!,
      personalRemaining: parseFloat(row.personalRemaining!),
      additionalIncome: additional.income,
      additionalExpense: additional.expense,
      recurringExpense: recurringByMonth.get(row.monthId) ?? 0,
    });
  }

  const gridlyYears = [...gridlyYearsById.values()];
  const metrics = deriveAnnualComparisonMetrics(
    gridlyYears,
    historicalRows.map((row) => ({
      year: row.year,
      startingBalance: parseFloat(row.startingBalance),
      finalBalance: parseFloat(row.finalBalance),
    }))
  );

  return {
    years: gridlyYears.map((year) => year.year),
    comparison: deriveAnnualKpiComparison(metrics, currentYear),
  };
}
