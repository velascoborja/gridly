import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("tag-stats exports DrilldownEntry, TagStat, TagStats types and computeTagStats function", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /export interface DrilldownEntry/);
  assert.match(source, /export interface TagStat/);
  assert.match(source, /export interface TagStats/);
  assert.match(source, /export function computeTagStats/);
});

test("computeTagStats buckets ungrouped expenses by tagId and untagged entries under null", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /additionalExpenses/);
  assert.match(source, /entry\.tagId/);
  assert.match(source, /entry\.tag/);
});

test("computeTagStats attributes group entries to the group tag and records groupName", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /additionalExpenseGroups/);
  assert.match(source, /group\.tagId/);
  assert.match(source, /groupName: group\.label/);
});

test("computeTagStats sorts entries by month ascending within each bucket", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /sort\(.*a\.month.*b\.month/);
});

test("computeTagStats places the untagged bucket last in the output array", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /untaggedStat/);
  assert.match(source, /tagStats\.push\(untaggedStat\)/);
});

test("computeTagStats returns zero shareOfTotal when totalAdditional is zero", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /totalAdditional > 0 \? .* : 0/);
});

test("computeTagStats buckets recurring expenses by tagId like additional expenses", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /monthData\.recurringExpenses/);
  assert.match(source, /expense\.tagId/);
  assert.match(source, /expense\.tag/);
});

test("DrilldownEntry has an optional year field", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /year\?\s*:\s*number/);
});

test("computeMultiYearTagStats is exported", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /export function computeMultiYearTagStats/);
});

test("computeMultiYearTagStats fills year on DrilldownEntry from yearData.config.year", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /yearData\.config\.year/);
  assert.match(source, /year,/);
});

test("computeMultiYearTagStats sorts entries by year ascending then month", () => {
  const source = readFileSync(new URL("./tag-stats.ts", import.meta.url), "utf8");

  assert.match(source, /a\.year.*b\.year/);
});

import { mergeTagStatsByYear, type TagStats } from "./tag-stats.ts";

function singleYearStats(): TagStats {
  return {
    totalAdditional: 100,
    stats: [
      {
        tag: { id: 1, name: "Food", color: "rose" },
        totalAmount: 60,
        entryCount: 1,
        shareOfTotal: 0.6,
        entries: [{ month: 3, description: "Lunch", amount: 60 }],
      },
      {
        tag: null,
        totalAmount: 40,
        entryCount: 1,
        shareOfTotal: 0.4,
        entries: [{ month: 5, description: "Misc", amount: 40 }],
      },
    ],
  };
}

test("mergeTagStatsByYear stamps each entry with its year", () => {
  const merged = mergeTagStatsByYear([{ year: 2024, stats: singleYearStats() }]);
  const allEntries = merged.stats.flatMap((s) => s.entries);
  assert.ok(allEntries.length > 0);
  assert.ok(allEntries.every((e) => e.year === 2024));
});

test("mergeTagStatsByYear merges same-tag buckets across years and recomputes totals", () => {
  const merged = mergeTagStatsByYear([
    { year: 2024, stats: singleYearStats() },
    { year: 2025, stats: singleYearStats() },
  ]);
  assert.equal(merged.totalAdditional, 200);
  const food = merged.stats.find((s) => s.tag?.id === 1)!;
  assert.equal(food.totalAmount, 120);
  assert.equal(food.entryCount, 2);
  assert.equal(food.shareOfTotal, 0.6);
});

test("mergeTagStatsByYear keeps the untagged bucket last", () => {
  const merged = mergeTagStatsByYear([{ year: 2024, stats: singleYearStats() }]);
  assert.equal(merged.stats.at(-1)!.tag, null);
});

test("mergeTagStatsByYear sorts merged entries by year then month", () => {
  const merged = mergeTagStatsByYear([
    { year: 2025, stats: singleYearStats() },
    { year: 2024, stats: singleYearStats() },
  ]);
  const food = merged.stats.find((s) => s.tag?.id === 1)!;
  assert.deepEqual(
    food.entries.map((e) => e.year),
    [2024, 2025],
  );
});

test("mergeTagStatsByYear returns empty stats for empty input", () => {
  const merged = mergeTagStatsByYear([]);
  assert.deepEqual(merged.stats, []);
  assert.equal(merged.totalAdditional, 0);
});

test("tag-stats messages keys exist in both locales", () => {
  const spanish = JSON.parse(readFileSync(new URL("../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../messages/en.json", import.meta.url), "utf8"));

  assert.ok(spanish.Annual.categories, "es.json should have Annual.categories namespace");
  assert.ok(english.Annual.categories, "en.json should have Annual.categories namespace");
  assert.equal(spanish.Nav.categories, "Categorías");
  assert.equal(english.Nav.categories, "Categories");
  assert.equal(spanish.Annual.categories.untagged, "Sin etiqueta");
  assert.equal(english.Annual.categories.untagged, "Untagged");
});
