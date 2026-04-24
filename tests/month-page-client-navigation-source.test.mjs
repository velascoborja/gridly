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

test("settings can be rendered inside the authenticated year client shell", async () => {
  const shellSource = await readSource("src/components/year/year-page-client.tsx");
  const appShellSource = await readSource("src/components/layout/app-shell.tsx");
  const userMenuSource = await readSource("src/components/auth/user-menu.tsx");

  assert.match(shellSource, /SettingsForm/, "year client shell should render settings locally");
  assert.match(shellSource, /"settings"/, "year client shell should track settings as a local view");
  assert.match(shellSource, /onSettingsSelect=\{handleSettingsSelect\}/, "year client shell should wire a local settings handler");
  assert.match(shellSource, /\/settings\$/, "year client shell should sync browser back/forward for settings");
  assert.match(appShellSource, /onSettingsSelect\?: \(\) => void/, "app shell should accept a local settings handler");
  assert.match(appShellSource, /<UserMenu[\s\S]*onSettingsSelect=\{onSettingsSelect\}/, "app shell should pass settings handling into the user menu");
  assert.match(userMenuSource, /onNavigate=\{handleSettingsNavigate\}/, "settings links should use Next's navigation hook");
  assert.match(userMenuSource, /event\.preventDefault\(\)/, "settings links should cancel route navigation when handled locally");
});

test("monthly edits update the shared year data used by the annual summary", async () => {
  const shellSource = await readSource("src/components/year/year-page-client.tsx");
  const monthSource = await readSource("src/components/monthly/month-overview.tsx");

  assert.match(shellSource, /useState<YearData>\(yearData\)/, "year client shell should own mutable year data");
  assert.match(shellSource, /setCurrentYearData\(yearData\)/, "year client shell should resync when server year data changes");
  assert.match(shellSource, /<AnnualView[\s\S]*yearData=\{currentYearData\}/, "annual summary should read the shared mutable year data");
  assert.match(shellSource, /<MonthOverview[\s\S]*yearData=\{currentYearData\}[\s\S]*onYearDataChange=\{setCurrentYearData\}/, "month overview should publish edits to the shared year data");
  assert.match(monthSource, /onYearDataChange\?: \(yearData: YearData\) => void/, "month overview should expose a shared year data change callback");
  assert.match(monthSource, /onYearDataChange\(\{[\s\S]*config,[\s\S]*months: recomputedMonths,[\s\S]*\}\)/, "month overview should send recomputed months back to the shell");
});
