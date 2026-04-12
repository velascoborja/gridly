import { db } from "@/db";
import { years, months, additionalEntries } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { computeMonthChain } from "@/lib/calculations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  const yearNum = parseInt(year, 10);

  const yearRow = await db.query.years.findFirst({ where: eq(years.year, yearNum) });
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  const monthRows = await db.select().from(months)
    .where(eq(months.yearId, yearRow.id))
    .orderBy(asc(months.month));

  const allEntries = monthRows.length > 0
    ? await db.select().from(additionalEntries).where(
        inArray(additionalEntries.monthId, monthRows.map((m) => m.id))
      )
    : [];

  const entriesByMonthId = new Map<number, typeof allEntries>();
  for (const entry of allEntries) {
    if (!entriesByMonthId.has(entry.monthId)) entriesByMonthId.set(entry.monthId, []);
    entriesByMonthId.get(entry.monthId)!.push(entry);
  }

  const rawMonths = monthRows.map((m) => {
    const entries = entriesByMonthId.get(m.id) ?? [];
    return {
      id: m.id,
      yearId: m.yearId,
      month: m.month,
      homeExpense: parseFloat(m.homeExpense),
      personalExpense: parseFloat(m.personalExpense),
      investment: parseFloat(m.investment),
      payslip: parseFloat(m.payslip),
      additionalPayslip: parseFloat(m.additionalPayslip),
      bonus: parseFloat(m.bonus),
      interests: parseFloat(m.interests),
      personalRemaining: parseFloat(m.personalRemaining),
      additionalExpenses: entries
        .filter((e) => e.type === "expense")
        .map((e) => ({ id: e.id, monthId: e.monthId, type: "expense" as const, label: e.label, amount: parseFloat(e.amount) })),
      additionalIncomes: entries
        .filter((e) => e.type === "income")
        .map((e) => ({ id: e.id, monthId: e.monthId, type: "income" as const, label: e.label, amount: parseFloat(e.amount) })),
    };
  });

  const computedMonths = computeMonthChain(rawMonths, parseFloat(yearRow.startingBalance));

  return Response.json({
    config: {
      id: yearRow.id,
      year: yearRow.year,
      startingBalance: parseFloat(yearRow.startingBalance),
      estimatedSalary: parseFloat(yearRow.estimatedSalary),
      monthlyInvestment: parseFloat(yearRow.monthlyInvestment),
      monthlyHomeExpense: parseFloat(yearRow.monthlyHomeExpense),
      monthlyPersonalBudget: parseFloat(yearRow.monthlyPersonalBudget),
      interestRate: parseFloat(yearRow.interestRate),
    },
    months: computedMonths,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  const yearNum = parseInt(year, 10);
  const body = await request.json();

  const yearRow = await db.query.years.findFirst({ where: eq(years.year, yearNum) });
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  const updates: Partial<typeof years.$inferInsert> = {};
  if (body.startingBalance !== undefined) updates.startingBalance = String(body.startingBalance);
  if (body.estimatedSalary !== undefined) updates.estimatedSalary = String(body.estimatedSalary);
  if (body.monthlyInvestment !== undefined) updates.monthlyInvestment = String(body.monthlyInvestment);
  if (body.monthlyHomeExpense !== undefined) updates.monthlyHomeExpense = String(body.monthlyHomeExpense);
  if (body.monthlyPersonalBudget !== undefined) updates.monthlyPersonalBudget = String(body.monthlyPersonalBudget);
  if (body.interestRate !== undefined) updates.interestRate = String(body.interestRate);

  const [updated] = await db.update(years).set(updates).where(eq(years.id, yearRow.id)).returning();
  return Response.json(updated);
}
