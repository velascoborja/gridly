import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("authenticated year routes use a client shell for in-year navigation", async () => {
  const pageSource = await readSource("src/app/[locale]/[year]/[month]/page.tsx");
  const summarySource = await readSource("src/app/[locale]/[year]/summary/page.tsx");
  const shellSource = await readSource("src/components/year/year-page-client.tsx");

  assert.match(pageSource, /YearPageClient/, "month page should delegate rendering to the shared client shell");
  assert.match(summarySource, /YearPageClient/, "summary page should delegate rendering to the shared client shell");
  assert.match(shellSource, /"use client"/, "year client shell must run on the client");
  assert.match(shellSource, /window\.history\.pushState/, "year client shell should update the URL without a full route navigation");
  assert.match(shellSource, /popstate/, "year client shell should stay in sync with browser back and forward");
  assert.match(shellSource, /AnnualView/, "year client shell should render annual summary locally");
  assert.match(shellSource, /MonthOverview/, "year client shell should render month overview locally");
});

test("authenticated year nav tabs cancel Next navigation when handled locally", async () => {
  const navSource = await readSource("src/components/layout/nav-selectors.tsx");

  assert.match(navSource, /onNavigate/, "nav selector tabs should use Next's client navigation hook");
  assert.match(navSource, /event\.preventDefault\(\)/, "local tab handlers should prevent the route navigation");
  assert.match(navSource, /tab\.key === "overview" \? onMonthViewSelect : onSummaryViewSelect/, "tabs should select the matching local handler");
  assert.match(navSource, /handler\(\)/, "local tab handler should run after navigation is cancelled");
});
