import { db } from "@/db";
import { tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/server/session";
import { TAG_COLOR_KEYS } from "@/lib/tags";

function parseTagId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId: tagIdParam } = await params;
  const tagId = parseTagId(tagIdParam);
  if (tagId === null) {
    return Response.json({ error: "Invalid tag id" }, { status: 400 });
  }

  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!color || !TAG_COLOR_KEYS.includes(color)) {
    return Response.json({ error: "color must be a valid palette key" }, { status: 400 });
  }

  const [tag] = await db
    .update(tags)
    .set({ name: name.trim(), color })
    .where(and(eq(tags.id, tagId), eq(tags.userId, user.id)))
    .returning();

  if (!tag) {
    return Response.json({ error: "Tag not found" }, { status: 404 });
  }

  return Response.json({ id: tag.id, name: tag.name, color: tag.color });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId: tagIdParam } = await params;
  const tagId = parseTagId(tagIdParam);
  if (tagId === null) {
    return Response.json({ error: "Invalid tag id" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, user.id)))
    .returning();

  if (!deleted) {
    return Response.json({ error: "Tag not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
