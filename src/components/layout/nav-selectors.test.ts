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
  assert.match(source, /const showCurrentYearMarker = years\.length > 1/);
  assert.match(source, /y === calendarYear/);
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

test("navigation includes evolution tab with disabled state for single-year users", () => {
  const navSource = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(navSource, /buildEvolutionHref/);
  assert.match(navSource, /const evolutionHref = buildEvolutionHref/);
  assert.match(navSource, /disabled: years\.length < 2/);
  assert.match(navSource, /title=\{t\("evolutionUnavailable"\)\}/);
});

test("navigation handles evolution active state and hides year selector", () => {
  const navSource = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(navSource, /view === "summary" \? "summary" : view === "evolution" \? "evolution"/);
  assert.match(navSource, /const showYearControls = !hideYearSelector && view !== "evolution"/);
});

test("evolution page loads all years and guards direct one-year access", () => {
  const source = readFileSync(new URL("../../app/[locale]/evolution/page.tsx", import.meta.url), "utf8");

  assert.match(source, /getAllYearDataForUser/);
  assert.match(source, /deriveEvolutionMetrics/);
  assert.match(source, /metrics\.length < 2/);
  assert.match(source, /const \{ locale \} = await params/);
  assert.match(source, /redirect\(\{ href: await getAppRedirectPath/);
  assert.match(source, /view="evolution"/);
  assert.match(source, /<EvolutionDashboard metrics=\{metrics\} \/>/);
});
