import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("peak month headers use a compact icon with a translated accessible description", () => {
  const source = read("src/components/annual/year-movements-view.tsx");
  assert.match(source, /<Trophy aria-hidden="true" className="size-4"/);
  assert.match(source, /title=\{t\("peakBadge"\)\}/);
  assert.match(source, /id=\{`\$\{monthId\}-peak`\} className="sr-only">\{t\("peakBadge"\)\}/);
  assert.match(source, /aria-describedby=\{\[isCurrentMonth && `\$\{monthId\}-current`, isPeak && `\$\{monthId\}-peak`\]/);
  assert.match(source, /inline-flex min-w-0 items-center gap-1\.5/);
  assert.match(source, /truncate text-xl font-light capitalize/);
  assert.match(source, /future && <span className="shrink-0 whitespace-nowrap/);
  assert.doesNotMatch(source, /isPeak && <span className="rounded border/);
});

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
  for (const key of ["sortLabel", "chronological", "ascending", "descending", "yearLabel", "yearWithoutMovements", "loadingYears", "yearsError", "retryYears", "loadingYear"]) {
    assert.ok(spanish.Annual.movements[key] && english.Annual.movements[key]);
  }
});

test("sorting and colors stay local while account years are omitted from the demo", () => {
  const source = read("src/components/annual/year-movements-view.tsx");
  assert.match(source, /useState<MovementSort>\("chronological"\)/);
  assert.match(source, /sortMovementMonths\(summary.rows, order\)/);
  assert.match(source, /<span className="hidden sm:inline">\{t\(order\)\}<\/span>/);
  assert.match(source, /getMovementColorIntensity\(row, summary.rows\)/);
  assert.match(source, /color-mix\(in srgb/);
  assert.match(source, /dark:\[--movement-neutral:var\(--foreground\)\]/);
  assert.match(source, /years && years.length > 1 && <MovementsYearSelector/);
  assert.match(read("src/components/year/year-page-client.tsx"), /yearData=\{currentYearData\}\s+years=\{years\}/);
});

test("mobile controls retain accessible actions and translated compact sort values", () => {
  const source = read("src/components/annual/year-movements-view.tsx");
  assert.match(source, /role="group" aria-label=\{t\("controlsLabel"\)\}/);
  assert.match(source, /flex flex-nowrap items-center gap-1 sm:flex-wrap/);
  for (const action of ["expandAll", "collapseAll"]) {
    assert.match(source, new RegExp(`aria-label=\\{t\\("${action}"\\)\\} title=\\{t\\("${action}"\\)\\}`));
  }
  assert.match(source, /size-11 rounded-md px-0 sm:h-9 sm:w-auto/);
  assert.match(source, /min-\[360px\]:hidden/);
  assert.match(source, /t\(`shortSort\.\$\{order\}`\)/);
  assert.match(source, /t\(`compactSort\.\$\{order\}`\)/);
  assert.match(source, /w-max min-w-\(--anchor-width\) max-w-\(--available-width\)/);
  const selector = read("src/components/annual/movements-year-selector.tsx");
  assert.match(selector, /role="alert" className="sr-only/);
  assert.match(selector, /aria-label=\{t\("retryYears"\)\} aria-describedby=\{labelId\}/);
  assert.match(selector, /pointer-events-none absolute inset-0/);
  for (const locale of ["es", "en"]) {
    const messages = JSON.parse(read(`messages/${locale}.json`)).Annual.movements;
    assert.ok(messages.controlsLabel);
    for (const order of ["chronological", "ascending", "descending"]) {
      assert.ok(messages.compactSort[order] && messages.shortSort[order]);
    }
  }
});

test("year selection has cancellable fetching, retry and pending navigation feedback", () => {
  const source = read("src/components/annual/movements-year-selector.tsx");
  assert.match(source, /fetch\("\/api\/years\?withMovements=true"/);
  assert.match(source, /cache: "no-store"/);
  assert.match(source, /if \(!response.ok\) throw/);
  assert.match(source, /return \(\) => controller.abort\(\)/);
  assert.match(source, /if \(!controller.signal.aborted\) setState/);
  assert.match(source, /role="alert"/);
  assert.match(source, /setState\(\{ status: "loading" \}\); setAttempt/);
  assert.match(source, /if \(state.years.length < 2\) return null/);
  assert.match(source, /sort\(\(a, b\) => b - a\)/);
  assert.match(source, /aria-busy=\{pending\}/);
  assert.match(source, /disabled=\{pending\}/);
  assert.match(source, /startTransition\(\(\) => router.push\(buildYearMovementsHref/);
  assert.match(source, /<SelectItem value=\{String\(year\)\} disabled>/);
});

test("year eligibility uses entry existence and always scopes to the authenticated user", () => {
  const collection = read("src/app/api/years/route.ts");
  const get = collection.slice(collection.indexOf("export async function GET"), collection.indexOf("export async function POST"));
  assert.match(get, /if \(!user\?\.id\)[\s\S]*status: 401/);
  assert.match(get, /searchParams.get\("withMovements"\) === "true"/);
  assert.match(get, /withMovements \? exists\(/);
  assert.match(get, /eq\(additionalEntries.monthId, months.id\)/);
  assert.match(get, /eq\(months.yearId, years.id\)/);
  assert.match(get, /\.where\(and\(eq\(years.userId, user.id\), movementFilter\)\)/);
  assert.match(get, /select\(\{ year: years.year, id: years.id \}\)/);
  assert.doesNotMatch(get, /additionalEntries\.(?:amount|isCompleted|groupId)|historicalYears|sum\(/);
});
