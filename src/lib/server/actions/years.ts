"use server";

import { db } from "@/db";
import { additionalEntries, monthlyRecurringExpenses, months, yearRecurringExpenses, years } from "@/db/schema";
import { asc, and, eq, inArray, isNull } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { deriveStartingBalance, shouldAllowYearCreation } from "@/lib/server/year-planning";
import { getSessionUser } from "@/lib/server/session";
import { getYearData } from "@/lib/server/year-data";
import { computeMonthChain, estimatedMonthData } from "@/lib/calculations";
import type { YearConfig } from "@/lib/types";
import type { RecurringExpenseInput } from "@/lib/recurring-expenses";
import { revalidatePath } from "next/cache";

export async function createAndPrefillYear(data: {
  year: number;
  startingBalance: number;
  estimatedSalary: number;
  hasExtraPayments: boolean;
  estimatedExtraPayment: number;
  monthlyInvestment: number;
  monthlyHomeExpense: number;
  monthlyPersonalBudget: number;
  interestRate: number;
  recurringExpenses: RecurringExpenseInput[];
}) {
  const user = await getSessionUser();
  if (!user?.id) throw new Error("Unauthorized");

  const existingYears = await db
    .select({ year: years.year })
    .from(years)
    .where(eq(years.userId, user.id))
    .orderBy(asc(years.year));

  if (!shouldAllowYearCreation(existingYears.map((row) => row.year), data.year, data.year)) {
    throw new Error("Only the next year can be created");
  }

  // Handle derived starting balance if it's 0 and there's a previous year
  let finalStartingBalance = data.startingBalance;
  const latestYear = existingYears.at(-1)?.year;
  if (finalStartingBalance === 0 && latestYear !== undefined) {
    const previousYearData = await getYearData(user.id, latestYear);
    if (previousYearData) {
      finalStartingBalance = deriveStartingBalance(previousYearData);
    }
  }

  // 1. Insert Year Config
  const [yearRow] = await db
    .insert(years)
    .values({
      userId: user.id,
      year: data.year,
      startingBalance: String(finalStartingBalance),
      estimatedSalary: String(data.estimatedSalary),
      hasExtraPayments: data.hasExtraPayments,
      estimatedExtraPayment: String(data.estimatedExtraPayment),
      monthlyInvestment: String(data.monthlyInvestment),
      monthlyHomeExpense: String(data.monthlyHomeExpense),
      monthlyPersonalBudget: String(data.monthlyPersonalBudget),
      interestRate: String(data.interestRate),
    })
    .returning();

  // 2. Insert Recurring Expense Templates
  if (data.recurringExpenses.length > 0) {
    const recurringValues = data.recurringExpenses
      .map((entry, index) => ({
        yearId: yearRow.id,
        label: String(entry.label ?? "").trim(),
        amount: String(Number(entry.amount) || 0),
        sortOrder: index,
      }))
      .filter((entry) => entry.label.length > 0);

    if (recurringValues.length > 0) {
      await db.insert(yearRecurringExpenses).values(recurringValues);
    }
  }

  // 3. Prefill Months
  const config: YearConfig = {
    id: yearRow.id,
    year: yearRow.year,
    startingBalance: finalStartingBalance,
    estimatedSalary: data.estimatedSalary,
    hasExtraPayments: data.hasExtraPayments,
    estimatedExtraPayment: data.estimatedExtraPayment,
    monthlyInvestment: data.monthlyInvestment,
    monthlyHomeExpense: data.monthlyHomeExpense,
    monthlyPersonalBudget: data.monthlyPersonalBudget,
    interestRate: data.interestRate,
  };

  const computedMonths = computeMonthChain(
    Array.from({ length: 12 }, (_, i) => ({
      id: 0,
      yearId: yearRow.id,
      ...estimatedMonthData(i + 1, config),
    })),
    config.startingBalance,
    config.interestRate
  );

  const monthValues = computedMonths.map((month) => ({
    yearId: yearRow.id,
    month: month.month,
    homeExpense: String(month.homeExpense),
    personalExpense: String(month.personalExpense),
    investment: String(month.investment),
    payslip: String(month.payslip),
    additionalPayslip: String(month.additionalPayslip),
    interests: String(month.interests),
    interestsManualOverride: month.interestsManualOverride,
    personalRemaining: String(month.personalRemaining),
  }));

  const insertedMonths = await db.insert(months).values(monthValues).returning();

  // 4. Link Recurring Expenses to Months
  const templates = await db
    .select()
    .from(yearRecurringExpenses)
    .where(eq(yearRecurringExpenses.yearId, yearRow.id))
    .orderBy(asc(yearRecurringExpenses.sortOrder), asc(yearRecurringExpenses.id));

  if (templates.length > 0) {
    await db.insert(monthlyRecurringExpenses).values(
      insertedMonths.flatMap((month) =>
        templates.map((template) => ({
          monthId: month.id,
          yearRecurringExpenseId: template.id,
          label: template.label,
          amount: template.amount,
          sortOrder: template.sortOrder,
        }))
      )
    );
  }

  // 4b. Copy recurring additional entries from previous year
  const previousYear = await db.query.years.findFirst({
    where: and(eq(years.userId, user.id), eq(years.year, data.year - 1)),
  });

  if (previousYear) {
    const previousMonths = await db
      .select()
      .from(months)
      .where(eq(months.yearId, previousYear.id));

    if (previousMonths.length > 0) {
      const recurringEntries = await db
        .select()
        .from(additionalEntries)
        .where(
          and(
            inArray(additionalEntries.monthId, previousMonths.map((m) => m.id)),
            eq(additionalEntries.isRecurring, true),
            isNull(additionalEntries.groupId)
          )
        );

      if (recurringEntries.length > 0) {
        const newMonthByNumber = new Map(insertedMonths.map((m) => [m.month, m.id]));
        const prevMonthNumberById = new Map(previousMonths.map((m) => [m.id, m.month]));

        const entriesToInsert = recurringEntries
          .filter((e) => {
            const monthNumber = prevMonthNumberById.get(e.monthId);
            return monthNumber !== undefined && newMonthByNumber.has(monthNumber);
          })
          .map((e) => ({
            monthId: newMonthByNumber.get(prevMonthNumberById.get(e.monthId)!)!,
            type: e.type as "income" | "expense",
            label: e.label,
            amount: e.amount,
            isRecurring: true,
            groupId: null,
          }));

        if (entriesToInsert.length > 0) {
          await db.insert(additionalEntries).values(entriesToInsert);
        }
      }
    }
  }

  // 5. Propagate Carry Over
  await propagateYearCarryOver(user.id, data.year);

  // 6. Invalidate Cache
  revalidatePath("/", "layout");

  return { success: true };
}
