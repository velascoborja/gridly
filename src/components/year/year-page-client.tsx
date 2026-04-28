"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnualView } from "@/components/annual/annual-view";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import { SettingsForm } from "@/components/settings/settings-form";
import { usePathname } from "@/i18n/routing";
import type { YearData } from "@/lib/types";

type YearClientView = "overview" | "summary" | "settings";

interface Props {
  yearData: YearData;
  initialMonth: number;
  initialView: "overview" | "summary";
  years: number[];
  startingBalanceEditable?: boolean;
  user: {
    email?: string | null;
    name?: string | null;
  };
}

function parseStateFromPathname(pathname: string) {
  if (pathname.match(/\/settings$/)) {
    return {
      year: null,
      view: "settings" as const,
      month: null,
    };
  }

  const summaryMatch = pathname.match(/\/(\d+)\/summary$/);
  if (summaryMatch) {
    return {
      year: Number.parseInt(summaryMatch[1], 10),
      view: "summary" as const,
      month: null,
    };
  }

  const monthMatch = pathname.match(/\/(\d+)\/(\d+)$/);
  if (monthMatch) {
    return {
      year: Number.parseInt(monthMatch[1], 10),
      view: "overview" as const,
      month: Number.parseInt(monthMatch[2], 10),
    };
  }

  return null;
}

function getRoutePrefix(pathname: string, year: number) {
  const yearMatch = pathname.match(new RegExp(`^(.*)/${year}/(?:summary|\\d+)$`));
  if (yearMatch) return yearMatch[1];

  const settingsMatch = pathname.match(/^(.*)\/settings$/);
  if (settingsMatch) return settingsMatch[1];

  return "";
}

function buildYearRoute(prefix: string, year: number, segment: string) {
  return `${prefix}/${year}/${segment}`;
}

function buildSettingsRoute(prefix: string) {
  return `${prefix}/settings`;
}

export function YearPageClient({
  yearData,
  initialMonth,
  initialView,
  years,
  startingBalanceEditable = false,
  user,
}: Props) {
  const pathname = usePathname();
  const [currentYearData, setCurrentYearData] = useState<YearData>(yearData);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedView, setSelectedView] = useState<YearClientView>(initialView);
  const routePrefix = getRoutePrefix(pathname, currentYearData.config.year);

  useEffect(() => {
    setCurrentYearData(yearData);
  }, [yearData]);

  useEffect(() => {
    setSelectedMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    setSelectedView(initialView);
  }, [initialView]);

  useEffect(() => {
    function syncStateFromLocation() {
      const nextState = parseStateFromPathname(window.location.pathname);
      if (!nextState) return;
      if (nextState.year !== null && nextState.year !== currentYearData.config.year) return;

      setSelectedView(nextState.view);
      if (nextState.month) {
        setSelectedMonth(nextState.month);
      }
    }

    window.addEventListener("popstate", syncStateFromLocation);
    return () => {
      window.removeEventListener("popstate", syncStateFromLocation);
    };
  }, [currentYearData.config.year]);

  const handleMonthSelect = useCallback((nextMonth: number) => {
    if (selectedView === "overview" && selectedMonth === nextMonth) return;

    setSelectedMonth(nextMonth);
    setSelectedView("overview");
    window.history.pushState(null, "", buildYearRoute(routePrefix, currentYearData.config.year, String(nextMonth)));
  }, [currentYearData.config.year, routePrefix, selectedMonth, selectedView]);

  const handleSummarySelect = useCallback(() => {
    if (selectedView === "summary") return;

    setSelectedView("summary");
    window.history.pushState(null, "", buildYearRoute(routePrefix, currentYearData.config.year, "summary"));
  }, [currentYearData.config.year, routePrefix, selectedView]);

  const handleSettingsSelect = useCallback(() => {
    if (selectedView === "settings") return;

    setSelectedView("settings");
    window.history.pushState(null, "", buildSettingsRoute(routePrefix));
  }, [routePrefix, selectedView]);

  return (
    <AppShell
      currentYear={currentYearData.config.year}
      currentMonth={selectedMonth}
      view={selectedView}
      years={years}
      user={user}
      onMonthViewSelect={() => handleMonthSelect(selectedMonth)}
      onSummaryViewSelect={handleSummarySelect}
      onSettingsSelect={handleSettingsSelect}
    >
      {selectedView === "settings" ? (
        <div className="mx-auto max-w-4xl py-6">
          <SettingsForm />
        </div>
      ) : selectedView === "summary" ? (
        <AnnualView
          yearData={currentYearData}
          startingBalanceEditable={startingBalanceEditable}
          onYearDataChange={setCurrentYearData}
        />
      ) : (
        <MonthOverview
          yearData={currentYearData}
          monthNumber={selectedMonth}
          onMonthSelect={handleMonthSelect}
          onYearDataChange={setCurrentYearData}
        />
      )}
    </AppShell>
  );
}
