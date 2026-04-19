import { db } from "@/db";
import { years } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/server/session";

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

  const existingYear = await db.query.years.findFirst({
    where: and(eq(years.userId, user.id), eq(years.year, year)),
  });

  if (existingYear) {
    return Response.json({ error: "Year already exists" }, { status: 409 });
  }

  const [row] = await db.insert(years).values({
    userId: user.id,
    year,
    startingBalance: String(startingBalance),
    estimatedSalary: String(estimatedSalary),
    monthlyInvestment: String(monthlyInvestment),
    monthlyHomeExpense: String(monthlyHomeExpense),
    monthlyPersonalBudget: String(monthlyPersonalBudget),
    interestRate: String(interestRate),
  }).returning();

  return Response.json(row, { status: 201 });
}
