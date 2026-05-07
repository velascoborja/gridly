import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { historicalYears } from "@/db/schema";
import {
  parseHistoricalYearPayload,
  serializeHistoricalYearMoney,
  validateHistoricalYearEligibility,
  type HistoricalYearValidationError,
} from "@/lib/historical-years";
import type { EvolutionMetricSource } from "@/lib/evolution";
import type { HistoricalYear, HistoricalYearInput } from "@/lib/types";
import { getAllYearDataForUser, getYearsForUser } from "./year-data";

export function parseHistoricalYearRow(row: typeof historicalYears.$inferSelect): HistoricalYear {
  return {
    id: row.id,
    userId: row.userId,
    year: row.year,
    startingBalance: parseFloat(row.startingBalance),
    finalBalance: parseFloat(row.finalBalance),
    investedAmount: parseFloat(row.investedAmount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getHistoricalYearsForUser(userId: string, options: { maxYear?: number } = {}) {
  const predicates = [eq(historicalYears.userId, userId)];
  if (options.maxYear !== undefined) predicates.push(lte(historicalYears.year, options.maxYear));

  const rows = await db
    .select()
    .from(historicalYears)
    .where(and(...predicates))
    .orderBy(asc(historicalYears.year));

  return rows.map(parseHistoricalYearRow);
}

async function validateHistoricalYearForWrite(
  userId: string,
  input: HistoricalYearInput,
  currentHistoricalRow?: HistoricalYear
): Promise<HistoricalYearValidationError | null> {
  const [gridlyYears, historicalRows] = await Promise.all([
    getYearsForUser(userId),
    getHistoricalYearsForUser(userId),
  ]);

  return validateHistoricalYearEligibility({
    year: input.year,
    gridlyYears,
    historicalYears: historicalRows.map((row) => row.year),
    currentHistoricalYear: currentHistoricalRow?.year,
  });
}

export async function createHistoricalYearForUser(userId: string, payload: unknown) {
  const parsed = parseHistoricalYearPayload(payload);
  if ("error" in parsed) return { ok: false as const, error: parsed.error, status: 400 };

  const validationError = await validateHistoricalYearForWrite(userId, parsed);
  if (validationError) {
    return {
      ok: false as const,
      error: validationError,
      status: validationError === "duplicateHistoricalYear" ? 409 : 400,
    };
  }

  const [row] = await db
    .insert(historicalYears)
    .values({ userId, ...serializeHistoricalYearMoney(parsed) })
    .returning();

  return { ok: true as const, historicalYear: parseHistoricalYearRow(row) };
}

export async function updateHistoricalYearForUser(userId: string, id: number, payload: unknown) {
  const [existing] = await db
    .select()
    .from(historicalYears)
    .where(and(eq(historicalYears.userId, userId), eq(historicalYears.id, id)))
    .limit(1);
  if (!existing) return { ok: false as const, error: "notFound", status: 404 };

  const parsed = parseHistoricalYearPayload(payload);
  if ("error" in parsed) return { ok: false as const, error: parsed.error, status: 400 };

  const validationError = await validateHistoricalYearForWrite(userId, parsed, parseHistoricalYearRow(existing));
  if (validationError) {
    return {
      ok: false as const,
      error: validationError,
      status: validationError === "duplicateHistoricalYear" ? 409 : 400,
    };
  }

  const [row] = await db
    .update(historicalYears)
    .set({ ...serializeHistoricalYearMoney(parsed), updatedAt: new Date() })
    .where(and(eq(historicalYears.userId, userId), eq(historicalYears.id, id)))
    .returning();

  return { ok: true as const, historicalYear: parseHistoricalYearRow(row) };
}

export async function deleteHistoricalYearForUser(userId: string, id: number) {
  const [row] = await db
    .delete(historicalYears)
    .where(and(eq(historicalYears.userId, userId), eq(historicalYears.id, id)))
    .returning({ id: historicalYears.id });

  if (!row) return { ok: false as const, error: "notFound", status: 404 };
  return { ok: true as const };
}

export async function getEvolutionSourcesForUser(userId: string, maxYear: number): Promise<EvolutionMetricSource[]> {
  const [historicalRows, gridlyYearData] = await Promise.all([
    getHistoricalYearsForUser(userId, { maxYear }),
    getAllYearDataForUser(userId, { maxYear }),
  ]);

  return [
    ...historicalRows.map((row): EvolutionMetricSource => ({
      source: "historical",
      year: row.year,
      startingBalance: row.startingBalance,
      finalBalance: row.finalBalance,
      investedAmount: row.investedAmount,
    })),
    ...gridlyYearData.map((yearData): EvolutionMetricSource => ({ source: "gridly", yearData })),
  ].sort((a, b) => {
    const aYear = a.source === "gridly" ? a.yearData.config.year : a.year;
    const bYear = b.source === "gridly" ? b.yearData.config.year : b.year;
    return aYear - bYear;
  });
}
