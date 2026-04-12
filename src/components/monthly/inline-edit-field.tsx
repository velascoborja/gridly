"use client";

import { useState, useRef, useEffect } from "react";
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
    <div className={`flex items-center justify-between py-1.5 ${className ?? ""}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          className={`w-32 text-right text-sm border rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary ${error ? "border-destructive" : "border-border"}`}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setError(false); }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          type="text"
          inputMode="decimal"
        />
      ) : (
        <button
          className={`text-sm font-medium tabular-nums hover:text-primary hover:underline cursor-pointer disabled:cursor-default disabled:opacity-50 ${error ? "text-destructive" : ""}`}
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
