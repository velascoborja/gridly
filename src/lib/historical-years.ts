import type { HistoricalYearInput } from "./types";

export type HistoricalYearValidationError =
  | "missingGridlyYear"
  | "invalidYear"
  | "yearNotBeforeFirstGridlyYear"
  | "yearAlreadyExistsAsGridly"
  | "duplicateHistoricalYear"
  | "invalidStartingBalance"
  | "invalidFinalBalance"
  | "invalidInvestedAmount"
  | "invalidSavingsRate";

export type HistoricalYearPayloadResult =
  | HistoricalYearInput
  | { error: HistoricalYearValidationError };

function isFiniteCurrencyValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseHistoricalYearPayload(payload: unknown): HistoricalYearPayloadResult {
  const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const year = body.year;
  const startingBalance = body.startingBalance;
  const finalBalance = body.finalBalance;
  const investedAmount = body.investedAmount;
  const savingsRate = body.savingsRate;

  if (typeof year !== "number" || !Number.isInteger(year)) return { error: "invalidYear" };
  if (!isFiniteCurrencyValue(startingBalance)) return { error: "invalidStartingBalance" };
  if (!isFiniteCurrencyValue(finalBalance)) return { error: "invalidFinalBalance" };
  if (!isFiniteCurrencyValue(investedAmount) || investedAmount < 0) return { error: "invalidInvestedAmount" };

  let parsedSavingsRate: number | null = null;
  if (savingsRate !== null && savingsRate !== undefined) {
    if (typeof savingsRate !== "number" || !Number.isFinite(savingsRate) || savingsRate < 0 || savingsRate > 1) {
      return { error: "invalidSavingsRate" };
    }
    parsedSavingsRate = savingsRate;
  }

  return { year, startingBalance, finalBalance, investedAmount, savingsRate: parsedSavingsRate };
}

export function validateHistoricalYearEligibility({
  year,
  gridlyYears,
  historicalYears,
  currentHistoricalYear,
}: {
  year: number;
  gridlyYears: number[];
  historicalYears: number[];
  currentHistoricalYear?: number;
}): HistoricalYearValidationError | null {
  if (!Number.isInteger(year)) return "invalidYear";
  if (gridlyYears.length === 0) return "missingGridlyYear";
  if (gridlyYears.includes(year)) return "yearAlreadyExistsAsGridly";

  const earliestGridlyYear = Math.min(...gridlyYears);
  if (year >= earliestGridlyYear) return "yearNotBeforeFirstGridlyYear";

  const duplicatesAnotherHistoricalYear = historicalYears.some(
    (candidate) => candidate === year && candidate !== currentHistoricalYear
  );
  if (duplicatesAnotherHistoricalYear) return "duplicateHistoricalYear";

  return null;
}

export function deriveHistoricalSavedAmount(
  input: Pick<HistoricalYearInput, "startingBalance" | "finalBalance">
): number {
  return input.finalBalance - input.startingBalance;
}

export function serializeHistoricalYearMoney(input: HistoricalYearInput) {
  return {
    year: input.year,
    startingBalance: input.startingBalance.toFixed(2),
    finalBalance: input.finalBalance.toFixed(2),
    investedAmount: input.investedAmount.toFixed(2),
    savingsRate: input.savingsRate !== null ? input.savingsRate.toFixed(4) : null,
  };
}
