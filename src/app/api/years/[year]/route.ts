import { db } from "@/db";
import { months, years } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedYear } from "@/lib/server/ownership";

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

  if (body.hasExtraPayments !== undefined || body.estimatedExtraPayment !== undefined) {
    const hasExtraPayments =
      body.hasExtraPayments !== undefined ? Boolean(body.hasExtraPayments) : updated.hasExtraPayments;
    const estimatedExtraPayment =
      body.estimatedExtraPayment !== undefined
        ? Number(body.estimatedExtraPayment)
        : parseFloat(updated.estimatedExtraPayment);

    await db
      .update(months)
      .set({ additionalPayslip: String(hasExtraPayments ? estimatedExtraPayment : 0) })
      .where(and(eq(months.yearId, yearRow.id), inArray(months.month, [6, 12])));
  }

  await propagateYearCarryOver(user.id, yearNum);
  revalidatePath(`/${yearNum}/summary`);
  for (const locale of ["es", "en"]) {
    revalidatePath(`/${locale}/${yearNum}/summary`);
  }
  return Response.json(updated);
}
