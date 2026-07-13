import { db } from "@/db";
import { additionalEntryGroups, additionalEntries, tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedMonth, getOwnedGroup } from "@/lib/server/ownership";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthId: string; groupId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId, groupId } = await params;
  const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
  if (!month) return Response.json({ error: "Month not found" }, { status: 404 });

  const group = await getOwnedGroup(
    user.id,
    parseInt(monthId, 10),
    parseInt(groupId, 10)
  );
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  const body = await request.json();
  const hasLabel = body.label !== undefined;
  const label = hasLabel ? (typeof body.label === "string" ? body.label.trim() : "") : group.label;
  if (!label) {
    return Response.json({ error: "label is required" }, { status: 400 });
  }

  const groupUpdate: { label: string; tagId?: number | null; monthId?: number } = { label };
  let targetMonth = month;
  if (body.monthId !== undefined) {
    const targetMonthId = parseInt(String(body.monthId), 10);
    if (Number.isNaN(targetMonthId)) {
      return Response.json({ error: "Invalid target month" }, { status: 400 });
    }
    const ownedTargetMonth = await getOwnedMonth(user.id, targetMonthId);
    if (!ownedTargetMonth) {
      return Response.json({ error: "Target month not found" }, { status: 404 });
    }
    if (ownedTargetMonth.yearId !== month.yearId) {
      return Response.json({ error: "Target month must be in the same year" }, { status: 400 });
    }
    targetMonth = ownedTargetMonth;
    groupUpdate.monthId = ownedTargetMonth.id;
  }

  let newTagId: number | null | undefined;
  if (body.tagId !== undefined) {
    const validatedTagId: number | null = body.tagId;
    if (validatedTagId !== null && !(Number.isInteger(validatedTagId) && validatedTagId > 0)) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }
    if (validatedTagId !== null) {
      const ownedTag = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.id, validatedTagId), eq(tags.userId, user.id)));
      if (ownedTag.length === 0) {
        return Response.json({ error: "Tag not found" }, { status: 404 });
      }
    }
    newTagId = validatedTagId;
    groupUpdate.tagId = validatedTagId;
  }

  const [updated] = await db
    .update(additionalEntryGroups)
    .set(groupUpdate)
    .where(eq(additionalEntryGroups.id, group.id))
    .returning();

  if (body.monthId !== undefined) {
    await db
      .update(additionalEntries)
      .set({ monthId: targetMonth.id })
      .where(eq(additionalEntries.groupId, group.id));
  }

  if (newTagId !== undefined) {
    await db
      .update(additionalEntries)
      .set({ tagId: newTagId })
      .where(eq(additionalEntries.groupId, group.id));
  }

  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ monthId: string; groupId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId, groupId } = await params;
  const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
  if (!month) return Response.json({ error: "Month not found" }, { status: 404 });

  const group = await getOwnedGroup(
    user.id,
    parseInt(monthId, 10),
    parseInt(groupId, 10)
  );
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  await db
    .delete(additionalEntryGroups)
    .where(eq(additionalEntryGroups.id, group.id));

  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return new Response(null, { status: 204 });
}
