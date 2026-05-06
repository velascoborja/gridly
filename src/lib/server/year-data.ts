import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { additionalEntries, monthlyRecurringExpenses, months, yearRecurringExpenses, years } from "@/db/schema";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { computeMonthChain } from "@/lib/calculations";
import {
  parseMonthlyRecurringExpense,
  parseYearRecurringExpense,
  sortRecurringExpensesAsc,
} from "@/lib/recurring-expenses";
import type { YearData } from "@/lib/types";
import { pickDefaultYear } from "./year-navigation";

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

  const recurringTemplates = await db
    .select()
    .from(yearRecurringExpenses)
    .where(eq(yearRecurringExpenses.yearId, yearRow.id))
    .orderBy(asc(yearRecurringExpenses.sortOrder), asc(yearRecurringExpenses.id));

  const allEntries =
    monthRows.length > 0
      ? await db
          .select()
          .from(additionalEntries)
          .where(inArray(additionalEntries.monthId, monthRows.map((month) => month.id)))
      : [];

  const allRecurringExpenses =
    monthRows.length > 0
      ? await db
          .select()
          .from(monthlyRecurringExpenses)
          .where(inArray(monthlyRecurringExpenses.monthId, monthRows.map((month) => month.id)))
      : [];

  const entriesByMonthId = new Map<number, typeof allEntries>();
  for (const entry of allEntries) {
    if (!entriesByMonthId.has(entry.monthId)) entriesByMonthId.set(entry.monthId, []);
    entriesByMonthId.get(entry.monthId)!.push(entry);
  }

  const recurringExpensesByMonthId = new Map<number, typeof allRecurringExpenses>();
  for (const entry of allRecurringExpenses) {
    if (!recurringExpensesByMonthId.has(entry.monthId)) recurringExpensesByMonthId.set(entry.monthId, []);
    recurringExpensesByMonthId.get(entry.monthId)!.push(entry);
  }

  const rawMonths = monthRows.map((month) => {
    const entries = entriesByMonthId.get(month.id) ?? [];
    const recurringExpenses = recurringExpensesByMonthId.get(month.id) ?? [];

    return {
      id: month.id,
      yearId: month.yearId,
      month: month.month,
      homeExpense: parseFloat(month.homeExpense),
      homeExpenseManualOverride: month.homeExpenseManualOverride,
      personalExpense: parseFloat(month.personalExpense),
      personalExpenseManualOverride: month.personalExpenseManualOverride,
      investment: parseFloat(month.investment),
      investmentManualOverride: month.investmentManualOverride,
      payslip: parseFloat(month.payslip),
      payslipManualOverride: month.payslipManualOverride,
      additionalPayslip: parseFloat(month.additionalPayslip),
      additionalPayslipManualOverride: month.additionalPayslipManualOverride,
      interests: parseFloat(month.interests),
      interestsManualOverride: month.interestsManualOverride,
      personalRemaining: parseFloat(month.personalRemaining),
      recurringExpenses: sortRecurringExpensesAsc(recurringExpenses.map(parseMonthlyRecurringExpense)),
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
    recurringExpenses: sortRecurringExpensesAsc(recurringTemplates.map(parseYearRecurringExpense)),
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

export async function getAllYearDataForUser(userId: string): Promise<YearData[]> {
  const userYears = await getYearsForUser(userId);
  const yearData = await Promise.all(userYears.map((year) => getYearData(userId, year)));
  return yearData.filter((data): data is YearData => data !== null);
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
