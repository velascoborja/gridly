import { db } from "@/db";
import { months, years } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedYear } from "@/lib/server/ownership";
import { APPLY_FROM_MONTH_ERROR, parseApplyFromMonth } from "@/lib/apply-from-month";

function toPublicYearRow(row: typeof years.$inferSelect) {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== "carryOverVersion")
  );
}

function applyYearConfigToStoredMonths(yearId: number, applyFromMonth: number) {
  return db
    .update(months)
    .set({
      homeExpense: years.monthlyHomeExpense,
      homeExpenseManualOverride: false,
      personalExpense: years.monthlyPersonalBudget,
      personalExpenseManualOverride: false,
      investment: years.monthlyInvestment,
      investmentManualOverride: false,
      payslip: years.estimatedSalary,
      payslipManualOverride: false,
      additionalPayslip: sql`case
        when ${years.hasExtraPayments} and ${months.month} in (6, 12)
          then ${years.estimatedExtraPayment}
        else 0
      end`,
      additionalPayslipManualOverride: false,
      interests: "0",
      interestsManualOverride: false,
    })
    .from(years)
    .where(
      and(
        eq(years.id, yearId),
        eq(months.yearId, years.id),
        gte(months.month, applyFromMonth),
      ),
    );
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
  if (applyFromMonth === null) {
    return Response.json({ error: APPLY_FROM_MONTH_ERROR }, { status: 400 });
  }

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

  const [updatedRows] = await db.batch([
    db.update(years).set(updates).where(eq(years.id, yearRow.id)).returning(),
    applyYearConfigToStoredMonths(yearRow.id, applyFromMonth),
  ]);
  const [updated] = updatedRows;

  await propagateYearCarryOver(user.id, yearNum);
  return Response.json(toPublicYearRow(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);

  if (yearNum <= new Date().getFullYear()) {
    return Response.json({ error: "Only future years can be deleted" }, { status: 403 });
  }

  const yearRow = await getOwnedYear(user.id, yearNum);
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  await db.delete(years).where(eq(years.id, yearRow.id));

  const remainingYears = (await getYearsForUser(user.id)).sort((a, b) => a - b);
  const precedingYear = remainingYears.filter((y) => y < yearNum).at(-1);
  if (precedingYear !== undefined) {
    await propagateYearCarryOver(user.id, precedingYear);
  }

  return Response.json({ ok: true });
}
