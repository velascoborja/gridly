import { db } from "@/db";
import { months } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getSessionUser } from "@/lib/server/session";
import { getOwnedMonth } from "@/lib/server/ownership";

export async function PATCH(
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

  const fields = [
    "homeExpense", "personalExpense", "investment",
    "payslip", "additionalPayslip", "interests", "personalRemaining",
  ] as const;
  const manualOverrideFields = {
    homeExpense: "homeExpenseManualOverride",
    personalExpense: "personalExpenseManualOverride",
    investment: "investmentManualOverride",
    payslip: "payslipManualOverride",
    additionalPayslip: "additionalPayslipManualOverride",
  } as const;
  const explicitManualOverrideFields = [
    "homeExpenseManualOverride",
    "personalExpenseManualOverride",
    "investmentManualOverride",
    "payslipManualOverride",
    "additionalPayslipManualOverride",
  ] as const;

  const updates: Partial<typeof months.$inferInsert> = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      (updates as Record<string, string>)[field] = String(body[field]);
      const manualOverrideField = manualOverrideFields[field as keyof typeof manualOverrideFields];
      if (manualOverrideField && body[manualOverrideField] === undefined) {
        updates[manualOverrideField] = true;
      }
    }
  }
  for (const field of explicitManualOverrideFields) {
    if (body[field] !== undefined) {
      updates[field] = Boolean(body[field]);
    }
  }
  if (body.interestsManualOverride !== undefined) {
    updates.interestsManualOverride = Boolean(body.interestsManualOverride);
  } else if (body.interests !== undefined) {
    updates.interestsManualOverride = true;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const ownedMonth = await getOwnedMonth(user.id, id);
  if (!ownedMonth) return Response.json({ error: "Month not found" }, { status: 404 });

  const [updated] = await db.update(months).set(updates).where(eq(months.id, ownedMonth.id)).returning();
  const yearNumber = await getYearNumberForYearId(ownedMonth.yearId);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  return Response.json(updated);
}
