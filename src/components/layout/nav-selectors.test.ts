import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("create year navigation derives its redirect from the current browser path", () => {
  const source = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(source, /buildSetupHrefFromPathname/);
  assert.match(source, /const pathname = usePathname\(\)/);
  assert.match(source, /const createYearHref = buildSetupHrefFromPathname\(nextCreatableYear, pathname/);
});

test("year selector marks the real current year when multiple years are available", () => {
  const source = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.match(source, /const calendarYear = new Date\(\)\.getFullYear\(\)/);
  assert.match(source, /const showCurrentYearMarker = yearOptions\.length > 1/);
  assert.match(source, /option\.year === calendarYear/);
  assert.match(source, /t\("currentYear"\)/);
  assert.equal(spanish.Nav.currentYear, "Actual");
  assert.equal(english.Nav.currentYear, "Current");
});

test("public hero exposes the A+B hybrid landing structure", () => {
  const source = readFileSync(new URL("../landing/public-hero.tsx", import.meta.url), "utf8");

  assert.match(source, /ANNUAL_BARS/);
  assert.match(source, /t\("annualStory\.title"\)/);
  assert.match(source, /t\("proof\.monthly\.title"\)/);
  assert.match(source, /t\("preview\.endingBalance"\)/);
});

test("landing messages include refined public copy", () => {
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.equal(spanish.Landing.heroTitle, "Planifica tu año financiero mes a mes.");
  assert.equal(english.Landing.heroTitle, "Plan your financial year month by month.");
  assert.equal(spanish.Landing.annualStory.extraPayMarker, "Pagas extra");
  assert.equal(english.Landing.annualStory.extraPayMarker, "Extra pay");
});

test("navigation keeps evolution tab enabled for single-year users", () => {
  const navSource = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(navSource, /buildEvolutionHref/);
  assert.match(navSource, /const evolutionHref = buildEvolutionHref/);
  assert.doesNotMatch(navSource, /disabled: evolutionYears\.length < 2/);
  assert.doesNotMatch(navSource, /evolutionUnavailable/);
});

test("navigation handles evolution active state and hides year selector", () => {
  const navSource = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(navSource, /view === "summary" \? "summary" : view === "evolution" \? "evolution"/);
  assert.match(navSource, /const showYearControls = !hideYearSelector && view !== "evolution"/);
});

test("evolution page loads sources and allows single-year access for historical imports", () => {
  const source = readFileSync(new URL("../../app/[locale]/evolution/page.tsx", import.meta.url), "utf8");

  assert.match(source, /const calendarYear = now\.getFullYear\(\)/);
  assert.match(source, /getEvolutionSourcesForUser\(user\.id\)/);
  assert.match(source, /getHistoricalYearsForUser\(user\.id\)/);
  assert.match(source, /deriveEvolutionMetrics/);
  assert.doesNotMatch(source, /metrics\.length < 2/);
  assert.doesNotMatch(source, /redirect\(/);
  assert.match(source, /view="evolution"/);
  assert.match(source, /calendarYear=\{calendarYear\}/);
});

test("navigation accepts sourced year options and disables full-year views for historical selections", () => {
  const source = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.match(source, /YearOption/);
  assert.match(source, /selectedYearOption\?\.source === "historical"/);
  assert.match(source, /historicalYearUnavailable/);
  assert.match(source, /getGridlyYears/);
  assert.equal(spanish.Nav.historicalYearUnavailable, "Disponible solo para años añadidos con seguimiento mensual en Gridly.");
  assert.equal(english.Nav.historicalYearUnavailable, "Available only for years added with monthly tracking in Gridly.");
});

test("all-year data loader can ignore future years", () => {
  const source = readFileSync(new URL("../../lib/server/year-data.ts", import.meta.url), "utf8");

  assert.match(source, /options: \{ maxYear\?: number \} = \{\}/);
  assert.match(source, /year <= options\.maxYear/);
});

test("feature docs include evolution dashboard documentation", () => {
  const agents = readFileSync(new URL("../../../AGENTS.md", import.meta.url), "utf8");
  const docs = readFileSync(new URL("../../../docs/features/evolution-dashboard.md", import.meta.url), "utf8");

  assert.match(agents, /docs\/features\/evolution-dashboard\.md/);
  assert.match(docs, /# Feature: Evolution Dashboard/);
  assert.match(docs, /Evolución/);
  assert.match(docs, /`savedAmount`: `finalBalance - startingBalance`/);
  assert.match(docs, /all eligible Evolution sources/);
});
