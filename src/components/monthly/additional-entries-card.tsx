"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, X } from "lucide-react";
import { sortAdditionalEntriesDesc, sumAdditionalEntries } from "@/lib/additional-entries";
import { formatCurrency } from "@/lib/utils";
import type { AdditionalEntry } from "@/lib/types";

interface Props {
  monthId: number;
  type: "income" | "expense";
  entries: AdditionalEntry[];
  onEntriesChange: (entries: AdditionalEntry[]) => void;
  title: string;
}

export function AdditionalEntriesCard({ monthId, type, entries, onEntriesChange, title }: Props) {
  const t = useTranslations("Monthly.additionalEntries");
  const common = useTranslations("Common");
  const locale = useLocale();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const sortedEntries = sortAdditionalEntriesDesc(entries);
  const entriesTotal = sumAdditionalEntries(entries);

  const closeAddForm = () => {
    setAdding(false);
    setNewLabel("");
    setNewAmount("");
  };

  const openEditForm = (entry: AdditionalEntry) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
  };

  const handleAdd = async () => {
    const amount = parseFloat(newAmount.replace(",", "."));
    if (!newLabel.trim() || isNaN(amount)) return;

    const res = await fetch(`/api/months/${monthId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label: newLabel.trim(), amount }),
    });
    if (!res.ok) return;
    const entry = await res.json();
    onEntriesChange(sortAdditionalEntriesDesc([...entries, { ...entry, amount: parseFloat(entry.amount) }]));
    closeAddForm();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/months/${monthId}/entries/${id}`, { method: "DELETE" });
    onEntriesChange(sortAdditionalEntriesDesc(entries.filter((e) => e.id !== id)));
  };

  const handleEdit = async (id: number) => {
    const amount = parseFloat(editAmount.replace(",", "."));
    if (!editLabel.trim() || isNaN(amount)) return;
    const res = await fetch(`/api/months/${monthId}/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel.trim(), amount }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    onEntriesChange(
      sortAdditionalEntriesDesc(
        entries.map((e) => e.id === id ? { ...updated, amount: parseFloat(updated.amount) } : e)
      )
    );
    setEditingId(null);
  };

  return (
    <Card size="sm" className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription>
              {t(type === "income" ? "descriptionIncome" : "descriptionExpense")}
            </CardDescription>
          </div>
          <div className="grid shrink-0 justify-items-center rounded-md border border-border/70 bg-background/80 px-2.5 py-1 text-center shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("total")}
            </p>
            <p className={`text-sm font-semibold tabular-nums ${type === "income" ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
              {formatCurrency(entriesTotal, locale)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div>
          {adding ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
                <Input
                  className="h-9 min-w-0 text-sm"
                  placeholder={t("descriptionPlaceholder")}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") closeAddForm();
                  }}
                  autoFocus
                />
                <Input
                  className="h-9 w-full text-right text-sm sm:w-28"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") closeAddForm();
                  }}
                  inputMode="decimal"
                />
                <Button size="sm" className="h-9 px-3 sm:w-auto" onClick={handleAdd}>
                  {t("add")}
                </Button>
                <Button size="sm" variant="ghost" className="h-9 px-3 sm:w-auto" onClick={closeAddForm}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setAdding(true)}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" /> {t("addEntry")}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {sortedEntries.length === 0 && !adding && (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {t("noEntries")}
            </div>
          )}
          {sortedEntries.map((entry) =>
            editingId === entry.id ? (
              <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
                  <Input
                    className="h-9 min-w-0 text-sm"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(entry.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <Input
                    className="h-9 w-full text-right text-sm sm:w-28"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(entry.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    inputMode="decimal"
                  />
                  <Button size="sm" className="h-9 px-3 sm:w-auto" onClick={() => handleEdit(entry.id)}>
                    {common("save")}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 px-3 sm:w-auto" onClick={() => setEditingId(null)}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div key={entry.id} className="rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-border/70 hover:bg-muted/40">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <button
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                    onClick={() => openEditForm(entry)}
                    type="button"
                    aria-label={`${t("edit")} ${entry.label}`}
                    title={entry.label}
                  >
                    {entry.label}
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatCurrency(entry.amount, locale)}</span>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`${t("delete")} ${entry.label}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        }
                      />
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("confirmDeleteDescription", { label: entry.label })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel variant="ghost">{t("cancel")}</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => handleDelete(entry.id)}>
                            {t("confirmDeleteAction")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
