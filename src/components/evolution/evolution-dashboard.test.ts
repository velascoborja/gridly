import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("evolution dashboard composes KPI cards, charts, and detail table", () => {
  const source = readFileSync(new URL("./evolution-dashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /EvolutionDashboard/);
  assert.match(source, /EvolutionKpiCards/);
  assert.match(source, /EvolutionCharts/);
  assert.match(source, /EvolutionDetailTable/);
  assert.match(source, /summarizeEvolutionMetrics/);
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
