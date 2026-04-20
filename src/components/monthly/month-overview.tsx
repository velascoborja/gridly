"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { formatCurrency, formatMonthName } from "@/lib/utils";
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
  const t = useTranslations("Monthly.additionalEntries");
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
        placeholder={t("descriptionPlaceholder")}
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
  const t = useTranslations("Monthly");
  const tOverview = useTranslations("Monthly.overview");
  const locale = useLocale();
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
        if (type === "expense") {
          return { ...m, additionalExpenses: sortAdditionalEntriesDesc([...m.additionalExpenses, entry]) };
        }
        return { ...m, additionalIncomes: sortAdditionalEntriesDesc([...m.additionalIncomes, entry]) };
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
        {t("noData")}
      </div>
    );
  }

  const savingsPositive = month.savings >= 0;
  const sortedAdditionalExpenses = sortAdditionalEntriesDesc(month.additionalExpenses);
  const sortedAdditionalIncomes = sortAdditionalEntriesDesc(month.additionalIncomes);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            {/* Left: Identification */}
            <div className="flex flex-col items-center gap-4 sm:gap-8 md:flex-row">
              <div>
                <h2 className="text-2xl font-bold tracking-tight capitalize">
                  {formatMonthName(month.month, locale)} {config.year}
                </h2>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                  {tOverview("activeMonth")}
                </div>
              </div>
              
              <div className="hidden h-12 w-px bg-white/10 md:block" />

              {/* Center: Primary KPIs */}
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-medium">{tOverview("netSavings")}</p>
                  <p className={`text-3xl font-bold tracking-tight tabular-nums ${savingsPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {savingsPositive ? "+" : ""}{formatCurrency(month.savings, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-medium">{tOverview("endingBalance")}</p>
                  <p className="text-3xl font-bold tracking-tight tabular-nums text-white/90">
                    {formatCurrency(month.endingBalance, locale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Secondary Stats */}
            <div className="flex w-full justify-center gap-6 border-t border-white/10 pt-4 md:w-auto md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div className="space-y-1 md:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("startingBalance")}</p>
                <p className="text-base font-medium tabular-nums text-white/80">{formatCurrency(month.startingBalance, locale)}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("totalIncome")}</p>
                <p className="text-base font-medium tabular-nums text-emerald-400/80">{formatCurrency(month.totalIncome, locale)}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("totalExpenses")}</p>
                <p className="text-base font-medium tabular-nums text-rose-400/80">{formatCurrency(month.totalExpenses, locale)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{tOverview("additionalExpensesTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground">{tOverview("additionalExpensesDescription")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
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
                  {tOverview("addExtraExpense")}
                </button>
              )}
            </div>

            <div>
              {sortedAdditionalExpenses.length > 0 ? (
                <div className="space-y-1.5">
                  {sortedAdditionalExpenses.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
                      <span className="text-sm text-muted-foreground">{entry.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount, locale)}</span>
                        <button
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:text-destructive"
                          onClick={() => handleEntryDelete("expense", entry.id)}
                          aria-label={tOverview("deleteExpenseAria", { label: entry.label })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                  {tOverview("noAdditionalExpenses")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{tOverview("additionalIncomeTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground">{tOverview("additionalIncomeDescription")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
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
                  {tOverview("addExtraIncome")}
                </button>
              )}
            </div>

            <div>
              {sortedAdditionalIncomes.length > 0 ? (
                <div className="space-y-1.5">
                  {sortedAdditionalIncomes.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
                      <span className="text-sm text-muted-foreground">{entry.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount, locale)}</span>
                        <button
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:text-destructive"
                          onClick={() => handleEntryDelete("income", entry.id)}
                          aria-label={tOverview("deleteIncomeAria", { label: entry.label })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                  {tOverview("noAdditionalIncome")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
