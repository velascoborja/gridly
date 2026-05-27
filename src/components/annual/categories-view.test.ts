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
  assert.match(source, /isOpen && <DrilldownList/);
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

test("categories page mirrors summary page structure", () => {
  const source = readFileSync(
    new URL("../../app/[locale]/[year]/categories/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /getYearData/);
  assert.match(source, /getYearsForUser/);
  assert.match(source, /initialView="categories"/);
  assert.match(source, /requireSessionUser/);
});

test("year-page-client renders CategoriesView for the categories view", () => {
  const source = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /CategoriesView/);
  assert.match(source, /selectedView === "categories"/);
  assert.match(source, /handleCategoriesSelect/);
  assert.match(source, /buildYearCategoriesHref/);
  assert.match(source, /window\.history\.pushState\(null, "", buildYearCategoriesHref/);
});

test("nav-selectors includes categories tab pointing at buildYearCategoriesHref", () => {
  const source = readFileSync(new URL("../layout/nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(source, /buildYearCategoriesHref/);
  assert.match(source, /key: "categories"/);
  assert.match(source, /t\("categories"\)/);
  assert.match(source, /view === "categories" \? "categories"/);
});

test("year-routes parses and builds categories paths correctly", () => {
  const source = readFileSync(new URL("../../lib/year-routes.ts", import.meta.url), "utf8");

  assert.match(source, /\/categories\$/);
  assert.match(source, /view: "categories"/);
  assert.match(source, /export function buildYearCategoriesHref/);
  assert.match(source, /summary\|categories/);
});
