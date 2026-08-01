import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { years } from "@/db/schema";
import { deriveStartingBalance } from "@/lib/server/year-planning";
import { getYearDataSnapshot } from "@/lib/server/year-data";
import {
  propagateVersionedCarryOver,
  type CarryOverStore,
} from "@/lib/server/year-carry-over-engine";

function createCarryOverStore(userId: string): CarryOverStore {
  return {
    listYears: () =>
      db
        .select({
          year: years.year,
          version: years.carryOverVersion,
        })
        .from(years)
        .where(eq(years.userId, userId))
        .orderBy(asc(years.year)),
    compareAndIncrementVersion: async ({ year, version: expectedVersion }) => {
      const [versionedYear] = await db
        .update(years)
        .set({ carryOverVersion: sql`${years.carryOverVersion} + 1` })
        .where(
          and(
            eq(years.userId, userId),
            eq(years.year, year),
            eq(years.carryOverVersion, expectedVersion),
          ),
        )
        .returning({ carryOverVersion: years.carryOverVersion });
      return versionedYear?.carryOverVersion ?? null;
    },
    getSnapshot: async (year) => {
      const snapshot = await getYearDataSnapshot(userId, year);
      if (!snapshot) return null;
      return {
        year: snapshot.data.config.year,
        version: snapshot.carryOverVersion,
        nextStartingBalance: deriveStartingBalance(snapshot.data),
      };
    },
    updateStartingBalance: async ({
      year,
      startingBalance,
      expectedVersion,
    }) => {
      const [updatedYear] = await db
        .update(years)
        .set({
          startingBalance: String(startingBalance),
          carryOverVersion: sql`${years.carryOverVersion} + 1`,
        })
        .where(
          and(
            eq(years.userId, userId),
            eq(years.year, year),
            eq(years.carryOverVersion, expectedVersion),
          ),
        )
        .returning({ carryOverVersion: years.carryOverVersion });
      return updatedYear?.carryOverVersion ?? null;
    },
  };
}

export async function propagateYearCarryOver(userId: string, startYear: number) {
  await propagateVersionedCarryOver(createCarryOverStore(userId), startYear);
}

export async function getYearNumberForYearId(yearId: number) {
  const row = await db.query.years.findFirst({
    columns: { year: true },
    where: eq(years.id, yearId),
  });

  return row?.year ?? null;
}
