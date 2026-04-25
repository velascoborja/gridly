import { eq } from "drizzle-orm";
import { db } from "@/db";
import { monthlyRecurringExpenses } from "@/db/schema";
import { parseMonthlyRecurringExpense } from "@/lib/recurring-expenses";
import { getOwnedMonth, getOwnedRecurringExpense } from "@/lib/server/ownership";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getSessionUser } from "@/lib/server/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthId: string; entryId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId, entryId } = await params;
  const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
  const entry = await getOwnedRecurringExpense(user.id, parseInt(entryId, 10));
  if (!month || !entry || entry.monthId !== month.id) {
    return Response.json({ error: "Recurring expense not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Partial<typeof monthlyRecurringExpenses.$inferInsert> = {};
  if (body.label !== undefined) updates.label = String(body.label).trim();
  if (body.amount !== undefined) updates.amount = String(Number(body.amount) || 0);
  if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;

  const [updated] = await db
    .update(monthlyRecurringExpenses)
    .set(updates)
    .where(eq(monthlyRecurringExpenses.id, entry.id))
    .returning();

  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return Response.json(parseMonthlyRecurringExpense(updated));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ monthId: string; entryId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId, entryId } = await params;
  const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
  const entry = await getOwnedRecurringExpense(user.id, parseInt(entryId, 10));
  if (!month || !entry || entry.monthId !== month.id) {
    return Response.json({ error: "Recurring expense not found" }, { status: 404 });
  }

  await db.delete(monthlyRecurringExpenses).where(eq(monthlyRecurringExpenses.id, entry.id));

  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return new Response(null, { status: 204 });
}
