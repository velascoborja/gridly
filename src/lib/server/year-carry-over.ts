import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { years } from "@/db/schema";
import { deriveStartingBalance } from "@/lib/server/year-planning";
import { getYearDataSnapshot, getYearsForUser } from "@/lib/server/year-data";
import {
  propagateVersionedCarryOver,
  type CarryOverStore,
} from "@/lib/server/year-carry-over-engine";

function predecessorVersionMatches(userId: string, year: number, version: number) {
  return sql`EXISTS (
    SELECT 1
    FROM "years" AS "carry_predecessor"
    WHERE "carry_predecessor"."user_id" = ${userId}
      AND "carry_predecessor"."year" = ${year}
      AND "carry_predecessor"."carry_over_version" = ${version}
  )`;
}

function createCarryOverStore(userId: string): CarryOverStore {
  return {
    listYears: () => getYearsForUser(userId),
    bumpVersion: async (year) => {
      const [versionedYear] = await db
        .update(years)
        .set({ carryOverVersion: sql`${years.carryOverVersion} + 1` })
        .where(and(eq(years.userId, userId), eq(years.year, year)))
        .returning({ carryOverVersion: years.carryOverVersion });
      return Boolean(versionedYear);
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
      predecessorYear,
      predecessorVersion,
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
            predecessorVersionMatches(userId, predecessorYear, predecessorVersion)
          )
        )
        .returning({ carryOverVersion: years.carryOverVersion });
      return Boolean(updatedYear);
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
