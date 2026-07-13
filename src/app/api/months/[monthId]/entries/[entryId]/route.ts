import { db } from "@/db";
import { additionalEntries, additionalEntryGroups, tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedEntry, getOwnedMonth } from "@/lib/server/ownership";

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
  const id = parseInt(entryId, 10);
  const body = await request.json();

  const updates: Partial<typeof additionalEntries.$inferInsert> = {};
  if (body.label !== undefined) updates.label = body.label;
  if (body.amount !== undefined) updates.amount = String(body.amount);

  const entry = await getOwnedEntry(user.id, id);
  if (!month || !entry || entry.monthId !== month.id)
    return Response.json({ error: "Entry not found" }, { status: 404 });

  if (body.monthId !== undefined) {
    const targetMonthId = parseInt(String(body.monthId), 10);
    if (Number.isNaN(targetMonthId)) {
      return Response.json({ error: "Invalid target month" }, { status: 400 });
    }
    const targetMonth = await getOwnedMonth(user.id, targetMonthId);
    if (!targetMonth) {
      return Response.json({ error: "Target month not found" }, { status: 404 });
    }
    if (targetMonth.yearId !== month.yearId) {
      return Response.json({ error: "Target month must be in the same year" }, { status: 400 });
    }
    updates.monthId = targetMonth.id;
  }

  if (body.groupId !== undefined) {
    if (body.groupId === null) {
      updates.groupId = null;
    } else {
      const groupId = parseInt(String(body.groupId), 10);
      if (Number.isNaN(groupId)) {
        return Response.json({ error: "Invalid groupId" }, { status: 400 });
      }
      const group = await db.query.additionalEntryGroups.findFirst({
        where: and(
          eq(additionalEntryGroups.id, groupId),
          eq(additionalEntryGroups.monthId, month.id)
        ),
      });
      if (!group) {
        return Response.json({ error: "Group not found" }, { status: 404 });
      }
      updates.groupId = groupId;
      updates.isRecurring = false;
      updates.tagId = group.tagId ?? null;
    }
  }

  if (body.isRecurring !== undefined) {
    updates.isRecurring = body.isRecurring === true;
  }

  if (body.tagId !== undefined && body.groupId === undefined) {
    const newTagId: number | null = body.tagId;
    if (newTagId !== null && !(Number.isInteger(newTagId) && newTagId > 0)) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }
    if (newTagId !== null) {
      const ownedTag = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.id, newTagId), eq(tags.userId, user.id)));
      if (ownedTag.length === 0) {
        return Response.json({ error: "Tag not found" }, { status: 404 });
      }
    }
    updates.tagId = newTagId;
  }

  const [updated] = await db
    .update(additionalEntries)
    .set(updates)
    .where(eq(additionalEntries.id, entry.id))
    .returning();

  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return Response.json(updated);
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
  const id = parseInt(entryId, 10);

  const entry = await getOwnedEntry(user.id, id);
  if (!month || !entry || entry.monthId !== month.id) return Response.json({ error: "Entry not found" }, { status: 404 });

  await db.delete(additionalEntries).where(eq(additionalEntries.id, entry.id));
  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }
  return new Response(null, { status: 204 });
}
