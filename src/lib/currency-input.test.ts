import test from "node:test";
import assert from "node:assert/strict";

import { parseLocalizedNumber, sanitizeNumericInput } from "./currency-input.ts";

test("parses formatted currency strings back to numeric values", () => {
  assert.equal(parseLocalizedNumber("24.000 €"), 24000);
  assert.equal(parseLocalizedNumber("2.400,50 €"), 2400.5);
  assert.equal(parseLocalizedNumber("2,400 €"), 2400);
});

test("sanitizes typed setup numbers to digits and decimal separators", () => {
  assert.equal(sanitizeNumericInput("2a.4b0c0 €"), "2.400");
  assert.equal(sanitizeNumericInput("1,25%"), "1,25");
  assert.equal(sanitizeNumericInput(" -12.30 "), "12.30");
});
