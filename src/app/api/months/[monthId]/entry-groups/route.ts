import { db } from "@/db";
import { additionalEntryGroups } from "@/db/schema";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedMonth } from "@/lib/server/ownership";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ monthId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId } = await params;
  const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
  if (!month) return Response.json({ error: "Month not found" }, { status: 404 });

  const body = await request.json();
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) {
    return Response.json({ error: "label is required" }, { status: 400 });
  }

  const [group] = await db
    .insert(additionalEntryGroups)
    .values({ monthId: month.id, label })
    .returning();

  const yearNumber = await getYearNumberForYearId(month.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return Response.json(group, { status: 201 });
}
