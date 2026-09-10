import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("evolution drilldown requires authentication and disables shared caching", () => {
  assert.match(source, /getSessionUser/);
  assert.match(source, /status: 401/);
  assert.match(source, /private, no-store/);
});

test("evolution drilldown validates kind and year parameters", () => {
  assert.match(source, /kind !== "tags"/);
  assert.match(source, /kind !== "fixed"/);
  assert.match(source, /Number\.isInteger\(year\)/);
  assert.match(source, /status: 400/);
  assert.match(source, /status: 404/);
});

test("evolution drilldown computes only the requested detail shape", () => {
  assert.match(source, /computeTagStats/);
  assert.match(source, /computeFixedStats/);
  assert.match(source, /mergeTagStatsByYear/);
  assert.match(source, /mergeFixedStatsByYear/);
  assert.match(source, /getYearData\(user\.id, year\)/);
  assert.match(source, /stats\.totalAdditional > 0/);
  assert.match(source, /stats\.grandTotal > 0/);
});

test("all-years drilldown filters future years unless explicitly included", () => {
  assert.match(source, /includeFuture \? \{\} : \{ maxYear: new Date\(\)\.getFullYear\(\) \}/);
});
