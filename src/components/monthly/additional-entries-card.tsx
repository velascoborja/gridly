"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");

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
    onEntriesChange([...entries, { ...entry, amount: parseFloat(entry.amount) }]);
    closeAddForm();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/months/${monthId}/entries/${id}`, { method: "DELETE" });
    onEntriesChange(entries.filter((e) => e.id !== id));
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
    onEntriesChange(entries.map((e) => e.id === id ? { ...updated, amount: parseFloat(updated.amount) } : e));
    setEditingId(null);
  };

  return (
    <Card size="sm" className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="order-first md:order-last">
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

        <div className="order-last flex flex-col gap-2 md:order-first">
          {entries.length === 0 && !adding && (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {t("noEntries")}
            </div>
          )}
          {entries.map((entry) =>
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
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    className="min-w-0 flex-1 text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                    onClick={() => openEditForm(entry)}
                    type="button"
                    aria-label={`${t("edit")} ${entry.label}`}
                  >
                    {entry.label}
                  </button>
                  <div className="flex items-center gap-1.5 sm:shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(entry.amount)}</span>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => openEditForm(entry)}
                      aria-label={`${t("edit")} ${entry.label}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                      aria-label={`${t("delete")} ${entry.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
