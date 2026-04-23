"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnualView } from "@/components/annual/annual-view";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import type { YearData } from "@/lib/types";

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

export function YearPageClient({
  yearData,
  initialMonth,
  initialView,
  years,
  startingBalanceEditable = false,
  user,
}: Props) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedView, setSelectedView] = useState<"overview" | "summary">(initialView);

  useEffect(() => {
    setSelectedMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    setSelectedView(initialView);
  }, [initialView]);

  useEffect(() => {
    function syncStateFromLocation() {
      const nextState = parseStateFromPathname(window.location.pathname);
      if (!nextState || nextState.year !== yearData.config.year) return;

      setSelectedView(nextState.view);
      if (nextState.month) {
        setSelectedMonth(nextState.month);
      }
    }

    window.addEventListener("popstate", syncStateFromLocation);
    return () => {
      window.removeEventListener("popstate", syncStateFromLocation);
    };
  }, [yearData.config.year]);

  const handleMonthSelect = useCallback((nextMonth: number) => {
    setSelectedMonth((currentMonth) => {
      if (selectedView === "overview" && currentMonth === nextMonth) return currentMonth;

      const nextPath =
        selectedView === "summary"
          ? window.location.pathname.replace(/\/summary$/, `/${nextMonth}`)
          : window.location.pathname.replace(/\/\d+$/, `/${nextMonth}`);

      window.history.pushState(null, "", nextPath);
      return nextMonth;
    });
    setSelectedView("overview");
  }, [selectedView]);

  const handleSummarySelect = useCallback(() => {
    if (selectedView === "summary") return;

    window.history.pushState(null, "", window.location.pathname.replace(/\/\d+$/, "/summary"));
    setSelectedView("summary");
  }, [selectedView]);

  return (
    <AppShell
      currentYear={yearData.config.year}
      currentMonth={selectedView === "overview" ? selectedMonth : null}
      view={selectedView}
      years={years}
      user={user}
      onMonthViewSelect={() => handleMonthSelect(selectedMonth)}
      onSummaryViewSelect={handleSummarySelect}
    >
      {selectedView === "summary" ? (
        <AnnualView yearData={yearData} startingBalanceEditable={startingBalanceEditable} />
      ) : (
        <MonthOverview
          yearData={yearData}
          monthNumber={selectedMonth}
          onMonthSelect={handleMonthSelect}
        />
      )}
    </AppShell>
  );
}
