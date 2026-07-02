import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CategoriesView uses computeTagStats with useMemo", () => {
  const source = readFileSync(new URL("./categories-view.tsx", import.meta.url), "utf8");

  assert.match(source, /computeTagStats/);
  assert.match(source, /useMemo/);
  assert.match(source, /yearData\]/);
});

test("CategoriesView renders TagStatRow for each stat", () => {
  const source = readFileSync(new URL("./categories-view.tsx", import.meta.url), "utf8");

  assert.match(source, /TagStatRow/);
  assert.match(source, /stats\.map/);
  assert.match(source, /maxAmount/);
});

test("CategoriesView renders an empty state when there are no entries", () => {
  const source = readFileSync(new URL("./categories-view.tsx", import.meta.url), "utf8");

  assert.match(source, /emptyState/);
  assert.match(source, /t\("emptyState"\)/);
});

test("TagStatRow expands to show DrilldownList when clicked", () => {
  const source = readFileSync(new URL("./tag-stat-row.tsx", import.meta.url), "utf8");

  assert.match(source, /DrilldownList/);
  assert.match(source, /isOpen/);
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /isOpen \? "grid-rows-\[1fr\]" : "grid-rows-\[0fr\]"/);
  assert.match(source, /<DrilldownList/);
});

test("TagStatRow uses TAG_COLORS for the dot and progress bar", () => {
  const source = readFileSync(new URL("./tag-stat-row.tsx", import.meta.url), "utf8");

  assert.match(source, /TAG_COLORS/);
  assert.match(source, /tagColor\.bg/);
  assert.match(source, /tagColor\.border/);
});

test("DrilldownList shows month abbreviation, description, and amount", () => {
  const source = readFileSync(new URL("./drilldown-list.tsx", import.meta.url), "utf8");

  assert.match(source, /formatMonthName/);
  assert.match(source, /entry\.description/);
  assert.match(source, /formatCurrency/);
  assert.match(source, /entry\.groupName/);
});

test("DrilldownList shows month subtotals only when a month has multiple entries", () => {
  const source = readFileSync(new URL("./drilldown-list.tsx", import.meta.url), "utf8");

  assert.match(source, /totalAmount: monthEntries\.reduce/);
  assert.match(source, /monthEntries\.length > 1/);
  assert.match(source, /formatCurrency\(totalAmount, locale\)/);
  assert.match(source, /text-primary/);
});

test("DrilldownList collapses multi-year groups by default with year totals", () => {
  const source = readFileSync(new URL("./drilldown-list.tsx", import.meta.url), "utf8");

  assert.match(source, /expandedYears/);
  assert.match(source, /new Set\(\)/);
  assert.match(source, /totalAmount: yearEntries\.reduce/);
  assert.match(source, /aria-expanded=\{isExpanded\}/);
  assert.match(source, /isExpanded \? "grid-rows-\[1fr\]" : "grid-rows-\[0fr\]"/);
  assert.match(source, /formatCurrency\(totalAmount, locale\)/);
});

test("kpi-cards renders CategoriesView inside a dialog", () => {
  const source = readFileSync(new URL("./kpi-cards.tsx", import.meta.url), "utf8");

  assert.match(source, /CategoriesView/);
  assert.match(source, /<CategoriesView/);
  assert.match(source, /DialogContent/);
});
