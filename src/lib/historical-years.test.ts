import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveHistoricalSavedAmount,
  parseHistoricalYearPayload,
  serializeHistoricalYearMoney,
  validateHistoricalYearEligibility,
} from "./historical-years.ts";

test("parseHistoricalYearPayload accepts finite money values and allows negative savings", () => {
  const parsed = parseHistoricalYearPayload({
    year: 2022,
    startingBalance: 5000,
    finalBalance: 4250,
    investedAmount: 1200,
  });

  assert.deepEqual(parsed, {
    year: 2022,
    startingBalance: 5000,
    finalBalance: 4250,
    investedAmount: 1200,
    savingsRate: null,
  });
  assert.equal(deriveHistoricalSavedAmount(parsed), -750);
});

test("parseHistoricalYearPayload rejects invalid year and invested amount", () => {
  const r1 = parseHistoricalYearPayload({ year: 2022.5, startingBalance: 0, finalBalance: 1, investedAmount: 0 });
  assert.equal("error" in r1 ? r1.error : null, "invalidYear");
  const r2 = parseHistoricalYearPayload({ year: 2022, startingBalance: 0, finalBalance: 1, investedAmount: -1 });
  assert.equal("error" in r2 ? r2.error : null, "invalidInvestedAmount");
});

test("validateHistoricalYearEligibility enforces pre-Gridly-only imports", () => {
  assert.equal(validateHistoricalYearEligibility({ year: 2023, gridlyYears: [], historicalYears: [] }), "missingGridlyYear");
  assert.equal(
    validateHistoricalYearEligibility({ year: 2024, gridlyYears: [2024], historicalYears: [] }),
    "yearAlreadyExistsAsGridly"
  );
  assert.equal(
    validateHistoricalYearEligibility({ year: 2025, gridlyYears: [2024], historicalYears: [] }),
    "yearNotBeforeFirstGridlyYear"
  );
  assert.equal(
    validateHistoricalYearEligibility({ year: 2023, gridlyYears: [2024], historicalYears: [2023] }),
    "duplicateHistoricalYear"
  );
  assert.equal(
    validateHistoricalYearEligibility({
      year: 2023,
      gridlyYears: [2024],
      historicalYears: [2023],
      currentHistoricalYear: 2023,
    }),
    null
  );
});

test("serializeHistoricalYearMoney converts numeric fields to Drizzle numeric strings", () => {
  assert.deepEqual(
    serializeHistoricalYearMoney({
      year: 2022,
      startingBalance: 1000.5,
      finalBalance: 1200.25,
      investedAmount: 300,
      savingsRate: null,
    }),
    {
      year: 2022,
      startingBalance: "1000.50",
      finalBalance: "1200.25",
      investedAmount: "300.00",
      savingsRate: null,
    }
  );
});
