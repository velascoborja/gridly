import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("nav selectors support demo-aware path prefixes and create-year suppression", async () => {
  const source = await readSource("src/components/layout/nav-selectors.tsx");

  assert.match(source, /monthPathPrefix\?: string/, "nav selectors should accept an optional month path prefix");
  assert.match(source, /summaryPathPrefix\?: string/, "nav selectors should accept an optional summary path prefix");
  assert.match(source, /hideCreateYear\?: boolean/, "nav selectors should allow hiding the create-year affordance");
  assert.match(source, /const monthHref = .*monthPathPrefix/s, "nav selectors should derive month hrefs from the optional prefix");
  assert.match(source, /const summaryHref = .*summaryPathPrefix/s, "nav selectors should derive summary hrefs from the optional prefix");
  assert.match(source, /!hideCreateYear && \(/, "create-year affordance should be conditional");
});

test("demo month and summary pages wire shared navigation to demo routes", async () => {
  const monthSource = await readSource("src/app/[locale]/demo/[year]/[month]/page.tsx");
  const summarySource = await readSource("src/app/[locale]/demo/[year]/summary/page.tsx");

  assert.match(monthSource, /NavSelectors/, "demo month page should render the shared nav selectors");
  assert.match(monthSource, /monthPathPrefix="\/demo"/, "demo month page should keep month navigation in the demo namespace");
  assert.match(monthSource, /summaryPathPrefix="\/demo"/, "demo month page should keep summary navigation in the demo namespace");
  assert.match(monthSource, /hideCreateYear/, "demo month page should hide the create-year affordance");

  assert.match(summarySource, /NavSelectors/, "demo summary page should render the shared nav selectors");
  assert.match(summarySource, /monthPathPrefix="\/demo"/, "demo summary page should keep month navigation in the demo namespace");
  assert.match(summarySource, /summaryPathPrefix="\/demo"/, "demo summary page should keep summary navigation in the demo namespace");
  assert.match(summarySource, /hideCreateYear/, "demo summary page should hide the create-year affordance");
});
