import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getGridlyYears,
  getNextCreatableYearFromOptions,
  pickDefaultYearOption,
} from "./year-navigation.ts";

test("historical year server helper scopes queries to the authenticated user and merges evolution sources", () => {
  const source = readFileSync(new URL("./historical-years.ts", import.meta.url), "utf8");

  assert.match(source, /eq\(historicalYears\.userId, userId\)/);
  assert.match(source, /parseHistoricalYearRow/);
  assert.match(source, /getEvolutionSourcesForUser/);
  assert.match(source, /source: "historical"/);
  assert.match(source, /source: "gridly"/);
});

test("year option helpers keep creation and default selection tied to Gridly years", () => {
  const options = [
    { year: 2021, source: "historical" as const },
    { year: 2022, source: "historical" as const },
    { year: 2024, source: "gridly" as const },
  ];

  assert.deepEqual(getGridlyYears(options), [2024]);
  assert.equal(getNextCreatableYearFromOptions(options, 2026), 2025);
  assert.deepEqual(pickDefaultYearOption(options, 2026), { year: 2024, source: "gridly" });
});
