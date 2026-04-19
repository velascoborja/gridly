import { db } from "@/db";
import { additionalEntries } from "@/db/schema";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedMonth } from "@/lib/server/ownership";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ monthId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthId } = await params;
  const id = parseInt(monthId, 10);
  const body = await request.json();
  const { type, label, amount } = body;

  if (!type || !label || amount === undefined) {
    return Response.json({ error: "type, label, and amount are required" }, { status: 400 });
  }
  if (type !== "income" && type !== "expense") {
    return Response.json({ error: "type must be 'income' or 'expense'" }, { status: 400 });
  }

  const ownedMonth = await getOwnedMonth(user.id, id);
  if (!ownedMonth) {
    return Response.json({ error: "Month not found" }, { status: 404 });
  }

  const [entry] = await db.insert(additionalEntries).values({
    monthId: ownedMonth.id,
    type,
    label,
    amount: String(amount),
  }).returning();

  const yearNumber = await getYearNumberForYearId(ownedMonth.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return Response.json(entry, { status: 201 });
}
