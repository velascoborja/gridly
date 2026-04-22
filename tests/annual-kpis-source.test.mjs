import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual KPI cards expose total investment from monthly investment values", async () => {
  const source = await readSource("src/components/annual/kpi-cards.tsx");
  const primaryMetrics = source.match(/const primaryMetrics[^\n]*: KpiMetric\[\] = \[[\s\S]*?\n  \];/)?.[0] ?? "";
  const supportingMetrics = source.match(/const supportingMetrics[^\n]*: KpiMetric\[\] = \[[\s\S]*?\n  \];/)?.[0] ?? "";

  assert.match(
    source,
    /totalInvestment\s*=\s*months\.reduce\(\(sum,\s*month\)\s*=>\s*sum\s*\+\s*month\.investment,\s*0\)/,
    "total investment should be derived from actual monthly investment values",
  );
  assert.match(source, /t\("totalInvestment"\)/, "component should render the total investment label");
  assert.match(source, /t\("totalInvestmentNote"\)/, "component should render the total investment note");
  assert.doesNotMatch(primaryMetrics, /t\("totalInvestment"\)/, "investment should not be a primary annual KPI");
  assert.match(supportingMetrics, /t\("totalInvestment"\)/, "investment should be a supporting card");
  assert.match(source, /md:grid-cols-2/, "primary annual KPIs should render as two equal columns");
  assert.doesNotMatch(
    source,
    /getMetricTone\(totalInvestment/,
    "investment should use a fixed neutral/brand tone, not positive/negative trend coloring",
  );
});

test("annual KPI investment labels are localized", async () => {
  const es = JSON.parse(await readSource("messages/es.json"));
  const en = JSON.parse(await readSource("messages/en.json"));

  assert.equal(es.Annual.kpis.totalInvestment, "Inversión total");
  assert.equal(es.Annual.kpis.totalInvestmentNote, "Suma de las inversiones mensuales");
  assert.equal(es.Annual.kpis.heroTitle, "Saldo final y ahorro acumulado");
  assert.match(es.Annual.kpis.investmentMonths, /mes(?:es)? con inversión/);

  assert.equal(en.Annual.kpis.totalInvestment, "Total invested");
  assert.equal(en.Annual.kpis.totalInvestmentNote, "Sum of monthly investments");
  assert.equal(en.Annual.kpis.heroTitle, "Final balance and total savings");
  assert.match(en.Annual.kpis.investmentMonths, /month(?:s)? invested/);
});
