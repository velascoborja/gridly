import { db } from "@/db";
import { months, years } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import type { YearConfig } from "@/lib/types";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedYear } from "@/lib/server/ownership";

function yearConfigFromRow(row: typeof years.$inferSelect): YearConfig {
  return {
    id: row.id,
    year: row.year,
    startingBalance: parseFloat(row.startingBalance),
    estimatedSalary: parseFloat(row.estimatedSalary),
    hasExtraPayments: row.hasExtraPayments,
    estimatedExtraPayment: parseFloat(row.estimatedExtraPayment),
    monthlyInvestment: parseFloat(row.monthlyInvestment),
    monthlyHomeExpense: parseFloat(row.monthlyHomeExpense),
    monthlyPersonalBudget: parseFloat(row.monthlyPersonalBudget),
    interestRate: parseFloat(row.interestRate),
  };
}

function parseApplyFromMonth(value: unknown): number {
  const month = Number(value ?? 1);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : 1;
}

async function applyYearConfigToStoredMonths(yearId: number, config: YearConfig, applyFromMonth: number) {
  await db
    .update(months)
    .set({
      homeExpense: String(config.monthlyHomeExpense),
      homeExpenseManualOverride: false,
      personalExpense: String(config.monthlyPersonalBudget),
      personalExpenseManualOverride: false,
      investment: String(config.monthlyInvestment),
      investmentManualOverride: false,
      payslip: String(config.estimatedSalary),
      payslipManualOverride: false,
      additionalPayslip: "0",
      additionalPayslipManualOverride: false,
      interests: "0",
      interestsManualOverride: false,
    })
    .where(and(eq(months.yearId, yearId), gte(months.month, applyFromMonth)));

  if (config.hasExtraPayments) {
    await db
      .update(months)
      .set({ additionalPayslip: String(config.estimatedExtraPayment) })
      .where(and(eq(months.yearId, yearId), gte(months.month, applyFromMonth), inArray(months.month, [6, 12])));
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);
  const yearData = await getYearData(user.id, yearNum);
  if (!yearData) return Response.json({ error: "Year not found" }, { status: 404 });
  return Response.json(yearData);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);
  const body = await request.json();
  const applyFromMonth = parseApplyFromMonth(body.applyFromMonth);

  const yearRow = await getOwnedYear(user.id, yearNum);
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  if (body.startingBalance !== undefined) {
    const userYears = await getYearsForUser(user.id);
    const earliestYear = userYears[0];

    if (earliestYear !== yearNum) {
      return Response.json(
        { error: "Starting balance can only be edited on the earliest year" },
        { status: 400 }
      );
    }
  }

  const updates: Partial<typeof years.$inferInsert> = {};
  if (body.startingBalance !== undefined) updates.startingBalance = String(body.startingBalance);
  if (body.estimatedSalary !== undefined) updates.estimatedSalary = String(body.estimatedSalary);
  if (body.hasExtraPayments !== undefined) updates.hasExtraPayments = Boolean(body.hasExtraPayments);
  if (body.estimatedExtraPayment !== undefined) updates.estimatedExtraPayment = String(body.estimatedExtraPayment);
  if (body.monthlyInvestment !== undefined) updates.monthlyInvestment = String(body.monthlyInvestment);
  if (body.monthlyHomeExpense !== undefined) updates.monthlyHomeExpense = String(body.monthlyHomeExpense);
  if (body.monthlyPersonalBudget !== undefined) updates.monthlyPersonalBudget = String(body.monthlyPersonalBudget);
  if (body.interestRate !== undefined) updates.interestRate = String(body.interestRate);

  const [updated] = await db.update(years).set(updates).where(eq(years.id, yearRow.id)).returning();
  await applyYearConfigToStoredMonths(yearRow.id, yearConfigFromRow(updated), applyFromMonth);

  await propagateYearCarryOver(user.id, yearNum);
  return Response.json(updated);
}
