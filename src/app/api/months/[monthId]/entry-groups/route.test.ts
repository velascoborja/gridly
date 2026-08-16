import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("creating an empty entry group does not trigger carry-over", () => {
  assert.doesNotMatch(source, /getYearNumberForYearId/);
  assert.doesNotMatch(source, /propagateYearCarryOver/);
});
