import { withFinancialTransaction } from "@/db/financial-transaction";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { monthlyRecurringExpenses, months, yearRecurringExpenses } from "@/db/schema";
import {
  hasInvalidRecurringExpenseAmounts,
  normalizeRecurringExpenseInputs,
  parseYearRecurringExpense,
  RECURRING_EXPENSE_AMOUNT_ERROR,
  RECURRING_EXPENSE_IDENTITY_ERROR,
  sortRecurringExpensesAsc,
} from "@/lib/recurring-expenses";
import { getOwnedYear } from "@/lib/server/ownership";
import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { getSessionUser } from "@/lib/server/session";
import { getYearData } from "@/lib/server/year-data";
import { APPLY_FROM_MONTH_ERROR, parseApplyFromMonth } from "@/lib/apply-from-month";

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

  const body = await request.json();
  if (!Array.isArray(body.recurringExpenses) || hasInvalidRecurringExpenseAmounts(body.recurringExpenses)) {
    return Response.json({ error: RECURRING_EXPENSE_AMOUNT_ERROR }, { status: 400 });
  }
  const rawRecurringInputs: unknown[] = body.recurringExpenses;
  if (rawRecurringInputs.some((entry) => !("id" in (entry as object)))) {
    return Response.json({ error: RECURRING_EXPENSE_IDENTITY_ERROR }, { status: 409 });
  }
  const recurringInputs = rawRecurringInputs as Array<{
    id: number | null;
    label: string;
    amount: number;
  }>;

  const result = await withFinancialTransaction(user.id, async (db) => {
    const { year } = await params;
    const yearNum = parseInt(year, 10);
    const yearRow = await getOwnedYear(user.id, yearNum, db);
    if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });

    const applyFromMonth = parseApplyFromMonth(body.applyFromMonth);
    if (applyFromMonth === null) {
      return Response.json({ error: APPLY_FROM_MONTH_ERROR }, { status: 400 });
    }
    const normalized = normalizeRecurringExpenseInputs(recurringInputs);

    const existingTemplates = await db
      .select()
      .from(yearRecurringExpenses)
      .where(eq(yearRecurringExpenses.yearId, yearRow.id));
    const existingById = new Map(existingTemplates.map((template) => [template.id, template]));
    const submittedIds = normalized.flatMap((entry) => entry.id === null ? [] : [entry.id]);
    if (
      submittedIds.some((id) => !Number.isInteger(id) || id <= 0 || !existingById.has(id)) ||
      new Set(submittedIds).size !== submittedIds.length
    ) {
      return Response.json({ error: RECURRING_EXPENSE_IDENTITY_ERROR }, { status: 409 });
    }

    const retainedTemplates: typeof existingTemplates = [];
    for (const entry of normalized) {
      if (entry.id === null) continue;
      const [updated] = await db
        .update(yearRecurringExpenses)
        .set({
          label: entry.label,
          amount: String(entry.amount),
          sortOrder: entry.sortOrder,
        })
        .where(and(eq(yearRecurringExpenses.id, entry.id), eq(yearRecurringExpenses.yearId, yearRow.id)))
        .returning();
      retainedTemplates.push(updated);
    }

    const newInputs = normalized.filter((entry) => entry.id === null);
    const newTemplates = newInputs.length > 0
      ? await db
          .insert(yearRecurringExpenses)
          .values(newInputs.map((entry) => ({
            yearId: yearRow.id,
            label: entry.label,
            amount: String(entry.amount),
            sortOrder: entry.sortOrder,
            tagId: null,
          })))
          .returning()
      : [];
    const templates = sortRecurringExpensesAsc([...retainedTemplates, ...newTemplates]);

    const monthRows = await db
      .select()
      .from(months)
      .where(eq(months.yearId, yearRow.id))
      .orderBy(asc(months.month));

    const targetMonthRows = monthRows.filter((month) => month.month >= applyFromMonth);

    if (targetMonthRows.length > 0) {
      await db
        .delete(monthlyRecurringExpenses)
        .where(inArray(monthlyRecurringExpenses.monthId, targetMonthRows.map((month) => month.id)));

      if (templates.length > 0) {
        await db.insert(monthlyRecurringExpenses).values(
          targetMonthRows.flatMap((month) =>
            templates.map((template) => ({
              monthId: month.id,
              yearRecurringExpenseId: template.id,
              label: template.label,
              amount: template.amount,
              sortOrder: template.sortOrder,
              tagId: template.tagId,
            }))
          )
        );
      }
    }

    const removedTemplateIds = existingTemplates
      .filter((template) => !submittedIds.includes(template.id))
      .map((template) => template.id);
    if (removedTemplateIds.length > 0) {
      await db
        .delete(yearRecurringExpenses)
        .where(inArray(yearRecurringExpenses.id, removedTemplateIds));
    }

    const yearNumber = await getYearNumberForYearId(yearRow.id, db);
    if (yearNumber !== null) {
      await propagateYearCarryOver(user.id, yearNumber, db);
    }

    const yearData = await getYearData(user.id, yearNum, db);
    return Response.json({
      recurringExpenses: sortRecurringExpensesAsc(templates.map(parseYearRecurringExpense)),
      yearData,
    });
  });
  if (!result.ok) return result;
  const { year } = await params;
  const yearNum = parseInt(year, 10);
  revalidatePath(`/${yearNum}/summary`);
  for (const locale of ["es", "en"]) {
    revalidatePath(`/${locale}/${yearNum}/summary`);
  }
  return result;
}
