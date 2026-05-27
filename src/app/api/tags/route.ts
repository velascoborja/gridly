import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/server/session";
import { TAG_COLOR_KEYS } from "@/lib/tags";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, user.id));

  return Response.json(rows.map((t) => ({ id: t.id, name: t.name, color: t.color })));
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
    .insert(tags)
    .values({ userId: user.id, name: name.trim(), color })
    .returning();

  return Response.json({ id: tag.id, name: tag.name, color: tag.color }, { status: 201 });
}
