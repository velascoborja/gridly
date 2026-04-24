"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
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
        <div
          className="col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
          aria-busy={saving}
        >
          <input
            ref={inputRef}
            className={`h-10 min-w-0 rounded-md border bg-background px-3 text-right text-sm outline-none transition-colors focus:ring-4 focus:ring-ring/20 ${error ? "border-destructive" : "border-border"}`}
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
            size="icon-lg"
            className="h-10 w-10 shrink-0 rounded-md"
            onClick={() => void handleSave()}
            disabled={saving}
            type="button"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span className="sr-only">{saving ? tCommon("saving") : tCommon("save")}</span>
          </Button>
          <Button
            ref={cancelButtonRef}
            size="icon-lg"
            variant="ghost"
            className="h-10 w-10 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
            onClick={discardEdits}
            disabled={saving}
            type="button"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{tCommon("cancel")}</span>
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
