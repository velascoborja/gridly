"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
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
    try {
      const res = await fetch(`/api/months/${monthId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: label.trim(), amount: parsed }),
      });
      if (!res.ok) return;

      const entry = await res.json();
      onAdd({ ...entry, amount: parseFloat(entry.amount) });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex gap-2 items-center rounded-xl border border-border/60 bg-background/70 p-2">
      <Input
        className="h-9 flex-1 text-sm"
        placeholder="Descripción"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Input
        className="h-9 w-28 text-right text-sm"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={handleKeyDown}
        inputMode="decimal"
      />
      <Button size="sm" variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-foreground" onClick={handleSave} disabled={saving}>
        ✓
      </Button>
      <Button size="sm" variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-foreground" onClick={onCancel}>
        ✕
      </Button>
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

  const handleEntryAdded = (type: "income" | "expense", entry: AdditionalEntry) => {
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
  };

  const handleEntryDelete = async (type: "income" | "expense", id: number) => {
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
  };

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
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-950/20">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-end">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
                Mes activo
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">{MONTH_NAMES[month.month - 1]}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Panel de control del mes seleccionado con saldo, flujo y accesos rápidos para registrar movimientos sin perder la cadena de cálculo.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Saldo inicial</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">{formatCurrency(month.startingBalance)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Saldo final</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">{formatCurrency(month.endingBalance)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Ahorro</p>
                  <p className={`mt-2 text-lg font-semibold tabular-nums ${savingsPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {formatCurrency(month.savings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">Ingresos</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-300">{formatCurrency(month.totalIncome)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">Gastos</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-rose-300">{formatCurrency(month.totalExpenses)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gastos adicionales</CardTitle>
            <p className="text-xs text-muted-foreground">Movimientos puntuales que reducen el ahorro del mes.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {month.additionalExpenses.length > 0 ? (
              <div className="space-y-1.5">
                {month.additionalExpenses.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
                    <span className="text-sm text-muted-foreground">{entry.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                      <button
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:text-destructive"
                        onClick={() => handleEntryDelete("expense", entry.id)}
                        aria-label={`Eliminar gasto ${entry.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                No hay gastos adicionales todavía. Añade uno si este mes tiene un ajuste puntual.
              </div>
            )}

            {addingType === "expense" ? (
              <QuickAddForm
                monthId={month.id}
                type="expense"
                onAdd={(e) => handleEntryAdded("expense", e)}
                onCancel={() => setAddingType(null)}
              />
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setAddingType("expense")}
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir gasto extra
              </button>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ingresos adicionales</CardTitle>
            <p className="text-xs text-muted-foreground">Entradas extraordinarias que mejoran el saldo final.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {month.additionalIncomes.length > 0 ? (
              <div className="space-y-1.5">
                {month.additionalIncomes.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
                    <span className="text-sm text-muted-foreground">{entry.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                      <button
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:text-destructive"
                        onClick={() => handleEntryDelete("income", entry.id)}
                        aria-label={`Eliminar ingreso ${entry.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                No hay ingresos adicionales todavía. Registra una entrada puntual si corresponde.
              </div>
            )}

            {addingType === "income" ? (
              <QuickAddForm
                monthId={month.id}
                type="income"
                onAdd={(e) => handleEntryAdded("income", e)}
                onCancel={() => setAddingType(null)}
              />
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setAddingType("income")}
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir ingreso extra
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
