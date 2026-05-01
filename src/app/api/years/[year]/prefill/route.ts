import { db } from "@/db";
import { monthlyRecurringExpenses, months, yearRecurringExpenses } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { computeMonthChain, estimatedMonthData } from "@/lib/calculations";
import type { YearConfig } from "@/lib/types";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedYear } from "@/lib/server/ownership";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);

  const yearRow = await getOwnedYear(user.id, yearNum);
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  const config: YearConfig = {
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
  };

  // Delete existing months and recreate
  await db.delete(months).where(eq(months.yearId, yearRow.id));

  const computedMonths = computeMonthChain(
    Array.from({ length: 12 }, (_, i) => ({
      id: 0,
      yearId: yearRow.id,
      ...estimatedMonthData(i + 1, config),
    })),
    config.startingBalance,
    config.interestRate
  );

  const values = computedMonths.map((month) => ({
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

  const inserted = await db.insert(months).values(values).returning();
  const templates = await db
    .select()
    .from(yearRecurringExpenses)
    .where(eq(yearRecurringExpenses.yearId, yearRow.id))
    .orderBy(asc(yearRecurringExpenses.sortOrder), asc(yearRecurringExpenses.id));

  if (templates.length > 0) {
    await db.insert(monthlyRecurringExpenses).values(
      inserted.flatMap((month) =>
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

  return Response.json(inserted, { status: 201 });
}
