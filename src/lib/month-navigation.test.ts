import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMonthNavigationOptions,
  filterMonthNavigationOptions,
} from "./month-navigation.ts";

test("buildMonthNavigationOptions returns all months in calendar order", () => {
  const options = buildMonthNavigationOptions("es");

  assert.strictEqual(options.length, 12);
  assert.deepStrictEqual(options.map((option) => option.month), [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);
  assert.strictEqual(options[0].label, "enero");
  assert.strictEqual(options[8].label, "septiembre");
});

test("filterMonthNavigationOptions matches Spanish month prefixes", () => {
  const options = buildMonthNavigationOptions("es");

  assert.deepStrictEqual(
    filterMonthNavigationOptions(options, "ene", "es").map((option) => option.month),
    [1],
  );
  assert.deepStrictEqual(
    filterMonthNavigationOptions(options, "sep", "es").map((option) => option.month),
    [9],
  );
});

test("filterMonthNavigationOptions uses the active locale", () => {
  const options = buildMonthNavigationOptions("en");

  assert.deepStrictEqual(
    filterMonthNavigationOptions(options, "jan", "en").map((option) => option.month),
    [1],
  );
  assert.deepStrictEqual(
    filterMonthNavigationOptions(options, "ene", "en"),
    [],
  );
});

test("filterMonthNavigationOptions ignores casing and diacritics", () => {
  const options = buildMonthNavigationOptions("es");

  assert.deepStrictEqual(
    filterMonthNavigationOptions(options, "ÉNE", "es").map((option) => option.month),
    [1],
  );
});

test("filterMonthNavigationOptions returns all months for an empty query", () => {
  const options = buildMonthNavigationOptions("es");

  assert.strictEqual(filterMonthNavigationOptions(options, "   ", "es"), options);
});

test("filterMonthNavigationOptions returns no matches for an unknown prefix", () => {
  const options = buildMonthNavigationOptions("es");

  assert.deepStrictEqual(
    filterMonthNavigationOptions(options, "zzz", "es"),
    [],
  );
});
