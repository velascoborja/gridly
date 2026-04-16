"use client";

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
    <Card className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>
          Movimientos puntuales con edición rápida y eliminaciones explícitas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && !adding && (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            Sin entradas todavía.
          </div>
        )}
        {entries.map((entry) =>
          editingId === entry.id ? (
            <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-2">
              <div className="flex gap-2">
                <Input
                  className="h-9 flex-1 text-sm"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(entry.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <Input
                  className="h-9 w-28 text-right text-sm"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(entry.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  inputMode="decimal"
                />
                <Button size="sm" className="h-9 px-3" onClick={() => handleEdit(entry.id)}>
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div key={entry.id} className="group flex items-center justify-between rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border/70 hover:bg-muted/40">
              <button
                className="flex-1 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
                onClick={() => openEditForm(entry)}
                type="button"
                aria-label={`Editar ${entry.label}`}
              >
                {entry.label}
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(entry.amount)}</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => openEditForm(entry)}
                  aria-label={`Editar ${entry.label}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                  aria-label={`Eliminar ${entry.label}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        )}

        {adding ? (
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <div className="flex gap-2">
              <Input
                className="h-9 flex-1 text-sm"
                placeholder="Descripción"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") closeAddForm();
                }}
                autoFocus
              />
              <Input
                className="h-9 w-28 text-right text-sm"
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") closeAddForm();
                }}
                inputMode="decimal"
              />
              <Button size="sm" className="h-9 px-3" onClick={handleAdd}>
                Añadir
              </Button>
              <Button size="sm" variant="ghost" className="h-9 px-3" onClick={closeAddForm}>
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
            <Plus className="h-3.5 w-3.5" /> Añadir entrada
          </button>
        )}
      </CardContent>
    </Card>
  );
}
