import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("historical years collection route requires auth and delegates validation", () => {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

  assert.match(source, /getSessionUser/);
  assert.match(source, /status: 401/);
  assert.match(source, /getHistoricalYearsForUser/);
  assert.match(source, /createHistoricalYearForUser/);
});

test("historical years item route requires ownership for update and delete", () => {
  const source = readFileSync(new URL("./[id]/route.ts", import.meta.url), "utf8");

  assert.match(source, /getSessionUser/);
  assert.match(source, /updateHistoricalYearForUser/);
  assert.match(source, /deleteHistoricalYearForUser/);
  assert.match(source, /status: result.status/);
});

test("historical years API does not trigger carry-over propagation", () => {
  const collection = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const item = readFileSync(new URL("./[id]/route.ts", import.meta.url), "utf8");

  assert.doesNotMatch(collection, /propagateYearCarryOver/);
  assert.doesNotMatch(item, /propagateYearCarryOver/);
});
