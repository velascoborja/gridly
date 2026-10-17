import test from "node:test";
import assert from "node:assert/strict";
import { calculateInvestmentRate } from "./annual-investment-rate.ts";
import { formatSavingsRate } from "./annual-savings-rate.ts";

test("investment rate preserves Evolution's ratio for positive, zero, negative and above-100% investment", () => {
  assert.equal(calculateInvestmentRate(3000, 24000), 0.125);
  assert.equal(calculateInvestmentRate(0, 24000), 0);
  assert.equal(calculateInvestmentRate(-3000, 24000), -0.125);
  assert.equal(calculateInvestmentRate(30000, 24000), 1.25);
});

test("investment rate is unavailable for null, zero or negative income", () => {
  for (const income of [null, 0, -1000]) {
    assert.equal(calculateInvestmentRate(3000, income), null);
    assert.equal(calculateInvestmentRate(0, income), null);
  }
});

test("investment rate uses the existing one-decimal localized percentage format", () => {
  const rate = calculateInvestmentRate(3000, 24000);
  const estimatedRate = calculateInvestmentRate(3000, 25000);

  assert.ok(rate !== null && estimatedRate !== null);
  assert.equal(estimatedRate, 0.12);
  assert.equal(formatSavingsRate(rate, "es"), "12,5\u00a0%");
  assert.equal(formatSavingsRate(rate, "en"), "12.5%");
  assert.equal(formatSavingsRate(estimatedRate, "es"), "12,0\u00a0%");
  assert.equal(formatSavingsRate(estimatedRate, "en"), "12.0%");
});
