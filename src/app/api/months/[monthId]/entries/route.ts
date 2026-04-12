import { db } from "@/db";
import { additionalEntries } from "@/db/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ monthId: string }> }
) {
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

  const [entry] = await db.insert(additionalEntries).values({
    monthId: id,
    type,
    label,
    amount: String(amount),
  }).returning();

  return Response.json(entry, { status: 201 });
}
