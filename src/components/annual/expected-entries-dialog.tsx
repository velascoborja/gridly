"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export interface ExpectedEntry {
  id: string;
  label: string;
  type: "income" | "expense";
  amount: number;
}

interface Props {
  entries: ExpectedEntry[];
  onAdd: (entry: Omit<ExpectedEntry, "id">) => void;
  onDelete: (id: string) => void;
}

export function ExpectedEntriesDialog({ entries, onAdd, onDelete }: Props) {
  const t = useTranslations("Annual");
  const locale = useLocale();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (!label.trim() || isNaN(parsed) || parsed <= 0) return;
    onAdd({ label: label.trim(), type, amount: parsed });
    setLabel("");
    setAmount("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <p className="mb-4 text-xs leading-5 text-muted-foreground">
        {t("expectedEntriesDescription")}
      </p>

      {entries.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("expectedEntriesEmptyState")}
        </p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{entry.label}</p>
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    entry.type === "income"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {entry.type === "income" ? t("expectedEntryIncomeBadge") : t("expectedEntryExpenseBadge")}
                </span>
              </div>
              <p
                className={`shrink-0 finance-number text-sm font-medium ${
                  entry.type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {entry.type === "income" ? "+" : "-"}
                {formatCurrency(entry.amount, locale)}
              </p>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="shrink-0 rounded p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Delete ${entry.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border/50 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2 sm:contents">
            <div className="flex shrink-0 rounded-md border border-border/60 bg-muted/20 p-0.5">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === "income"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("expectedEntryIncomeBadge")}
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === "expense"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("expectedEntryExpenseBadge")}
              </button>
            </div>
            <Input
              placeholder={t("expectedEntryLabelPlaceholder")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-w-0 flex-1"
            />
          </div>
          <div className="flex gap-2 sm:contents">
            <div className="relative flex-1 sm:w-28 sm:flex-none">
              <Input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-6"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                €
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="shrink-0 border-primary/20 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/[0.1] hover:text-primary"
            >
              {t("expectedEntryAddButton")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
