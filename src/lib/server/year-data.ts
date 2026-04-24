import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { additionalEntries, months, years } from "@/db/schema";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { computeMonthChain } from "@/lib/calculations";
import type { YearData } from "@/lib/types";

export function pickDefaultYear(availableYears: number[], currentYear: number) {
  if (availableYears.includes(currentYear)) return currentYear;

  const sortedYears = [...availableYears].sort((a, b) => b - a);
  return sortedYears[0] ?? currentYear;
}

export async function getYearData(userId: string, year: number): Promise<YearData | null> {
  const yearRow = await db.query.years.findFirst({
    where: and(eq(years.userId, userId), eq(years.year, year)),
  });
  if (!yearRow) return null;

  const monthRows = await db
    .select()
    .from(months)
    .where(eq(months.yearId, yearRow.id))
    .orderBy(asc(months.month));

  const allEntries =
    monthRows.length > 0
      ? await db
          .select()
          .from(additionalEntries)
          .where(inArray(additionalEntries.monthId, monthRows.map((month) => month.id)))
      : [];

  const entriesByMonthId = new Map<number, typeof allEntries>();
  for (const entry of allEntries) {
    if (!entriesByMonthId.has(entry.monthId)) entriesByMonthId.set(entry.monthId, []);
    entriesByMonthId.get(entry.monthId)!.push(entry);
  }

  const rawMonths = monthRows.map((month) => {
    const entries = entriesByMonthId.get(month.id) ?? [];

    return {
      id: month.id,
      yearId: month.yearId,
      month: month.month,
      homeExpense: parseFloat(month.homeExpense),
      personalExpense: parseFloat(month.personalExpense),
      investment: parseFloat(month.investment),
      payslip: parseFloat(month.payslip),
      additionalPayslip: parseFloat(month.additionalPayslip),
      bonus: parseFloat(month.bonus),
      interests: parseFloat(month.interests),
      interestsManualOverride: month.interestsManualOverride,
      personalRemaining: parseFloat(month.personalRemaining),
      additionalExpenses: sortAdditionalEntriesDesc(
        entries
          .filter((entry) => entry.type === "expense")
          .map((entry) => ({
            id: entry.id,
            monthId: entry.monthId,
            type: "expense" as const,
            label: entry.label,
            amount: parseFloat(entry.amount),
          }))
      ),
      additionalIncomes: sortAdditionalEntriesDesc(
        entries
          .filter((entry) => entry.type === "income")
          .map((entry) => ({
            id: entry.id,
            monthId: entry.monthId,
            type: "income" as const,
            label: entry.label,
            amount: parseFloat(entry.amount),
          }))
      ),
    };
  });

  return {
    config: {
      id: yearRow.id,
      year: yearRow.year,
      startingBalance: parseFloat(yearRow.startingBalance),
      estimatedSalary: parseFloat(yearRow.estimatedSalary),
      hasExtraPayments: yearRow.hasExtraPayments,
      estimatedExtraPayment: parseFloat(yearRow.estimatedExtraPayment),
      monthlyInvestment: parseFloat(yearRow.monthlyInvestment),
      monthlyHomeExpense: parseFloat(yearRow.monthlyHomeExpense),
      monthlyPersonalBudget: parseFloat(yearRow.monthlyPersonalBudget),
      interestRate: parseFloat(yearRow.interestRate),
    },
    months: computeMonthChain(
      rawMonths,
      parseFloat(yearRow.startingBalance),
      parseFloat(yearRow.interestRate)
    ),
  };
}

export async function getYears(): Promise<number[]> {
  throw new Error("getYears(userId) must be used with an authenticated user");
}

export async function getYearsForUser(userId: string): Promise<number[]> {
  const rows = await db
    .select({ year: years.year })
    .from(years)
    .where(eq(years.userId, userId))
    .orderBy(asc(years.year));
  return rows.map((row) => row.year);
}

export async function getAppRedirectPath(userId: string, currentYear: number) {
  const userYears = await getYearsForUser(userId);
  if (userYears.length === 0) {
    return `/setup/${currentYear}`;
  }

  const targetYear = pickDefaultYear(userYears, currentYear);
  const defaultMonth = currentYear === targetYear ? new Date().getMonth() + 1 : 1;
  return `/${targetYear}/${defaultMonth}`;
}
