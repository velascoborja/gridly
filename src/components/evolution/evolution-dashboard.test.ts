import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("evolution dashboard composes KPI cards, charts, and detail table", () => {
  const source = readFileSync(new URL("./evolution-dashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /EvolutionKpiCards/);
  assert.match(source, /EvolutionCharts/);
  assert.match(source, /EvolutionDetailTable/);
  assert.match(source, /summarizeEvolutionMetrics/);
});

test("evolution loading state keeps the app shell and mirrors dashboard sections", () => {
  const source = readFileSync(new URL("../../app/[locale]/evolution/loading.tsx", import.meta.url), "utf8");

  assert.match(source, /BaseAppShell/);
  assert.match(source, /aria-busy="true"/);
  assert.match(source, /surface-depth-floating/);
  assert.match(source, /xl:grid-cols-5/);
  assert.match(source, /md:grid-cols-2/);
  assert.match(source, /min-w-\[860px\]/);
});

test("evolution charts include final balance, savings, and investment series", () => {
  const source = readFileSync(new URL("./evolution-charts.tsx", import.meta.url), "utf8");

  assert.match(source, /LineChart/);
  assert.match(source, /BarChart/);
  assert.match(source, /dataKey="finalBalance"/);
  assert.match(source, /dataKey="savedAmount"/);
  assert.match(source, /dataKey="investedAmount"/);
});

test("evolution detail table renders savings rate with neutral fallback", () => {
  const source = readFileSync(new URL("./evolution-detail-table.tsx", import.meta.url), "utf8");

  assert.match(source, /formatPercent/);
  assert.match(source, /metric\.savingsRate === null \? t\("notAvailable"\)/);
  assert.match(source, /accumulatedInvested/);
});

test("evolution dashboard exposes historical year create dialog and passes row actions to the detail table", () => {
  const dashboard = readFileSync(new URL("./evolution-dashboard.tsx", import.meta.url), "utf8");
  const table = readFileSync(new URL("./evolution-detail-table.tsx", import.meta.url), "utf8");
  const dialog = readFileSync(new URL("./historical-year-dialog.tsx", import.meta.url), "utf8");

  assert.match(dashboard, /HistoricalYearDialog/);
  assert.match(dashboard, /t\("addHistoricalYear"\)/);
  assert.match(table, /metric\.source === "historical"/);
  assert.match(table, /onEditHistoricalYear/);
  assert.match(table, /deleteHistoricalYear/);
  assert.match(dialog, /parseLocalizedNumber/);
  assert.match(dialog, /sanitizeNumericInput/);
  assert.match(dialog, /router\.refresh\(\)/);
});

test("evolution messages include historical year import copy in both locales", () => {
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.equal(spanish.Evolution.addHistoricalYear, "Añadir año histórico");
  assert.equal(english.Evolution.addHistoricalYear, "Add historical year");
  assert.equal(spanish.Evolution.source.historical, "Histórico");
  assert.equal(english.Evolution.source.historical, "Historical");
});

test("historical year delete uses confirmation copy and refreshes after delete", () => {
  const table = readFileSync(new URL("./evolution-detail-table.tsx", import.meta.url), "utf8");
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.match(table, /AlertDialog/);
  assert.match(table, /DELETE/);
  assert.match(table, /router\.refresh\(\)/);
  assert.equal(spanish.Evolution.deleteHistoricalYear.title, "¿Eliminar año histórico?");
  assert.equal(english.Evolution.deleteHistoricalYear.title, "Delete historical year?");
});

test("evolution dashboard shows an empty state while historical imports are needed", () => {
  const dashboard = readFileSync(new URL("./evolution-dashboard.tsx", import.meta.url), "utf8");
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.match(dashboard, /const showEmptyState = metrics\.length < 2/);
  assert.match(dashboard, /emptyState/);
  assert.match(dashboard, /setDialogOpen\(true\)/);
  assert.equal(spanish.Evolution.emptyState.title, "Añade años históricos para comparar");
  assert.equal(english.Evolution.emptyState.title, "Add historical years to compare");
});

test("historical year dialog uses compact form spacing", () => {
  const dialog = readFileSync(new URL("./historical-year-dialog.tsx", import.meta.url), "utf8");

  assert.match(dialog, /DialogContent className="gap-5 p-5 sm:max-w-md sm:p-6"/);
  assert.match(dialog, /className="space-y-3"/);
  assert.match(dialog, /className="h-9"/);
  assert.match(dialog, /DialogFooter className="-mx-5 -mb-5 px-5 py-3 sm:-mx-6 sm:-mb-6 sm:px-6"/);
});

test("historical year dialog money inputs show a persistent Euro hint", () => {
  const dialog = readFileSync(new URL("./historical-year-dialog.tsx", import.meta.url), "utf8");

  assert.match(dialog, /function MoneyInput/);
  assert.match(dialog, /aria-hidden="true"/);
  assert.match(dialog, />\s*€\s*</);
  assert.match(dialog, /placeholder\s*=\s*["']0\.00["']/);
  assert.match(dialog, /text-muted-foreground\/70/);
  assert.doesNotMatch(dialog, /opacity-0/);
  assert.match(dialog, /pr-8/);
});
