import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual KPI cards expose total investment from monthly investment values", async () => {
  const source = await readSource("src/components/annual/kpi-cards.tsx");
  const primaryMetrics = source.match(/const primaryMetrics[^\n]*= \[[\s\S]*?\n  \];/)?.[0] ?? "";
  const supportingMetrics = source.match(/const supportingMetrics[^\n]*= \[[\s\S]*?\n  \];/)?.[0] ?? "";

  assert.match(
    source,
    /totalInvestment\s*=\s*months\.reduce\(\(sum,\s*month\)\s*=>\s*sum\s*\+\s*month\.investment,\s*0\)/,
    "total investment should be derived from actual monthly investment values",
  );
  assert.match(source, /t\("totalInvestment"\)/, "component should render the total investment label");
  assert.match(source, /t\("totalInvestmentNote"\)/, "component should render the total investment note");
  assert.match(source, /t\("investmentMonths"/, "component should render the investment-month count");
  assert.match(primaryMetrics, /t\("totalInvestment"\)/, "investment should be a primary annual KPI");
  assert.doesNotMatch(supportingMetrics, /t\("totalInvestment"\)/, "investment should not be a supporting card");
  assert.match(source, /md:grid-cols-3/, "primary annual KPIs should render as three equal columns");
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
  assert.equal(es.Annual.kpis.heroTitle, "Saldo, ahorro e inversión");
  assert.match(es.Annual.kpis.investmentMonths, /mes(?:es)? con inversión/);

  assert.equal(en.Annual.kpis.totalInvestment, "Total invested");
  assert.equal(en.Annual.kpis.totalInvestmentNote, "Sum of monthly investments");
  assert.equal(en.Annual.kpis.heroTitle, "Balance, savings, and investments");
  assert.match(en.Annual.kpis.investmentMonths, /month(?:s)? invested/);
});
