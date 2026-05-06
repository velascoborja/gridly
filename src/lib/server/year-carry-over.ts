import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { years } from "@/db/schema";
import { deriveStartingBalance } from "@/lib/server/year-planning";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { protectFinancialNumber } from "@/lib/server/financial-data-privacy";

export async function propagateYearCarryOver(userId: string, startYear: number) {
  const sortedYears = (await getYearsForUser(userId)).sort((a, b) => a - b);
  const downstreamYears = sortedYears.filter((year) => year > startYear);

  let previousYearData = await getYearData(userId, startYear);
  if (!previousYearData) {
    return;
  }

  for (const year of downstreamYears) {
    const startingBalance = deriveStartingBalance(previousYearData);

    await db
      .update(years)
      .set({ startingBalance: protectFinancialNumber(startingBalance) })
      .where(and(eq(years.userId, userId), eq(years.year, year)));

    previousYearData = await getYearData(userId, year);
    if (!previousYearData) {
      break;
    }
  }
}

export async function getYearNumberForYearId(yearId: number) {
  const row = await db.query.years.findFirst({
    columns: { year: true },
    where: eq(years.id, yearId),
  });

  return row?.year ?? null;
}
