import { withFinancialTransaction } from "@/db/financial-transaction";
import { db } from "@/db";
import { yearRecurringExpenses, years } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { deriveStartingBalance, shouldAllowYearCreation } from "@/lib/server/year-planning";
import { getSessionUser } from "@/lib/server/session";
import { getYearData } from "@/lib/server/year-data";
import {
  hasInvalidRecurringExpenseAmounts,
  normalizeRecurringExpenseInputs,
  RECURRING_EXPENSE_AMOUNT_ERROR,
} from "@/lib/recurring-expenses";

function toPublicYearRow(row: typeof years.$inferSelect) {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== "carryOverVersion")
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ year: years.year, id: years.id })
    .from(years)
    .where(eq(years.userId, user.id))
    .orderBy(asc(years.year));
  return Response.json(rows);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const result = await withFinancialTransaction(user.id, async (db) => {

    const {
      year,
      startingBalance = 0,
      estimatedSalary = 0,
      hasExtraPayments = false,
      estimatedExtraPayment = 0,
      monthlyInvestment = 0,
      monthlyHomeExpense = 0,
      monthlyPersonalBudget = 0,
      interestRate = 0,
      recurringExpenses = [],
    } = body;

    if (!year) return Response.json({ error: "year is required" }, { status: 400 });
    if (!Array.isArray(recurringExpenses) || hasInvalidRecurringExpenseAmounts(recurringExpenses)) {
      return Response.json({ error: RECURRING_EXPENSE_AMOUNT_ERROR }, { status: 400 });
    }
    const recurringInputs = recurringExpenses;
    const normalizedRecurringExpenses = normalizeRecurringExpenseInputs(recurringInputs);

    const existingYears = await db
      .select({ year: years.year })
      .from(years)
      .where(eq(years.userId, user.id))
      .orderBy(asc(years.year));

    const latestYear = existingYears.at(-1)?.year;
    if (!shouldAllowYearCreation(existingYears.map((row) => row.year), year, year)) {
      return Response.json({ error: "Only the next year can be created" }, { status: 400 });
    }

    const existingYear = await db.query.years.findFirst({
      where: and(eq(years.userId, user.id), eq(years.year, year)),
    });

    if (existingYear) {
      return Response.json({ error: "Year already exists" }, { status: 409 });
    }

    let derivedStartingBalance = startingBalance;
    if (latestYear !== undefined) {
      const previousYearData = await getYearData(user.id, latestYear, db);
      if (!previousYearData) {
        return Response.json({ error: "Previous year data is required" }, { status: 400 });
      }

      derivedStartingBalance = deriveStartingBalance(previousYearData);
    }

    const [row] = await db.insert(years).values({
      userId: user.id,
      year,
      startingBalance: String(derivedStartingBalance),
      estimatedSalary: String(estimatedSalary),
      hasExtraPayments: Boolean(hasExtraPayments),
      estimatedExtraPayment: String(estimatedExtraPayment),
      monthlyInvestment: String(monthlyInvestment),
      monthlyHomeExpense: String(monthlyHomeExpense),
      monthlyPersonalBudget: String(monthlyPersonalBudget),
      interestRate: String(interestRate),
    }).returning();

    const recurringValues = normalizedRecurringExpenses.map((entry) => ({
      yearId: row.id,
      label: entry.label,
      amount: String(entry.amount),
      sortOrder: entry.sortOrder,
    }));

    if (recurringValues.length > 0) {
      await db.insert(yearRecurringExpenses).values(recurringValues);
    }

    await propagateYearCarryOver(user.id, latestYear ?? year, db);

    const finalRow = await db.query.years.findFirst({
      where: and(eq(years.userId, user.id), eq(years.year, year)),
    });
    if (!finalRow) throw new Error("Created year is missing");

    return Response.json(toPublicYearRow(finalRow), { status: 201 });
  });
  return result;
}
