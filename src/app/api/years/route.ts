import { db } from "@/db";
import { years } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select({ year: years.year, id: years.id }).from(years).orderBy(asc(years.year));
  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { year, startingBalance = 0, estimatedSalary = 0, monthlyInvestment = 0, monthlyHomeExpense = 0, monthlyPersonalBudget = 0, interestRate = 0 } = body;

  if (!year) return Response.json({ error: "year is required" }, { status: 400 });

  const [row] = await db.insert(years).values({
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
