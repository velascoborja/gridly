"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnnualView } from "@/components/annual/annual-view";
import { CategoriesView } from "@/components/annual/categories-view";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import { SearchPalette } from "@/components/search/search-palette";
import { SettingsForm } from "@/components/settings/settings-form";
import { usePathname } from "@/i18n/routing";
import type { YearData } from "@/lib/types";
import type { SearchEntry } from "@/lib/search-index";
import {
  type YearRouteView,
  parseYearRoutePathname,
  getYearRoutePrefix,
  buildYearMonthHref,
  buildYearSummaryHref,
  buildYearCategoriesHref,
  buildSettingsHref,
} from "@/lib/year-routes";

interface Props {
  yearData: YearData;
  initialMonth: number;
  initialView: "overview" | "summary" | "categories";
  years: number[];
  startingBalanceEditable?: boolean;
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

function getInitialStateFromPathname(
  pathname: string,
  currentYear: number,
  fallbackMonth: number,
  fallbackView: "overview" | "summary" | "categories"
): { month: number; view: YearRouteView } {
  const pathnameState = parseYearRoutePathname(pathname);
  if (pathnameState?.view === "evolution") {
    return {
      month: fallbackMonth,
      view: fallbackView,
    };
  }

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleFixedRef = useRef<(() => void) | null>(null);
  const openAddExpenseFormRef = useRef<(() => void) | null>(null);
  const openAddIncomeFormRef = useRef<(() => void) | null>(null);
  const openAddGroupFormRef = useRef<(() => void) | null>(null);
  const toggleAllGroupsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setCurrentYearData(yearData);
  }, [yearData]);

  useEffect(() => {
    function syncStateFromPathname(nextPathname: string) {
      const nextState = parseYearRoutePathname(nextPathname);
      if (!nextState) return;
      if (nextState.view === "evolution") return;
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

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const handleMonthSelect = useCallback((nextMonth: number) => {
    if (highlightTimerRef.current !== null) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    setHighlightId(null);

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

  const handleCategoriesSelect = useCallback(() => {
    if (selectedView === "categories") return;

    setSelectedView("categories");
    window.history.pushState(null, "", buildYearCategoriesHref(routePrefix, currentYearData.config.year));
  }, [currentYearData.config.year, routePrefix, selectedView]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isTyping =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable);
      if (isTyping) return;

      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      if (e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      if (!e.shiftKey && e.key.toLowerCase() === "b") {
        const today = new Date();
        if (currentYearData.config.year === today.getFullYear()) {
          e.preventDefault();
          handleMonthSelect(today.getMonth() + 1);
        }
        return;
      }

      if (selectedView !== "overview") return;

      if (e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const months = currentYearData.months.map((m) => m.month).sort((a, b) => a - b);
        const idx = months.indexOf(selectedMonth);
        if (idx > 0) handleMonthSelect(months[idx - 1]);
        return;
      }
      if (e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        const months = currentYearData.months.map((m) => m.month).sort((a, b) => a - b);
        const idx = months.indexOf(selectedMonth);
        if (idx >= 0 && idx < months.length - 1) handleMonthSelect(months[idx + 1]);
        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        openAddExpenseFormRef.current?.();
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        openAddIncomeFormRef.current?.();
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        openAddGroupFormRef.current?.();
        return;
      }

      if (e.shiftKey && (e.key === ">" || e.key === ".")) {
        e.preventDefault();
        toggleAllGroupsRef.current?.();
        return;
      }

      if (!e.shiftKey && e.key === ".") {
        e.preventDefault();
        toggleFixedRef.current?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMonth, selectedView, currentYearData, handleMonthSelect]);

  const handleSettingsSelect = useCallback(() => {
    if (selectedView === "settings") return;

    setSelectedView("settings");
    window.history.pushState(null, "", buildSettingsHref(routePrefix));
  }, [routePrefix, selectedView]);

  const handleSearchSelect = useCallback(
    (entry: SearchEntry) => {
      setSelectedMonth(entry.month);
      setSelectedView("overview");
      window.history.pushState(null, "", buildYearMonthHref(routePrefix, currentYearData.config.year, entry.month));

      if (highlightTimerRef.current !== null) {
        clearTimeout(highlightTimerRef.current);
      }
      setHighlightId(entry.id);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightId(null);
        highlightTimerRef.current = null;
      }, 3500);
    },
    [currentYearData.config.year, routePrefix]
  );

  return (
    <AppShell
      currentYear={currentYearData.config.year}
      currentMonth={selectedMonth}
      view={selectedView}
      years={years}
      user={user}
      onMonthViewSelect={() => handleMonthSelect(selectedMonth)}
      onSummaryViewSelect={handleSummarySelect}
      onCategoriesViewSelect={handleCategoriesSelect}
      onSettingsSelect={handleSettingsSelect}
      onSearchOpen={() => setSearchOpen(true)}
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
      ) : selectedView === "categories" ? (
        <CategoriesView yearData={currentYearData} />
      ) : (
        <MonthOverview
          yearData={currentYearData}
          monthNumber={selectedMonth}
          onMonthSelect={handleMonthSelect}
          onYearDataChange={setCurrentYearData}
          highlightId={highlightId}
          toggleFixedEditorsRef={toggleFixedRef}
          openAddExpenseFormRef={openAddExpenseFormRef}
          openAddIncomeFormRef={openAddIncomeFormRef}
          openAddGroupFormRef={openAddGroupFormRef}
          toggleAllGroupsRef={toggleAllGroupsRef}
        />
      )}
      <SearchPalette
        yearData={currentYearData}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
    </AppShell>
  );
}
