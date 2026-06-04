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

test("HelpPageClient source has client directive, four tabs, and all feature keys", () => {
  const source = readFileSync(
    new URL("./help-page-client.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /"use client"/);
  assert.match(source, /useTranslations\("Help"\)/);
  assert.match(source, /HelpFeatureRow/);

  // Tabs
  assert.match(source, /tabMonths/);
  assert.match(source, /tabYear/);
  assert.match(source, /tabEvolution/);
  assert.match(source, /tabSettings/);

  // Months features
  assert.match(source, /fixedTitle/);
  assert.match(source, /extraPayTitle/);
  assert.match(source, /interestTitle/);
  assert.match(source, /recurringTitle/);
  assert.match(source, /additionalTitle/);
  assert.match(source, /groupsTitle/);
  assert.match(source, /tagsTitle/);
  assert.match(source, /navTitle/);
  assert.match(source, /chainTitle/);

  // Year features
  assert.match(source, /annualSummaryTitle/);
  assert.match(source, /chartsTitle/);
  assert.match(source, /avgEntriesTitle/);
  assert.match(source, /exportTitle/);

  // Evolution features
  assert.match(source, /kpiTitle/);
  assert.match(source, /trendChartsTitle/);
  assert.match(source, /historicalTitle/);
  assert.match(source, /tagAnalysisTitle/);
  assert.match(source, /futureYearsTitle/);
  assert.match(source, /portfolioTitle/);

  // Settings features
  assert.match(source, /yearConfigTitle/);
  assert.match(source, /recurringTemplateTitle/);
  assert.match(source, /tagMgmtTitle/);
  assert.match(source, /languageTitle/);
  assert.match(source, /shortcutsTitle/);
  assert.match(source, /deleteTitle/);
});
