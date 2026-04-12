"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
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
    setNewLabel("");
    setNewAmount("");
    setAdding(false);
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground py-1">Sin entradas</p>
        )}
        {entries.map((entry) =>
          editingId === entry.id ? (
            <div key={entry.id} className="flex gap-2">
              <Input
                className="h-7 text-sm flex-1"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEdit(entry.id); if (e.key === "Escape") setEditingId(null); }}
                autoFocus
              />
              <Input
                className="h-7 text-sm w-24 text-right"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEdit(entry.id); if (e.key === "Escape") setEditingId(null); }}
                inputMode="decimal"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleEdit(entry.id)}>✓</Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>✕</Button>
            </div>
          ) : (
            <div key={entry.id} className="flex items-center justify-between py-1 group">
              <button
                className="text-sm text-left flex-1 hover:text-primary cursor-pointer"
                onClick={() => { setEditingId(entry.id); setEditLabel(entry.label); setEditAmount(String(entry.amount)); }}
              >
                {entry.label}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}

        {adding ? (
          <div className="flex gap-2 pt-1">
            <Input
              className="h-7 text-sm flex-1"
              placeholder="Descripción"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
              autoFocus
            />
            <Input
              className="h-7 text-sm w-24 text-right"
              placeholder="0.00"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
              inputMode="decimal"
            />
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAdd}>✓</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setAdding(false)}>✕</Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary pt-1 cursor-pointer"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" /> Añadir
          </button>
        )}
      </CardContent>
    </Card>
  );
}
