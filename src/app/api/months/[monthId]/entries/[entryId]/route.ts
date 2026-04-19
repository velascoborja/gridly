import { db } from "@/db";
import { additionalEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  if (!month || !entry || entry.monthId !== month.id) return Response.json({ error: "Entry not found" }, { status: 404 });

  const [updated] = await db.update(additionalEntries).set(updates).where(eq(additionalEntries.id, entry.id)).returning();
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
