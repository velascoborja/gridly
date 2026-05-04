import test from "node:test";
import assert from "node:assert/strict";

import { parseLocalizedNumber } from "./currency-input.ts";

test("parses formatted currency strings back to numeric values", () => {
  assert.equal(parseLocalizedNumber("24.000 €"), 24000);
  assert.equal(parseLocalizedNumber("2.400,50 €"), 2400.5);
  assert.equal(parseLocalizedNumber("2,400 €"), 2400);
});
