import { db } from "@/db";
import { years } from "@/db/schema";
import { eq } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getYearData } from "@/lib/server/year-data";
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

  const updates: Partial<typeof years.$inferInsert> = {};
  if (body.estimatedSalary !== undefined) updates.estimatedSalary = String(body.estimatedSalary);
  if (body.monthlyInvestment !== undefined) updates.monthlyInvestment = String(body.monthlyInvestment);
  if (body.monthlyHomeExpense !== undefined) updates.monthlyHomeExpense = String(body.monthlyHomeExpense);
  if (body.monthlyPersonalBudget !== undefined) updates.monthlyPersonalBudget = String(body.monthlyPersonalBudget);
  if (body.interestRate !== undefined) updates.interestRate = String(body.interestRate);

  const [updated] = await db.update(years).set(updates).where(eq(years.id, yearRow.id)).returning();
  await propagateYearCarryOver(user.id, yearNum);
  return Response.json(updated);
}
