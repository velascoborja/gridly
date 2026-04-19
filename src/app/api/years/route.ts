import { db } from "@/db";
import { years } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { propagateYearCarryOver } from "@/lib/server/year-carry-over";
import { deriveStartingBalance, shouldAllowYearCreation } from "@/lib/server/year-planning";
import { getSessionUser } from "@/lib/server/session";
import { getYearData } from "@/lib/server/year-data";

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
  const { year, startingBalance = 0, estimatedSalary = 0, monthlyInvestment = 0, monthlyHomeExpense = 0, monthlyPersonalBudget = 0, interestRate = 0 } = body;

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
    startingBalance: String(derivedStartingBalance),
    estimatedSalary: String(estimatedSalary),
    monthlyInvestment: String(monthlyInvestment),
    monthlyHomeExpense: String(monthlyHomeExpense),
    monthlyPersonalBudget: String(monthlyPersonalBudget),
    interestRate: String(interestRate),
  }).returning();

  await propagateYearCarryOver(user.id, year);

  return Response.json(row, { status: 201 });
}
