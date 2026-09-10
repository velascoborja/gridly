import { withFinancialTransaction } from "@/db/financial-transaction";
import { and, eq } from "drizzle-orm";
import { monthlyRecurringExpenses, tags, yearRecurringExpenses } from "@/db/schema";
import {
  isValidRecurringExpenseAmount,
  parseMonthlyRecurringExpense,
  RECURRING_EXPENSE_AMOUNT_ERROR,
} from "@/lib/recurring-expenses";
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

  const body = await request.json();
  if (body.amount !== undefined && !isValidRecurringExpenseAmount(body.amount)) {
    return Response.json({ error: RECURRING_EXPENSE_AMOUNT_ERROR }, { status: 400 });
  }

  const result = await withFinancialTransaction(user.id, async (db) => {
    const { monthId, entryId } = await params;
    const month = await getOwnedMonth(user.id, parseInt(monthId, 10), db);
    const entry = await getOwnedRecurringExpense(user.id, parseInt(entryId, 10), db);
    if (!month || !entry || entry.monthId !== month.id) {
      return Response.json({ error: "Recurring expense not found" }, { status: 404 });
    }

    const updates: Partial<typeof monthlyRecurringExpenses.$inferInsert> = {};
    if (body.label !== undefined) updates.label = String(body.label).trim();
    const nextAmount = body.amount !== undefined ? body.amount : undefined;
    if (nextAmount !== undefined) updates.amount = String(nextAmount);
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;
    const affectsCarryOver =
      nextAmount !== undefined && nextAmount !== Number(entry.amount);

    const tagChange = body.tagId !== undefined;
    const newTagId: number | null = body.tagId === null ? null : Number(body.tagId);

    if (tagChange && newTagId !== null && !(Number.isInteger(newTagId) && newTagId > 0)) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }

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

    if (affectsCarryOver) {
      const yearNumber = await getYearNumberForYearId(month.yearId, db);
      if (yearNumber !== null) {
        await propagateYearCarryOver(user.id, yearNumber, db);
      }
    }

    return Response.json(parseMonthlyRecurringExpense(updated));
  });
  return result;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ monthId: string; entryId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await withFinancialTransaction(user.id, async (db) => {
    const { monthId, entryId } = await params;
    const month = await getOwnedMonth(user.id, parseInt(monthId, 10), db);
    const entry = await getOwnedRecurringExpense(user.id, parseInt(entryId, 10), db);
    if (!month || !entry || entry.monthId !== month.id) {
      return Response.json({ error: "Recurring expense not found" }, { status: 404 });
    }

    await db.delete(monthlyRecurringExpenses).where(eq(monthlyRecurringExpenses.id, entry.id));

    const yearNumber = await getYearNumberForYearId(month.yearId, db);
    if (yearNumber !== null) {
      await propagateYearCarryOver(user.id, yearNumber, db);
    }

    return new Response(null, { status: 204 });
  });
  return result;
}
