import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual savings rate uses displayed savings and adjusted full-year income only on the savings metric", async () => {
  const source = await readSource("src/components/annual/kpi-cards.tsx");

  assert.match(source, /const totalIncome = months\.reduce\(\(sum, month\) => sum \+ month\.totalIncome, 0\)/);
  assert.match(source, /const adjustedTotalIncome = totalIncome \+ \(hasExpected \? expectedIncome : 0\)/);
  assert.match(source, /calculateSavingsRate\(displayedTotalSavings, adjustedTotalIncome\)/);
  assert.match(source, /label: t\("totalSavings"\),[\s\S]*?comparisonLines: savingsComparisonLines,\s+savingsRate,/);
  assert.equal((source.match(/^      savingsRate,/gm) ?? []).length, 1);
  assert.match(source, /metric\.savingsRate !== undefined/);
  assert.match(source, /metric\.savingsRate === null\s+\? t\("savingsRateUnavailable"\)\s+: formatSavingsRate\(metric\.savingsRate, locale\)/);
  assert.match(source, /t\(metric\.isEstimate \? "estimatedSavingsRate" : "savingsRate"\)/);
  assert.match(source, /getComparisonColorClassName\(metric\.savingsRate \?\? 0\)/);
  assert.doesNotMatch(source, /t\("activeMonths"/);
  assert.ok(source.indexOf('metric.savingsRate !== undefined') > source.indexOf('{metric.note}'));
  assert.ok(source.indexOf('metric.savingsRate !== undefined') < source.indexOf('{metric.comparison}'));
});

test("annual investment rate shares Evolution's calculation and follows the savings rate", async () => {
  const annual = await readSource("src/components/annual/kpi-cards.tsx");
  const evolution = await readSource("src/components/evolution/evolution-charts.tsx");

  for (const source of [annual, evolution]) {
    assert.match(source, /import \{ calculateInvestmentRate \} from "@\/lib\/annual-investment-rate"/);
  }
  assert.match(evolution, /investmentRate: calculateInvestmentRate\(metric\.investedAmount, metric\.totalIncome\)/);
  assert.match(annual, /const investmentRate = calculateInvestmentRate\(totalInvestment, adjustedTotalIncome\)/);
  assert.match(annual, /label: t\("totalSavings"\),[\s\S]*?savingsRate,\s+investmentRate,/);
  assert.equal((annual.match(/^      investmentRate,/gm) ?? []).length, 1);
  assert.ok(annual.indexOf('metric.investmentRate !== undefined') > annual.indexOf('metric.savingsRate !== undefined'));
  assert.ok(annual.indexOf('metric.investmentRate !== undefined') < annual.indexOf('{metric.comparison}'));
  assert.match(annual, /t\(metric\.isEstimate \? "estimatedInvestmentRate" : "investmentRate"\)/);
  assert.match(annual, /getComparisonColorClassName\(metric\.investmentRate \?\? 0\)/);
  assert.match(annual, /metric\.investmentRate === null\s+\? t\("investmentRateUnavailable"\)\s+: formatSavingsRate\(metric\.investmentRate, locale\)/);
});

test("annual rate labels and unavailable values are localized", async () => {
  const es = JSON.parse(await readSource("messages/es.json"));
  const en = JSON.parse(await readSource("messages/en.json"));

  assert.equal(es.Annual.kpis.savingsRate, "Tasa de ahorro:");
  assert.equal(es.Annual.kpis.estimatedSavingsRate, "Tasa de ahorro estimada:");
  assert.equal(en.Annual.kpis.savingsRate, "Savings rate:");
  assert.equal(en.Annual.kpis.estimatedSavingsRate, "Estimated savings rate:");
  assert.equal(es.Annual.kpis.savingsRateUnavailable, "—");
  assert.equal(en.Annual.kpis.savingsRateUnavailable, "—");
  assert.equal(es.Annual.kpis.investmentRate, "Tasa de inversión:");
  assert.equal(es.Annual.kpis.estimatedInvestmentRate, "Tasa de inversión estimada:");
  assert.equal(en.Annual.kpis.investmentRate, "Investment rate:");
  assert.equal(en.Annual.kpis.estimatedInvestmentRate, "Estimated investment rate:");
  assert.equal(es.Annual.kpis.investmentRateUnavailable, "—");
  assert.equal(en.Annual.kpis.investmentRateUnavailable, "—");
});

test("annual KPI cards include programmed and additional investments in totals and month counts", async () => {
  const source = await readSource("src/components/annual/kpi-cards.tsx");
  const primaryMetrics = source.match(/const primaryMetrics[^\n]*: KpiMetric\[\] = \[[\s\S]*?\n  \];/)?.[0] ?? "";
  const supportingMetrics = source.match(/const supportingMetrics[^\n]*: KpiMetric\[\] = \[[\s\S]*?\n  \];/)?.[0] ?? "";

  assert.match(
    source,
    /totalInvestment\s*=\s*months\.reduce\(\(sum,\s*month\)\s*=>\s*sum\s*\+\s*totalMonthlyInvestment\(month\),\s*0\)/,
    "total investment should use the shared monthly total",
  );
  assert.match(source, /months\.filter\(\(month\) => totalMonthlyInvestment\(month\) > 0\)/);
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
  assert.equal(es.Annual.kpis.totalInvestmentNote, "Inversiones mensuales y aportaciones adicionales");
  assert.equal(es.Annual.kpis.heroTitle, "Saldo final y ahorro acumulado");
  assert.match(es.Annual.kpis.investmentMonths, /mes(?:es)? con inversión/);

  assert.equal(en.Annual.kpis.totalInvestment, "Total invested");
  assert.equal(en.Annual.kpis.totalInvestmentNote, "Monthly investments and additional contributions");
  assert.equal(en.Annual.kpis.heroTitle, "Final balance and total savings");
  assert.match(en.Annual.kpis.investmentMonths, /month(?:s)? invested/);
});
