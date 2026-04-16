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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const discardIntentRef = useRef(false);

  useEffect(() => {
    if (editing) {
      discardIntentRef.current = false;
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

  const discardEdits = () => {
    discardIntentRef.current = true;
    setEditing(false);
    setError(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (discardIntentRef.current) {
      discardIntentRef.current = false;
      return;
    }

    if (e.relatedTarget === cancelButtonRef.current) {
      return;
    }

    void handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      discardIntentRef.current = true;
      setEditing(false);
      setError(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}>
      <span className="min-w-0 text-sm font-medium text-muted-foreground break-words">{label}</span>
      {editing ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            className={`h-9 w-full rounded-md border bg-background px-2.5 text-right text-sm outline-none transition-colors focus:ring-4 focus:ring-ring/20 sm:w-32 ${error ? "border-destructive" : "border-border"}`}
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(false); }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={saving}
            type="text"
            inputMode="decimal"
          />
          <Button
            ref={cancelButtonRef}
            size="sm"
            variant="ghost"
            className="h-9 w-full px-3 text-muted-foreground sm:w-auto"
            onClick={discardEdits}
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
