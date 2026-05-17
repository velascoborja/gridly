import { db } from "@/db";
import { additionalEntryGroups } from "@/db/schema";
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
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) {
    return Response.json({ error: "label is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(additionalEntryGroups)
    .set({ label })
    .where(eq(additionalEntryGroups.id, group.id))
    .returning();

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
