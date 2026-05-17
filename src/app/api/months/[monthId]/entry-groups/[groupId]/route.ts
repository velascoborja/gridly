import { db } from "@/db";
import { additionalEntryGroups } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedMonth } from "@/lib/server/ownership";

async function getOwnedGroup(userId: string, monthId: number, groupId: number) {
  const month = await getOwnedMonth(userId, monthId);
  if (!month) return null;
  const group = await db.query.additionalEntryGroups.findFirst({
    where: and(
      eq(additionalEntryGroups.id, groupId),
      eq(additionalEntryGroups.monthId, month.id)
    ),
  });
  return group ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthId: string; groupId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId, groupId } = await params;
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
  const group = await getOwnedGroup(
    user.id,
    parseInt(monthId, 10),
    parseInt(groupId, 10)
  );
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  await db
    .delete(additionalEntryGroups)
    .where(eq(additionalEntryGroups.id, group.id));

  return new Response(null, { status: 204 });
}
