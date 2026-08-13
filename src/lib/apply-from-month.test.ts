import test from "node:test";
import assert from "node:assert/strict";
import { parseApplyFromMonth } from "./apply-from-month.ts";

test("parseApplyFromMonth defaults an omitted value to January", () => {
  assert.equal(parseApplyFromMonth(undefined), 1);
});

test("parseApplyFromMonth accepts integer month numbers", () => {
  for (const month of [1, 6, 12]) {
    assert.equal(parseApplyFromMonth(month), month);
  }
});

test("parseApplyFromMonth rejects invalid explicit values", () => {
  for (const value of [0, 13, 6.5, "June", "6", null, true, false]) {
    assert.equal(parseApplyFromMonth(value), null);
  }
});
