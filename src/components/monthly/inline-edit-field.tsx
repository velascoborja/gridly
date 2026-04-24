"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

interface InlineEditFieldProps {
  label: string;
  value: number;
  onSave: (newValue: number) => Promise<void>;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  activateOnRowPress?: boolean;
}

export function InlineEditField({
  label,
  value,
  onSave,
  disabled,
  readOnly = false,
  className,
  activateOnRowPress = false,
}: InlineEditFieldProps) {
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
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
    if (saving) return;

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

    if (e.relatedTarget === saveButtonRef.current || e.relatedTarget === cancelButtonRef.current) {
      return;
    }

    void handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void handleSave();
    if (e.key === "Escape") {
      discardIntentRef.current = true;
      setEditing(false);
      setError(false);
    }
  };

  const startEditing = () => {
    if (!disabled && !readOnly) {
      setEditing(true);
    }
  };

  const isRowInteractive = activateOnRowPress && !editing && !disabled && !readOnly;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/30",
        isRowInteractive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        className,
      )}
      onClick={isRowInteractive ? startEditing : undefined}
      onKeyDown={
        isRowInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startEditing();
              }
            }
          : undefined
      }
      role={isRowInteractive ? "button" : undefined}
      tabIndex={isRowInteractive ? 0 : undefined}
    >
      <span className="min-w-0 truncate whitespace-nowrap text-sm font-medium text-foreground">{label}</span>
      {editing ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5" aria-busy={saving}>
          <input
            ref={inputRef}
            className={`h-9 w-24 rounded-md border bg-background px-2.5 text-right text-sm outline-none transition-colors focus:ring-4 focus:ring-ring/20 sm:w-32 ${error ? "border-destructive" : "border-border"}`}
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(false); }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={saving}
            type="text"
            inputMode="decimal"
          />
          <Button
            ref={saveButtonRef}
            size="sm"
            className="h-9 shrink-0 px-3"
            onClick={() => void handleSave()}
            disabled={saving}
            type="button"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? tCommon("saving") : tCommon("save")}
          </Button>
          <Button
            ref={cancelButtonRef}
            size="sm"
            variant="ghost"
            className="h-9 shrink-0 px-2 text-muted-foreground sm:px-3"
            onClick={discardEdits}
            disabled={saving}
            type="button"
          >
            {tCommon("cancel")}
          </Button>
        </div>
      ) : (
        <button
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-sm font-semibold tabular-nums transition-colors hover:bg-background hover:text-primary disabled:cursor-default disabled:opacity-50",
            error ? "text-destructive" : "text-foreground",
            readOnly && "cursor-default hover:bg-transparent hover:text-foreground"
          )}
          onClick={startEditing}
          disabled={disabled}
          type="button"
        >
          {formatCurrency(value, locale)}
        </button>
      )}
    </div>
  );
}
