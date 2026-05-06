"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BrushCleaning, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeNumericInput } from "@/lib/currency-input";
import { cn, formatCurrency } from "@/lib/utils";

interface InlineEditFieldProps {
  label: string;
  value: number;
  onSave: (newValue: number) => Promise<void>;
  formatDisplayValue?: (value: number, locale: string) => string;
  formatEditValue?: (value: number) => string;
  parseInputValue?: (input: string) => number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  activateOnRowPress?: boolean;
  resetValue?: number;
  showReset?: boolean;
  resetLabel?: string;
  onReset?: (resetValue: number) => Promise<void>;
}

const defaultFormatEditValue = (value: number) => String(value);
const defaultParseInputValue = (input: string) => parseFloat(input.replace(",", "."));

export function InlineEditField({
  label,
  value,
  onSave,
  formatDisplayValue = formatCurrency,
  formatEditValue = defaultFormatEditValue,
  parseInputValue = defaultParseInputValue,
  disabled,
  readOnly = false,
  className,
  activateOnRowPress = false,
  resetValue,
  showReset,
  resetLabel,
  onReset,
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
      setInputVal(formatEditValue(value));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, formatEditValue, value]);

  const handleSave = async () => {
    if (saving) return;

    const parsed = parseInputValue(inputVal);
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

  const handleReset = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (saving || resetValue === undefined) return;

    setSaving(true);
    try {
      await (onReset ?? onSave)(resetValue);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const isRowInteractive = activateOnRowPress && !editing && !disabled && !readOnly;
  const resetVisible = showReset ?? (resetValue !== undefined && Math.abs(value - resetValue) > 0.005);
  const canReset = resetValue !== undefined && resetVisible && !disabled && !readOnly;
  const resetActionLabel = resetLabel ?? tCommon("resetToAnnualValue");

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
          <div className="relative min-w-0">
            <input
              ref={inputRef}
              className={`h-10 w-full min-w-0 rounded-md border bg-background px-3 pr-8 text-right text-sm outline-none transition-colors focus:ring-4 focus:ring-ring/20 ${error ? "border-destructive" : "border-border"}`}
              value={inputVal}
              onChange={(e) => {
                setInputVal(sanitizeNumericInput(e.target.value));
                setError(false);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={saving}
              type="text"
              inputMode="decimal"
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-opacity",
                inputVal.trim() ? "opacity-100" : "opacity-0"
              )}
            >
              €
            </span>
          </div>
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
        <div className="flex min-w-0 items-center justify-end gap-1">
          {canReset ? (
            <Button
              size="icon-sm"
              variant="ghost"
              className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-background hover:text-primary"
              onClick={(event) => void handleReset(event)}
              disabled={saving}
              title={resetActionLabel}
              type="button"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BrushCleaning className="h-3.5 w-3.5" />}
              <span className="sr-only">{resetActionLabel}</span>
            </Button>
          ) : null}
          <button
            className={cn(
              "shrink-0 rounded-md px-2 py-1 text-sm font-semibold tabular-nums transition-colors hover:bg-background hover:text-primary disabled:cursor-default disabled:opacity-50",
              error ? "text-destructive" : "text-foreground",
              readOnly && "cursor-default hover:bg-transparent hover:text-foreground"
            )}
            onClick={startEditing}
            disabled={disabled || saving}
            type="button"
          >
            {formatDisplayValue(value, locale)}
          </button>
        </div>
      )}
    </div>
  );
}
