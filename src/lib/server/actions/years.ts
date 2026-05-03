"use server";

import { db } from "@/db";
import { monthlyRecurringExpenses, months, yearRecurringExpenses, years } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { deriveStartingBalance, shouldAllowYearCreation } from "@/lib/server/year-planning";
import { getSessionUser } from "@/lib/server/session";
import { ensureUserExists } from "@/lib/server/user-provisioning";
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

  await ensureUserExists(user);

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

  await db.transaction(async (tx) => {
    // 1. Insert Year Config
    const [yearRow] = await tx
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
        await tx.insert(yearRecurringExpenses).values(recurringValues);
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

    const insertedMonths = await tx.insert(months).values(monthValues).returning();

    // 4. Link Recurring Expenses to Months
    const templates = await tx
      .select()
      .from(yearRecurringExpenses)
      .where(eq(yearRecurringExpenses.yearId, yearRow.id))
      .orderBy(asc(yearRecurringExpenses.sortOrder), asc(yearRecurringExpenses.id));

    if (templates.length > 0) {
      await tx.insert(monthlyRecurringExpenses).values(
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
  });

  // 5. Propagate Carry Over
  await propagateYearCarryOver(user.id, data.year);

  // 6. Invalidate Cache
  revalidatePath("/", "layout");

  return { success: true };
}
