import test from "node:test";
import assert from "node:assert/strict";

import {
  parseLocalizedNumber,
  parseMoneyExpression,
  sanitizeMoneyExpressionInput,
  sanitizeNumericInput,
} from "./currency-input.ts";

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

test("sanitizes money expressions while allowing arithmetic characters", () => {
  assert.equal(sanitizeMoneyExpressionInput("20 + café 30 €"), "20 +  30 ");
  assert.equal(sanitizeMoneyExpressionInput("(12,50+8.25)*2"), "(12,50+8.25)*2");
  assert.equal(sanitizeMoneyExpressionInput("100/4%"), "100/4");
});

test("parses plain money amounts without marking them as expressions", () => {
  assert.deepEqual(parseMoneyExpression("90"), { ok: true, value: 90, isExpression: false });
  assert.deepEqual(parseMoneyExpression("2.400,50 €"), { ok: true, value: 2400.5, isExpression: false });
  assert.deepEqual(parseMoneyExpression("2,400"), { ok: true, value: 2400, isExpression: false });
});

test("parses addition and subtraction money expressions", () => {
  assert.deepEqual(parseMoneyExpression("20+30+40"), { ok: true, value: 90, isExpression: true });
  assert.deepEqual(parseMoneyExpression("100-15"), { ok: true, value: 85, isExpression: true });
});

test("parses multiplication, division, precedence, and parentheses", () => {
  assert.deepEqual(parseMoneyExpression("20+30*2"), { ok: true, value: 80, isExpression: true });
  assert.deepEqual(parseMoneyExpression("(20+30)*2"), { ok: true, value: 100, isExpression: true });
  assert.deepEqual(parseMoneyExpression("100/4"), { ok: true, value: 25, isExpression: true });
});

test("parses decimal comma and decimal point inside expressions", () => {
  assert.deepEqual(parseMoneyExpression("(12,50+8,25)*2"), { ok: true, value: 41.5, isExpression: true });
  assert.deepEqual(parseMoneyExpression("10.5+2,5"), { ok: true, value: 13, isExpression: true });
});

test("supports unary minus but rejects negative final money amounts", () => {
  assert.deepEqual(parseMoneyExpression("100+-15"), { ok: true, value: 85, isExpression: true });
  assert.deepEqual(parseMoneyExpression("20-(50)"), { ok: false, reason: "negative" });
  assert.deepEqual(parseMoneyExpression("-20"), { ok: false, reason: "negative" });
});

test("rejects invalid money expressions", () => {
  assert.deepEqual(parseMoneyExpression(""), { ok: false, reason: "empty" });
  assert.deepEqual(parseMoneyExpression("20+"), { ok: false, reason: "syntax" });
  assert.deepEqual(parseMoneyExpression("(20+30"), { ok: false, reason: "syntax" });
  assert.deepEqual(parseMoneyExpression("abc"), { ok: false, reason: "empty" });
});

test("rejects division by zero and non-finite money expression results", () => {
  assert.deepEqual(parseMoneyExpression("10/0"), { ok: false, reason: "division-by-zero" });
  assert.deepEqual(parseMoneyExpression("10/(5-5)"), { ok: false, reason: "division-by-zero" });
});
