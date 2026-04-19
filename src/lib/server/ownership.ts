import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { additionalEntries, months, years } from "@/db/schema";

export function statusForAuth(isAuthenticated: boolean) {
  return isAuthenticated ? 200 : 401;
}

export async function getOwnedYear(userId: string, year: number) {
  return db.query.years.findFirst({
    where: and(eq(years.userId, userId), eq(years.year, year)),
  });
}

export async function getOwnedMonth(userId: string, monthId: number) {
  const row = await db
    .select({ month: months })
    .from(months)
    .innerJoin(years, eq(months.yearId, years.id))
    .where(and(eq(months.id, monthId), eq(years.userId, userId)));

  return row[0]?.month ?? null;
}

export async function getOwnedEntry(userId: string, entryId: number) {
  const row = await db
    .select({ entry: additionalEntries })
    .from(additionalEntries)
    .innerJoin(months, eq(additionalEntries.monthId, months.id))
    .innerJoin(years, eq(months.yearId, years.id))
    .where(and(eq(additionalEntries.id, entryId), eq(years.userId, userId)));

  return row[0]?.entry ?? null;
}
