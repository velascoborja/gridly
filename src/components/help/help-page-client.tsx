"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpFeatureRow } from "./help-feature-row";
import { cn } from "@/lib/utils";

type Tab = "months" | "year" | "evolution" | "settings";

export function HelpPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>("months");
  const t = useTranslations("Help");

  const tabs: { id: Tab; label: string }[] = [
    { id: "months", label: t("tabMonths") },
    { id: "year", label: t("tabYear") },
    { id: "evolution", label: t("tabEvolution") },
    { id: "settings", label: t("tabSettings") },
  ];

  const featuresByTab: Record<Tab, { title: string; summary: string; detail: string }[]> = {
    months: [
      { title: t("fixedTitle"), summary: t("fixedSummary"), detail: t("fixedDetail") },
      { title: t("extraPayTitle"), summary: t("extraPaySummary"), detail: t("extraPayDetail") },
      { title: t("interestTitle"), summary: t("interestSummary"), detail: t("interestDetail") },
      { title: t("recurringTitle"), summary: t("recurringSummary"), detail: t("recurringDetail") },
      { title: t("additionalTitle"), summary: t("additionalSummary"), detail: t("additionalDetail") },
      { title: t("groupsTitle"), summary: t("groupsSummary"), detail: t("groupsDetail") },
      { title: t("tagsTitle"), summary: t("tagsSummary"), detail: t("tagsDetail") },
      { title: t("navTitle"), summary: t("navSummary"), detail: t("navDetail") },
      { title: t("chainTitle"), summary: t("chainSummary"), detail: t("chainDetail") },
    ],
    year: [
      { title: t("annualSummaryTitle"), summary: t("annualSummarySummary"), detail: t("annualSummaryDetail") },
      { title: t("chartsTitle"), summary: t("chartsSummary"), detail: t("chartsDetail") },
      { title: t("avgEntriesTitle"), summary: t("avgEntriesSummary"), detail: t("avgEntriesDetail") },
      { title: t("exportTitle"), summary: t("exportSummary"), detail: t("exportDetail") },
    ],
    evolution: [
      { title: t("kpiTitle"), summary: t("kpiSummary"), detail: t("kpiDetail") },
      { title: t("trendChartsTitle"), summary: t("trendChartsSummary"), detail: t("trendChartsDetail") },
      { title: t("historicalTitle"), summary: t("historicalSummary"), detail: t("historicalDetail") },
      { title: t("tagAnalysisTitle"), summary: t("tagAnalysisSummary"), detail: t("tagAnalysisDetail") },
      { title: t("futureYearsTitle"), summary: t("futureYearsSummary"), detail: t("futureYearsDetail") },
      { title: t("portfolioTitle"), summary: t("portfolioSummary"), detail: t("portfolioDetail") },
    ],
    settings: [
      { title: t("yearConfigTitle"), summary: t("yearConfigSummary"), detail: t("yearConfigDetail") },
      { title: t("recurringTemplateTitle"), summary: t("recurringTemplateSummary"), detail: t("recurringTemplateDetail") },
      { title: t("tagMgmtTitle"), summary: t("tagMgmtSummary"), detail: t("tagMgmtDetail") },
      { title: t("languageTitle"), summary: t("languageSummary"), detail: t("languageDetail") },
      { title: t("shortcutsTitle"), summary: t("shortcutsSummary"), detail: t("shortcutsDetail") },
      { title: t("deleteTitle"), summary: t("deleteSummary"), detail: t("deleteDetail") },
    ],
  };

  const features = featuresByTab[activeTab];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <div role="tablist" className="flex gap-1 rounded-xl border border-border/50 bg-muted/40 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={tabs.find((t) => t.id === activeTab)?.label}
        className="space-y-2"
      >
        {features.map((feature) => (
          <HelpFeatureRow
            key={feature.title}
            title={feature.title}
            summary={feature.summary}
            detail={feature.detail}
          />
        ))}
      </div>
    </div>
  );
}
