import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { monthlyRecurringExpenses, months, yearRecurringExpenses } from "@/db/schema";
import { normalizeRecurringExpenseInputs, parseYearRecurringExpense, sortRecurringExpensesAsc } from "@/lib/recurring-expenses";
import { getOwnedYear } from "@/lib/server/ownership";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getSessionUser } from "@/lib/server/session";
import { getYearData } from "@/lib/server/year-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);
  const yearRow = await getOwnedYear(user.id, yearNum);
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(yearRecurringExpenses)
    .where(eq(yearRecurringExpenses.yearId, yearRow.id))
    .orderBy(asc(yearRecurringExpenses.sortOrder), asc(yearRecurringExpenses.id));

  return Response.json(sortRecurringExpensesAsc(rows.map(parseYearRecurringExpense)));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);
  const yearRow = await getOwnedYear(user.id, yearNum);
  if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

  const body = await request.json();
  const normalized = normalizeRecurringExpenseInputs(
    Array.isArray(body.recurringExpenses) ? body.recurringExpenses : []
  );

  await db.delete(yearRecurringExpenses).where(eq(yearRecurringExpenses.yearId, yearRow.id));
  const templates =
    normalized.length > 0
      ? await db
          .insert(yearRecurringExpenses)
          .values(
            normalized.map((entry) => ({
              yearId: yearRow.id,
              label: entry.label,
              amount: String(entry.amount),
              sortOrder: entry.sortOrder,
            }))
          )
          .returning()
      : [];

  const monthRows = await db
    .select()
    .from(months)
    .where(eq(months.yearId, yearRow.id))
    .orderBy(asc(months.month));

  if (monthRows.length > 0) {
    await db
      .delete(monthlyRecurringExpenses)
      .where(inArray(monthlyRecurringExpenses.monthId, monthRows.map((month) => month.id)));

    if (templates.length > 0) {
      await db.insert(monthlyRecurringExpenses).values(
        monthRows.flatMap((month) =>
          templates.map((template) => ({
            monthId: month.id,
            yearRecurringExpenseId: template.id,
            label: template.label,
            amount: template.amount,
            sortOrder: template.sortOrder,
          }))
        )
      );
    }
  }

  const yearNumber = await getYearNumberForYearId(yearRow.id);
  if (yearNumber !== null) {
    await propagateYearCarryOver(user.id, yearNumber);
  }

  revalidatePath(`/${yearNum}/summary`);
  for (const locale of ["es", "en"]) {
    revalidatePath(`/${locale}/${yearNum}/summary`);
  }

  const yearData = await getYearData(user.id, yearNum);
  return Response.json({
    recurringExpenses: sortRecurringExpensesAsc(templates.map(parseYearRecurringExpense)),
    yearData,
  });
}
