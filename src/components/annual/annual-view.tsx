"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { applyYearConfigToMonth, computeMonthChain } from "@/lib/calculations";
import { KpiCards } from "./kpi-cards";
import { BalanceChart } from "./balance-chart";
import { SavingsChart } from "./savings-chart";
import { AdditionalEntriesAverages } from "./additional-entries-averages";
import type { YearData, YearConfig } from "@/lib/types";
import type { AnnualKpiComparisonData } from "@/lib/annual-comparisons";
import type { ExpectedEntry } from "./expected-entries-dialog";

interface Props {
  yearData: YearData;
  annualComparison?: AnnualKpiComparisonData;
  startingBalanceEditable: boolean;
  readOnly?: boolean;
  onYearDataChange?: (yearData: YearData) => void;
}

export function AnnualView({
  yearData: initial,
  annualComparison,
  startingBalanceEditable,
  readOnly = false,
  onYearDataChange,
}: Props) {
  const t = useTranslations("Annual");
  const [config, setConfig] = useState<YearConfig>(initial.config);
  const [monthRows, setMonthRows] = useState(initial.months);
  const [recurringExpenses, setRecurringExpenses] = useState(initial.recurringExpenses);
  const [savingConfig, setSavingConfig] = useState(false);
  const EXPECTED_STORAGE_KEY = `expected_entries_${initial.config.year}`;
  const [expectedEntries, setExpectedEntries] = useState<ExpectedEntry[]>([]);
  const pendingSaveCountRef = useRef(0);
  const pendingSavesRef = useRef(new Set<Promise<void>>());
  const months = computeMonthChain(monthRows, config.startingBalance, config.interestRate);
  const expectedIncome = expectedEntries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const expectedExpenses = expectedEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    setConfig(initial.config);
    setMonthRows(initial.months);
    setRecurringExpenses(initial.recurringExpenses);
  }, [initial]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EXPECTED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ExpectedEntry[];
        if (Array.isArray(parsed)) setExpectedEntries(parsed);
      }
    } catch {
      // ignore malformed storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddExpectedEntry = (entry: Omit<ExpectedEntry, "id">) => {
    const next = [...expectedEntries, { ...entry, id: crypto.randomUUID() }];
    setExpectedEntries(next);
    localStorage.setItem(EXPECTED_STORAGE_KEY, JSON.stringify(next));
  };

  const handleDeleteExpectedEntry = (id: string) => {
    const next = expectedEntries.filter((e) => e.id !== id);
    setExpectedEntries(next);
    localStorage.setItem(EXPECTED_STORAGE_KEY, JSON.stringify(next));
  };

  const applyConfigToMonths = (nextConfig: YearConfig, applyFromMonth: number) => {
    setMonthRows((current) => {
      const updatedRows = current.map((month) => applyYearConfigToMonth(month, nextConfig, applyFromMonth));
      const recomputedMonths = computeMonthChain(updatedRows, nextConfig.startingBalance, nextConfig.interestRate);
      onYearDataChange?.({
        config: nextConfig,
        months: recomputedMonths,
        recurringExpenses,
      });
      return updatedRows;
    });
  };

  const handleRecurringExpensesApplied = (yearData: YearData) => {
    setConfig(yearData.config);
    setRecurringExpenses(yearData.recurringExpenses);
    setMonthRows(yearData.months);
    onYearDataChange?.(yearData);
  };

  const trackPendingSave = (savePromise: Promise<void>) => {
    if (readOnly) {
      return;
    }

    pendingSaveCountRef.current += 1;
    pendingSavesRef.current.add(savePromise);
    setSavingConfig(true);

    void savePromise.finally(() => {
      pendingSavesRef.current.delete(savePromise);
      pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1);
      if (pendingSaveCountRef.current === 0) {
        setSavingConfig(false);
      }
    });
  };

  const waitForPendingSaves = async () => {
    while (pendingSavesRef.current.size > 0) {
      await Promise.allSettled(Array.from(pendingSavesRef.current));
    }
  };

  const handleExport = async () => {
    if (readOnly) {
      return;
    }

    await waitForPendingSaves();
    window.open(`/api/years/${config.year}/export`, "_blank");
  };

  return (
    <div className="space-y-5">
      <KpiCards
        months={months}
        startingBalance={config.startingBalance}
        config={config}
        description={t("description")}
        savingConfig={readOnly ? false : savingConfig}
        startingBalanceEditable={startingBalanceEditable}
        readOnly={readOnly}
        onConfigChange={setConfig}
        onConfigApplied={applyConfigToMonths}
        yearData={initial}
        annualComparison={annualComparison}
        recurringExpenses={recurringExpenses}
        onRecurringExpensesApplied={handleRecurringExpensesApplied}
        onExport={handleExport}
        onPendingSave={trackPendingSave}
        expectedEntries={expectedEntries}
        expectedIncome={expectedIncome}
        expectedExpenses={expectedExpenses}
        onAddExpectedEntry={handleAddExpectedEntry}
        onDeleteExpectedEntry={handleDeleteExpectedEntry}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <BalanceChart months={months} year={config.year} />
        <SavingsChart months={months} year={config.year} />
      </div>

      <AdditionalEntriesAverages months={months} />
    </div>
  );
}
