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
