"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sortRecurringExpensesAsc } from "@/lib/recurring-expenses";
import { cn, formatCurrency } from "@/lib/utils";
import type { RecurringExpense } from "@/lib/types";

interface Props {
  monthId: number;
  entries: RecurringExpense[];
  onEntriesChange: (entries: RecurringExpense[]) => void;
  readOnly?: boolean;
}

export function RecurringExpensesList({ monthId, entries, onEntriesChange, readOnly = false }: Props) {
  const t = useTranslations("RecurringExpenses.monthly");
  const common = useTranslations("Common");
  const locale = useLocale();
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const sortedEntries = sortRecurringExpensesAsc(entries);

  const openEditForm = (entry: RecurringExpense) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
  };

  const handleEdit = async (id: number) => {
    if (savingId === id) return;
    const amount = parseFloat(editAmount.replace(",", "."));
    if (!editLabel.trim() || Number.isNaN(amount)) return;

    setSavingId(id);
    try {
      const res = await fetch(`/api/months/${monthId}/recurring-expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim(), amount }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      onEntriesChange(sortRecurringExpensesAsc(entries.map((entry) => entry.id === id ? updated : entry)));
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/months/${monthId}/recurring-expenses/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      onEntriesChange(sortRecurringExpensesAsc(entries.filter((entry) => entry.id !== id)));
    } finally {
      setDeletingId(null);
    }
  };

  if (sortedEntries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/70 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedEntries.map((entry) =>
        !readOnly && editingId === entry.id ? (
          <div key={entry.id} className="rounded-md border border-border/70 bg-background/80 p-1.5" aria-busy={savingId === entry.id}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
              <Input
                className="h-8 min-w-0 text-sm"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                disabled={savingId === entry.id}
                autoFocus
              />
              <Input
                className="h-8 w-full text-right text-sm sm:w-28"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                disabled={savingId === entry.id}
                inputMode="decimal"
              />
              <Button size="sm" className="h-8 w-full px-3 sm:w-auto" onClick={() => handleEdit(entry.id)} disabled={savingId === entry.id}>
                {savingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {savingId === entry.id ? common("saving") : common("save")}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-full px-3 sm:w-auto" onClick={() => setEditingId(null)} disabled={savingId === entry.id}>
                {common("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={entry.id}
            className={cn(
              "rounded-md border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-background/60",
              deletingId === entry.id && "pointer-events-none opacity-60"
            )}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <button
                className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary disabled:pointer-events-none"
                onClick={() => openEditForm(entry)}
                type="button"
                title={entry.label}
                disabled={readOnly || deletingId === entry.id}
              >
                {entry.label}
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                  {formatCurrency(entry.amount, locale)}
                </span>
                {!readOnly ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id} aria-label={t("deleteEntry", { label: entry.label })}>
                    {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
