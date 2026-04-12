"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { formatCurrency, MONTH_NAMES } from "@/lib/utils";
import { computeMonthChain } from "@/lib/calculations";
import type { MonthData, YearData, AdditionalEntry } from "@/lib/types";

interface Props {
  yearData: YearData;
  monthNumber: number;
}

interface QuickAddFormProps {
  monthId: number;
  type: "income" | "expense";
  onAdd: (entry: AdditionalEntry) => void;
  onCancel: () => void;
}

function QuickAddForm({ monthId, type, onAdd, onCancel }: QuickAddFormProps) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (!label.trim() || isNaN(parsed)) return;
    setSaving(true);
    const res = await fetch(`/api/months/${monthId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label: label.trim(), amount: parsed }),
    });
    if (!res.ok) { setSaving(false); return; }
    const entry = await res.json();
    onAdd({ ...entry, amount: parseFloat(entry.amount) });
    setSaving(false);
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        className="h-8 text-sm flex-1"
        placeholder="Descripción"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
        autoFocus
      />
      <Input
        className="h-8 text-sm w-28 text-right"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
        inputMode="decimal"
      />
      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleSave} disabled={saving}>✓</Button>
      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={onCancel}>✕</Button>
    </div>
  );
}

export function MonthOverview({ yearData: initialYearData, monthNumber }: Props) {
  const [months, setMonths] = useState<MonthData[]>(initialYearData.months);
  const [addingType, setAddingType] = useState<"income" | "expense" | null>(null);
  const config = initialYearData.config;

  const month = months.find((m) => m.month === monthNumber);

  const recompute = (updated: MonthData[]) =>
    computeMonthChain(updated, config.startingBalance);

  const handleEntryAdded = useCallback((type: "income" | "expense", entry: AdditionalEntry) => {
    if (!month) return;
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== month.id) return m;
        if (type === "expense") return { ...m, additionalExpenses: [...m.additionalExpenses, entry] };
        return { ...m, additionalIncomes: [...m.additionalIncomes, entry] };
      });
      return recompute(updated);
    });
    setAddingType(null);
  }, [month]);

  const handleEntryDelete = useCallback(async (type: "income" | "expense", id: number) => {
    if (!month) return;
    await fetch(`/api/months/${month.id}/entries/${id}`, { method: "DELETE" });
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== month.id) return m;
        if (type === "expense") return { ...m, additionalExpenses: m.additionalExpenses.filter((e) => e.id !== id) };
        return { ...m, additionalIncomes: m.additionalIncomes.filter((e) => e.id !== id) };
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

  const savingsPositive = month.savings >= 0;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(month.totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(month.totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Ahorro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold tabular-nums ${savingsPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(month.savings)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance row */}
      <Card className="border-2">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Saldo inicial</p>
              <p className="text-lg font-semibold tabular-nums">{formatCurrency(month.startingBalance)}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Saldo final</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(month.endingBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick-add section */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Add expense */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {month.additionalExpenses.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1 group">
                <span className="text-sm text-muted-foreground">{entry.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => handleEntryDelete("expense", entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {addingType === "expense" ? (
              <QuickAddForm
                monthId={month.id}
                type="expense"
                onAdd={(e) => handleEntryAdded("expense", e)}
                onCancel={() => setAddingType(null)}
              />
            ) : (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary pt-1 cursor-pointer"
                onClick={() => setAddingType("expense")}
              >
                <Plus className="h-3 w-3" /> Añadir gasto
              </button>
            )}
          </CardContent>
        </Card>

        {/* Add income */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {month.additionalIncomes.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1 group">
                <span className="text-sm text-muted-foreground">{entry.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => handleEntryDelete("income", entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {addingType === "income" ? (
              <QuickAddForm
                monthId={month.id}
                type="income"
                onAdd={(e) => handleEntryAdded("income", e)}
                onCancel={() => setAddingType(null)}
              />
            ) : (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary pt-1 cursor-pointer"
                onClick={() => setAddingType("income")}
              >
                <Plus className="h-3 w-3" /> Añadir ingreso
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
