"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnualView } from "@/components/annual/annual-view";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import { SettingsForm } from "@/components/settings/settings-form";
import { usePathname } from "@/i18n/routing";
import type { YearData } from "@/lib/types";
import {
  type YearRouteView,
  parseYearRoutePathname,
  getYearRoutePrefix,
  buildYearMonthHref,
  buildYearSummaryHref,
  buildSettingsHref,
} from "@/lib/year-routes";

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

function getInitialStateFromPathname(
  pathname: string,
  currentYear: number,
  fallbackMonth: number,
  fallbackView: "overview" | "summary"
) {
  const pathnameState = parseYearRoutePathname(pathname);
  if (pathnameState && pathnameState.year === currentYear) {
    return {
      month: pathnameState.month ?? fallbackMonth,
      view: pathnameState.view,
    };
  }

  return {
    month: fallbackMonth,
    view: fallbackView,
  };
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
  const initialState = getInitialStateFromPathname(pathname, yearData.config.year, initialMonth, initialView);
  const [currentYearData, setCurrentYearData] = useState<YearData>(yearData);
  const [selectedMonth, setSelectedMonth] = useState(() => initialState.month);
  const [selectedView, setSelectedView] = useState<YearRouteView>(() => initialState.view);
  const routePrefix = getYearRoutePrefix(pathname, currentYearData.config.year);

  useEffect(() => {
    setCurrentYearData(yearData);
  }, [yearData]);

  useEffect(() => {
    function syncStateFromPathname(nextPathname: string) {
      const nextState = parseYearRoutePathname(nextPathname);
      if (!nextState) return;
      if (nextState.year !== null && nextState.year !== currentYearData.config.year) return;

      setSelectedView(nextState.view);
      if (nextState.month) {
        setSelectedMonth(nextState.month);
      }
    }

    syncStateFromPathname(pathname);

    function syncStateFromLocation() {
      syncStateFromPathname(window.location.pathname);
    }

    window.addEventListener("popstate", syncStateFromLocation);
    return () => {
      window.removeEventListener("popstate", syncStateFromLocation);
    };
  }, [currentYearData.config.year, pathname]);

  const handleMonthSelect = useCallback((nextMonth: number) => {
    if (selectedView === "overview" && selectedMonth === nextMonth) return;

    setSelectedMonth(nextMonth);
    setSelectedView("overview");
    window.history.pushState(null, "", buildYearMonthHref(routePrefix, currentYearData.config.year, nextMonth));
  }, [currentYearData.config.year, routePrefix, selectedMonth, selectedView]);

  const handleSummarySelect = useCallback(() => {
    if (selectedView === "summary") return;

    setSelectedView("summary");
    window.history.pushState(null, "", buildYearSummaryHref(routePrefix, currentYearData.config.year));
  }, [currentYearData.config.year, routePrefix, selectedView]);

  const handleSettingsSelect = useCallback(() => {
    if (selectedView === "settings") return;

    setSelectedView("settings");
    window.history.pushState(null, "", buildSettingsHref(routePrefix));
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
