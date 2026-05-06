import { db } from "@/db";
import { yearRecurringExpenses, years } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { deriveStartingBalance, shouldAllowYearCreation } from "@/lib/server/year-planning";
import { getSessionUser } from "@/lib/server/session";
import { getYearData } from "@/lib/server/year-data";
import { parseProtectedFinancialNumber, protectFinancialNumber, protectFinancialText } from "@/lib/server/financial-data-privacy";

function publicYearRow(row: typeof years.$inferSelect) {
  return {
    ...row,
    startingBalance: String(parseProtectedFinancialNumber(row.startingBalance)),
    estimatedSalary: String(parseProtectedFinancialNumber(row.estimatedSalary)),
    estimatedExtraPayment: String(parseProtectedFinancialNumber(row.estimatedExtraPayment)),
    monthlyInvestment: String(parseProtectedFinancialNumber(row.monthlyInvestment)),
    monthlyHomeExpense: String(parseProtectedFinancialNumber(row.monthlyHomeExpense)),
    monthlyPersonalBudget: String(parseProtectedFinancialNumber(row.monthlyPersonalBudget)),
    interestRate: String(parseProtectedFinancialNumber(row.interestRate)),
  };
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
    const previousYearData = await getYearData(user.id, latestYear);
    if (!previousYearData) {
      return Response.json({ error: "Previous year data is required" }, { status: 400 });
    }

    derivedStartingBalance = deriveStartingBalance(previousYearData);
  }

  const [row] = await db.insert(years).values({
    userId: user.id,
    year,
    startingBalance: protectFinancialNumber(derivedStartingBalance),
    estimatedSalary: protectFinancialNumber(estimatedSalary),
    hasExtraPayments: Boolean(hasExtraPayments),
    estimatedExtraPayment: protectFinancialNumber(estimatedExtraPayment),
    monthlyInvestment: protectFinancialNumber(monthlyInvestment),
    monthlyHomeExpense: protectFinancialNumber(monthlyHomeExpense),
    monthlyPersonalBudget: protectFinancialNumber(monthlyPersonalBudget),
    interestRate: protectFinancialNumber(interestRate),
  }).returning();

  const recurringValues = Array.isArray(recurringExpenses)
    ? recurringExpenses
        .map((entry, index) => ({
          yearId: row.id,
          label: String(entry.label ?? "").trim(),
          amount: Number(entry.amount) || 0,
          sortOrder: index,
        }))
        .filter((entry) => entry.label.length > 0)
        .map((entry) => ({
          ...entry,
          label: protectFinancialText(entry.label),
          amount: protectFinancialNumber(entry.amount),
        }))
    : [];

  if (recurringValues.length > 0) {
    await db.insert(yearRecurringExpenses).values(recurringValues);
  }

  await propagateYearCarryOver(user.id, year);

  return Response.json(publicYearRow(row), { status: 201 });
}
