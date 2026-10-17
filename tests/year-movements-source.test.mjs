import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("movements share the mounted year data and provide immediate lazy-loading feedback", () => {
  const source = read("src/components/year/year-page-client.tsx");
  assert.match(source, /import\("@\/components\/annual\/year-movements-view"\)/);
  assert.match(source, /loading: \(\) => <YearViewLoading view="movements"/);
  assert.match(source, /<YearMovementsView[\s\S]*?key=\{currentYearData.config.year\}[\s\S]*?yearData=\{currentYearData\}/);
  assert.match(source, /onMovementsSelect=\{handleMovementsSelect\}/);
  assert.match(source, /window.history.pushState\(null, "", buildYearMovementsHref/);
});

test("entry and return links intercept only locally handled navigation", () => {
  const source = read("src/components/annual/kpi-cards.tsx");
  assert.match(source, /href=\{movementsHref\}[\s\S]*?onNavigate=[\s\S]*?if \(!onMovementsSelect\) return;[\s\S]*?event.preventDefault\(\);[\s\S]*?onMovementsSelect\(\)/);
  const movements = read("src/components/annual/year-movements-view.tsx");
  assert.match(movements, /href=\{buildYearSummaryHref\(pathPrefix, year\)\}[\s\S]*?if \(!onSummarySelect\) return;[\s\S]*?event.preventDefault\(\)/);
  assert.doesNotMatch(movements, /fetch\(|router\.(?:push|refresh)/);
});

test("month expansion and selector state are independent, accessible and initially expanded", () => {
  const source = read("src/components/annual/year-movements-view.tsx");
  assert.match(source, /useState<MovementType>\("expense"\)/);
  assert.match(source, /useState<Set<number>>\(\(\) => new Set\(\)\)/);
  assert.match(source, /onClick=\{\(\) => setType\(option\)\}/);
  assert.match(source, /aria-pressed=\{type === option\}/);
  assert.match(source, /aria-expanded=\{expanded\}/);
  assert.match(source, /aria-controls=\{monthId\}/);
  assert.match(source, /hidden=\{!expanded\}/);
  assert.match(source, /sticky top-\[var\(--app-sticky-header-height,0px\)\]/);
  assert.match(read("src/components/layout/base-app-shell.tsx"), /new ResizeObserver\(measureHeader\)/);
});

test("both year menus keep the movements destination on year changes", () => {
  for (const name of ["nav-selectors", "mobile-year-menu"]) {
    const source = read(`src/components/layout/${name}.tsx`);
    assert.match(source, /if \(view === "movements"\)[\s\S]*?router.push\(buildYearMovementsHref/);
  }
});

test("direct and demo routes validate access and include loading boundaries", () => {
  const route = read("src/app/[locale]/[year]/movements/page.tsx");
  assert.match(route, /requireSessionUser\(\)/);
  assert.match(route, /getYearData\(user.id, year\)/);
  assert.match(route, /if \(!yearData\) notFound\(\)/);
  assert.match(route, /initialView="movements"/);
  const demo = read("src/app/[locale]/demo/[year]/movements/page.tsx");
  assert.match(demo, /year !== DEMO_YEAR/);
  assert.match(demo, /<YearMovementsView yearData=\{getDemoYearData\(\)\} pathPrefix="\/demo"/);
  for (const path of ["[year]", "demo/[year]"]) {
    assert.match(read(`src/app/[locale]/${path}/movements/loading.tsx`), /<YearViewLoading view="movements"/);
  }
});

test("all new labels are translated and feature documentation is linked", () => {
  const spanish = JSON.parse(read("messages/es.json"));
  const english = JSON.parse(read("messages/en.json"));
  assert.deepEqual(Object.keys(spanish.Annual.movements).sort(), Object.keys(english.Annual.movements).sort());
  assert.ok(spanish.Annual.movementsButton && english.Annual.movementsButton);
  assert.ok(spanish.Demo.movements.title && english.Demo.movements.title);
  assert.match(read("AGENTS.md"), /docs\/features\/year-movements.md/);
});
