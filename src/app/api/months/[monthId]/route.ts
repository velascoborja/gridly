import { db } from "@/db";
import { months } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ monthId: string }> }
) {
  const { monthId } = await params;
  const id = parseInt(monthId, 10);
  const body = await request.json();

  const fields = [
    "homeExpense", "personalExpense", "investment",
    "payslip", "additionalPayslip", "bonus", "interests", "personalRemaining",
  ] as const;

  const updates: Partial<typeof months.$inferInsert> = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      (updates as Record<string, string>)[field] = String(body[field]);
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db.update(months).set(updates).where(eq(months.id, id)).returning();
  if (!updated) return Response.json({ error: "Month not found" }, { status: 404 });

  return Response.json(updated);
}
