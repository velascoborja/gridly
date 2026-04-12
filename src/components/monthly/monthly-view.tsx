"use client";

import { useState, useCallback } from "react";
import { FixedExpensesCard } from "./fixed-expenses-card";
import { IncomeCard } from "./income-card";
import { AdditionalEntriesCard } from "./additional-entries-card";
import { SummaryCard } from "./summary-card";
import { computeMonthChain } from "@/lib/calculations";
import type { MonthData, YearData, AdditionalEntry } from "@/lib/types";

interface Props {
  yearData: YearData;
  monthNumber: number;
}

export function MonthlyView({ yearData: initialYearData, monthNumber }: Props) {
  const [months, setMonths] = useState<MonthData[]>(initialYearData.months);
  const config = initialYearData.config;

  const month = months.find((m) => m.month === monthNumber);

  const recompute = (updated: MonthData[]) => {
    return computeMonthChain(updated, config.startingBalance);
  };

  const handleFixedUpdate = useCallback(async (field: string, value: number) => {
    if (!month) return;
    const res = await fetch(`/api/months/${month.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error("Failed to update");

    setMonths((prev) => {
      const updated = prev.map((m) =>
        m.id === month.id ? { ...m, [field]: value } : m
      );
      return recompute(updated);
    });
  }, [month]);

  const handleEntriesChange = useCallback((type: "income" | "expense", entries: AdditionalEntry[]) => {
    if (!month) return;
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== month.id) return m;
        if (type === "expense") return { ...m, additionalExpenses: entries };
        return { ...m, additionalIncomes: entries };
      });
      return recompute(updated);
    });
  }, [month]);

  if (!month) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No hay datos para este mes
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Expenses column */}
      <div className="space-y-4">
        <FixedExpensesCard month={month} onUpdate={handleFixedUpdate} />
        <AdditionalEntriesCard
          monthId={month.id}
          type="expense"
          entries={month.additionalExpenses}
          onEntriesChange={(entries) => handleEntriesChange("expense", entries)}
          title="Gastos adicionales"
        />
      </div>

      {/* Income column */}
      <div className="space-y-4">
        <IncomeCard month={month} onUpdate={handleFixedUpdate} />
        <AdditionalEntriesCard
          monthId={month.id}
          type="income"
          entries={month.additionalIncomes}
          onEntriesChange={(entries) => handleEntriesChange("income", entries)}
          title="Ingresos adicionales"
        />
      </div>

      {/* Summary column */}
      <div className="md:col-span-2 lg:col-span-1">
        <SummaryCard month={month} />
      </div>
    </div>
  );
}
