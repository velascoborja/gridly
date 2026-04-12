import { db } from "@/db";
import { additionalEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthId: string; entryId: string }> }
) {
  const { entryId } = await params;
  const id = parseInt(entryId, 10);
  const body = await request.json();

  const updates: Partial<typeof additionalEntries.$inferInsert> = {};
  if (body.label !== undefined) updates.label = body.label;
  if (body.amount !== undefined) updates.amount = String(body.amount);

  const [updated] = await db.update(additionalEntries).set(updates).where(eq(additionalEntries.id, id)).returning();
  if (!updated) return Response.json({ error: "Entry not found" }, { status: 404 });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ monthId: string; entryId: string }> }
) {
  const { entryId } = await params;
  const id = parseInt(entryId, 10);

  await db.delete(additionalEntries).where(eq(additionalEntries.id, id));
  return new Response(null, { status: 204 });
}
