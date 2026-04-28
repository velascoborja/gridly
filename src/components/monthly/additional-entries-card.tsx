"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { sortAdditionalEntriesDesc, sumAdditionalEntries } from "@/lib/additional-entries";
import { cn, formatCurrency } from "@/lib/utils";
import type { AdditionalEntry } from "@/lib/types";

interface Props {
  monthId: number;
  type: "income" | "expense";
  entries: AdditionalEntry[];
  onEntriesChange: (entries: AdditionalEntry[]) => void;
  onPersistedChange?: () => void;
  readOnly?: boolean;
  title: string;
}

export function AdditionalEntriesCard({
  monthId,
  type,
  entries,
  onEntriesChange,
  onPersistedChange,
  readOnly = false,
  title,
}: Props) {
  const t = useTranslations("Monthly.additionalEntries");
  const common = useTranslations("Common");
  const locale = useLocale();
  const [addingFormOpen, setAddingFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const sortedEntries = sortAdditionalEntriesDesc(entries);
  const entriesTotal = sumAdditionalEntries(entries);

  const closeAddForm = () => {
    setAddingFormOpen(false);
    setNewLabel("");
    setNewAmount("");
  };

  const openEditForm = (entry: AdditionalEntry) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
  };

  const handleAdd = async () => {
    if (isAdding) return;
    const amount = parseFloat(newAmount.replace(",", "."));
    if (!newLabel.trim() || isNaN(amount)) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: newLabel.trim(), amount }),
      });
      if (!res.ok) return;
      const entry = await res.json();
      onEntriesChange(sortAdditionalEntriesDesc([...entries, { ...entry, amount: parseFloat(entry.amount) }]));
      onPersistedChange?.();
      closeAddForm();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId === id) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/months/${monthId}/entries/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      onEntriesChange(sortAdditionalEntriesDesc(entries.filter((e) => e.id !== id)));
      onPersistedChange?.();
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = async (id: number) => {
    if (savingId === id) return;
    const amount = parseFloat(editAmount.replace(",", "."));
    if (!editLabel.trim() || isNaN(amount)) return;

    setSavingId(id);
    try {
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
      onPersistedChange?.();
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
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
          {!readOnly && addingFormOpen ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAdding}>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
                <Input
                  className="h-9 min-w-0 text-sm"
                  placeholder={t("descriptionPlaceholder")}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  disabled={isAdding}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape" && !isAdding) closeAddForm();
                  }}
                  autoFocus
                />
                <Input
                  className="h-9 w-full text-right text-sm sm:w-28"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  disabled={isAdding}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape" && !isAdding) closeAddForm();
                  }}
                  inputMode="decimal"
                />
                <Button size="sm" className="h-9 w-full px-3 sm:w-auto" onClick={handleAdd} disabled={isAdding}>
                  {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {isAdding ? t("adding") : t("add")}
                </Button>
                <Button size="sm" variant="ghost" className="h-9 w-full px-3 sm:w-auto" onClick={closeAddForm} disabled={isAdding}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : !readOnly ? (
            <button
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setAddingFormOpen(true)}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" /> {t("addEntry")}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          {sortedEntries.length === 0 && (readOnly || !addingFormOpen) && (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {t("noEntries")}
            </div>
          )}
          {sortedEntries.map((entry) =>
            !readOnly && editingId === entry.id ? (
              <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
                  <Input
                    className="h-9 min-w-0 text-sm"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    disabled={savingId === entry.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(entry.id);
                      if (e.key === "Escape" && savingId !== entry.id) setEditingId(null);
                    }}
                    autoFocus
                  />
                  <Input
                    className="h-9 w-full text-right text-sm sm:w-28"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    disabled={savingId === entry.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(entry.id);
                      if (e.key === "Escape" && savingId !== entry.id) setEditingId(null);
                    }}
                    inputMode="decimal"
                  />
                  <Button size="sm" className="h-9 w-full px-3 sm:w-auto" onClick={() => handleEdit(entry.id)} disabled={savingId === entry.id}>
                    {savingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {savingId === entry.id ? t("saving") : common("save")}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-full px-3 sm:w-auto" onClick={() => setEditingId(null)} disabled={savingId === entry.id}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={entry.id}
                className={cn(
                  "rounded-xl border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-muted/40",
                  deletingId === entry.id && "pointer-events-none opacity-60"
                )}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  {readOnly ? (
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground" title={entry.label}>
                      {entry.label}
                    </span>
                  ) : (
                    <button
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                      onClick={() => openEditForm(entry)}
                      type="button"
                      aria-label={`${t("edit")} ${entry.label}`}
                      title={entry.label}
                      disabled={deletingId === entry.id}
                    >
                      {entry.label}
                    </button>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {readOnly ? (
                      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                        {formatCurrency(entry.amount, locale)}
                      </span>
                    ) : (
                      <button
                        className="whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold tabular-nums text-foreground transition-colors hover:bg-background hover:text-primary"
                        onClick={() => openEditForm(entry)}
                        type="button"
                        aria-label={`${t("edit")} ${entry.label}`}
                        disabled={deletingId === entry.id}
                      >
                        {formatCurrency(entry.amount, locale)}
                      </button>
                    )}
                    {!readOnly ? (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`${t("delete")} ${entry.label}`}
                              disabled={deletingId === entry.id}
                            >
                              {deletingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
                            <AlertDialogCancel variant="ghost" disabled={deletingId === entry.id}>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id}>
                              {deletingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              {deletingId === entry.id ? t("deleting") : t("confirmDeleteAction")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
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
