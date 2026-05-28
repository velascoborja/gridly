import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { monthlyRecurringExpenses, tags, yearRecurringExpenses } from "@/db/schema";
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

  const tagChange = body.tagId !== undefined;
  const newTagId: number | null = body.tagId === null ? null : Number(body.tagId);

  if (tagChange && newTagId !== null) {
    const owned = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.id, newTagId), eq(tags.userId, user.id)));
    if (owned.length === 0) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }
  }

  if (tagChange) {
    if (entry.yearRecurringExpenseId !== null) {
      await db
        .update(yearRecurringExpenses)
        .set({ tagId: newTagId })
        .where(eq(yearRecurringExpenses.id, entry.yearRecurringExpenseId));
      await db
        .update(monthlyRecurringExpenses)
        .set({ tagId: newTagId })
        .where(eq(monthlyRecurringExpenses.yearRecurringExpenseId, entry.yearRecurringExpenseId));
    } else {
      updates.tagId = newTagId;
    }
  }

  let updated;
  if (Object.keys(updates).length > 0) {
    [updated] = await db
      .update(monthlyRecurringExpenses)
      .set(updates)
      .where(eq(monthlyRecurringExpenses.id, entry.id))
      .returning();
  } else {
    [updated] = await db
      .select()
      .from(monthlyRecurringExpenses)
      .where(eq(monthlyRecurringExpenses.id, entry.id));
  }

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
