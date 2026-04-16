"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface InlineEditFieldProps {
  label: string;
  value: number;
  onSave: (newValue: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function InlineEditField({ label, value, onSave, disabled, className }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setInputVal(String(value));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const handleSave = async () => {
    const parsed = parseFloat(inputVal.replace(",", "."));
    if (isNaN(parsed)) {
      setError(true);
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed);
      setEditing(false);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setError(false);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/30 ${className ?? ""}`}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className={`h-9 w-32 rounded-md border bg-background px-2.5 text-right text-sm outline-none transition-colors focus:ring-4 focus:ring-ring/20 ${error ? "border-destructive" : "border-border"}`}
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(false); }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={saving}
            type="text"
            inputMode="decimal"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-9 px-3 text-muted-foreground"
            onClick={() => {
              setEditing(false);
              setError(false);
            }}
            type="button"
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <button
          className={`rounded-md px-2 py-1 text-sm font-semibold tabular-nums transition-colors hover:bg-background hover:text-primary disabled:cursor-default disabled:opacity-50 ${error ? "text-destructive" : "text-foreground"}`}
          onClick={() => !disabled && setEditing(true)}
          disabled={disabled}
          type="button"
        >
          {formatCurrency(value)}
        </button>
      )}
    </div>
  );
}
