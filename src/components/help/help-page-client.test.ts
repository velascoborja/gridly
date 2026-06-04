import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const esMessages = JSON.parse(
  readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8")
);
const enMessages = JSON.parse(
  readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8")
);

test("Help namespace exists in both locales", () => {
  assert.ok(esMessages.Help, "es.json missing Help namespace");
  assert.ok(enMessages.Help, "en.json missing Help namespace");
});

test("Help namespace has all required keys", () => {
  const requiredKeys = [
    "pageTitle", "pageSubtitle", "expandLabel", "collapseLabel",
    "cardTitle", "cardDescription", "cardButton",
    "tabMonths", "tabYear", "tabEvolution", "tabSettings",
    "fixedTitle", "fixedSummary", "fixedDetail",
    "extraPayTitle", "extraPaySummary", "extraPayDetail",
    "interestTitle", "interestSummary", "interestDetail",
    "recurringTitle", "recurringSummary", "recurringDetail",
    "additionalTitle", "additionalSummary", "additionalDetail",
    "groupsTitle", "groupsSummary", "groupsDetail",
    "tagsTitle", "tagsSummary", "tagsDetail",
    "navTitle", "navSummary", "navDetail",
    "chainTitle", "chainSummary", "chainDetail",
    "annualSummaryTitle", "annualSummarySummary", "annualSummaryDetail",
    "chartsTitle", "chartsSummary", "chartsDetail",
    "avgEntriesTitle", "avgEntriesSummary", "avgEntriesDetail",
    "exportTitle", "exportSummary", "exportDetail",
    "kpiTitle", "kpiSummary", "kpiDetail",
    "trendChartsTitle", "trendChartsSummary", "trendChartsDetail",
    "historicalTitle", "historicalSummary", "historicalDetail",
    "tagAnalysisTitle", "tagAnalysisSummary", "tagAnalysisDetail",
    "futureYearsTitle", "futureYearsSummary", "futureYearsDetail",
    "portfolioTitle", "portfolioSummary", "portfolioDetail",
    "yearConfigTitle", "yearConfigSummary", "yearConfigDetail",
    "recurringTemplateTitle", "recurringTemplateSummary", "recurringTemplateDetail",
    "tagMgmtTitle", "tagMgmtSummary", "tagMgmtDetail",
    "languageTitle", "languageSummary", "languageDetail",
    "shortcutsTitle", "shortcutsSummary", "shortcutsDetail",
    "deleteTitle", "deleteSummary", "deleteDetail",
  ];

  for (const key of requiredKeys) {
    assert.ok(esMessages.Help[key], `es.json Help.${key} missing`);
    assert.ok(enMessages.Help[key], `en.json Help.${key} missing`);
  }
});
