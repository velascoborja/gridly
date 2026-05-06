import { db } from "@/db";
import { months, years } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import type { YearConfig } from "@/lib/types";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedYear } from "@/lib/server/ownership";
import { parseProtectedFinancialNumber, protectFinancialNumber } from "@/lib/server/financial-data-privacy";

function yearConfigFromRow(row: typeof years.$inferSelect): YearConfig {
  return {
    id: row.id,
    year: row.year,
    startingBalance: parseProtectedFinancialNumber(row.startingBalance),
    estimatedSalary: parseProtectedFinancialNumber(row.estimatedSalary),
    hasExtraPayments: row.hasExtraPayments,
    estimatedExtraPayment: parseProtectedFinancialNumber(row.estimatedExtraPayment),
    monthlyInvestment: parseProtectedFinancialNumber(row.monthlyInvestment),
    monthlyHomeExpense: parseProtectedFinancialNumber(row.monthlyHomeExpense),
    monthlyPersonalBudget: parseProtectedFinancialNumber(row.monthlyPersonalBudget),
    interestRate: parseProtectedFinancialNumber(row.interestRate),
  };
}

function publicYearRow(row: typeof years.$inferSelect) {
  return {
    ...row,
    startingBalance: String(parseProtectedFinancialNumber(row.startingBalance)),
    estimatedSalary: String(parseProtectedFinancialNumber(row.estimatedSalary)),
    estimatedExtraPayment: String(parseProtectedFinancialNumber(row.estimatedExtraPayment)),
    monthlyInvestment: String(parseProtectedFinancialNumber(row.monthlyInvestment)),
    monthlyHomeExpense: String(parseProtectedFinancialNumber(row.monthlyHomeExpense)),
    monthlyPersonalBudget: String(parseProtectedFinancialNumber(row.monthlyPersonalBudget)),
    interestRate: String(parseProtectedFinancialNumber(row.interestRate)),
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
      homeExpense: protectFinancialNumber(config.monthlyHomeExpense),
      homeExpenseManualOverride: false,
      personalExpense: protectFinancialNumber(config.monthlyPersonalBudget),
      personalExpenseManualOverride: false,
      investment: protectFinancialNumber(config.monthlyInvestment),
      investmentManualOverride: false,
      payslip: protectFinancialNumber(config.estimatedSalary),
      payslipManualOverride: false,
      additionalPayslip: protectFinancialNumber(0),
      additionalPayslipManualOverride: false,
      interests: protectFinancialNumber(0),
      interestsManualOverride: false,
    })
    .where(and(eq(months.yearId, yearId), gte(months.month, applyFromMonth)));

  if (config.hasExtraPayments) {
    await db
      .update(months)
      .set({ additionalPayslip: protectFinancialNumber(config.estimatedExtraPayment) })
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
  if (body.startingBalance !== undefined) updates.startingBalance = protectFinancialNumber(body.startingBalance);
  if (body.estimatedSalary !== undefined) updates.estimatedSalary = protectFinancialNumber(body.estimatedSalary);
  if (body.hasExtraPayments !== undefined) updates.hasExtraPayments = Boolean(body.hasExtraPayments);
  if (body.estimatedExtraPayment !== undefined) updates.estimatedExtraPayment = protectFinancialNumber(body.estimatedExtraPayment);
  if (body.monthlyInvestment !== undefined) updates.monthlyInvestment = protectFinancialNumber(body.monthlyInvestment);
  if (body.monthlyHomeExpense !== undefined) updates.monthlyHomeExpense = protectFinancialNumber(body.monthlyHomeExpense);
  if (body.monthlyPersonalBudget !== undefined) updates.monthlyPersonalBudget = protectFinancialNumber(body.monthlyPersonalBudget);
  if (body.interestRate !== undefined) updates.interestRate = protectFinancialNumber(body.interestRate);

  const [updated] = await db.update(years).set(updates).where(eq(years.id, yearRow.id)).returning();
  await applyYearConfigToStoredMonths(yearRow.id, yearConfigFromRow(updated), applyFromMonth);

  await propagateYearCarryOver(user.id, yearNum);
  return Response.json(publicYearRow(updated));
}
