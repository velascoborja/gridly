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
