import test from "node:test";
import assert from "node:assert/strict";
import {
  getDemoHref,
  getDemoSummaryHref,
  getDemoYearData,
  DEMO_YEAR,
  DEMO_MONTH,
} from "./demo-year.ts";

test("demo year data exposes the canonical public demo route", () => {
  assert.equal(DEMO_YEAR, 2026);
  assert.equal(DEMO_MONTH, 4);
});

test("getDemoHref returns the canonical demo month path", () => {
  assert.equal(getDemoHref(), "/demo/2026/4");
});

test("getDemoSummaryHref returns the canonical demo summary path", () => {
  assert.equal(getDemoSummaryHref(), "/demo/2026/summary");
});

test("demo year data contains 12 chained months with extra pays in June and December", () => {
  const data = getDemoYearData();

  assert.equal(data.config.year, DEMO_YEAR);
  assert.equal(data.months.length, 12);

  for (let index = 1; index < data.months.length; index += 1) {
    assert.equal(
      data.months[index].startingBalance,
      data.months[index - 1].endingBalance
    );
  }

  assert.equal(data.months[5].additionalPayslip, data.config.estimatedSalary);
  assert.equal(data.months[11].additionalPayslip, data.config.estimatedSalary);
  assert.deepEqual(data.months[0].additionalExpenses, [
    { id: 101, monthId: 1, type: "expense", label: "Seguro anual", amount: 320 },
  ]);
  assert.deepEqual(data.months[3].additionalIncomes, [
    { id: 401, monthId: 4, type: "income", label: "Devolucion IRPF", amount: 540 },
  ]);
  assert.equal(data.months[6].bonus, 780);
  assert.deepEqual(data.months[8].additionalExpenses, [
    { id: 901, monthId: 9, type: "expense", label: "Vacaciones", amount: 690 },
  ]);
});
