"use client";

import { useId } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeMoneyExpressionInput, sanitizeNumericInput } from "@/lib/currency-input";

interface EntryFormRowProps {
  labelValue: string;
  onLabelChange: (v: string) => void;
  labelPlaceholder?: string;
  amountValue: string;
  onAmountChange: (v: string) => void;
  amountPlaceholder?: string;
  amountMode?: "numeric" | "expression";
  amountPreview?: string | null;
  amountError?: string | null;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
  fieldsDisabled?: boolean;
  saveDisabled?: boolean;
  showSaveAction?: boolean;
  showCancelAction?: boolean;
  isSaving?: boolean;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
  /** Optional slot for a folder/move action button rendered before Save/Cancel */
  folderAction?: React.ReactNode;
  /** Optional slot for moving an entry to another month */
  monthAction?: React.ReactNode;
  /** Optional slot for a recurring toggle button rendered before folderAction */
  recurringAction?: React.ReactNode;
  /** Optional slot for the completion lock rendered with the other row actions */
  completionAction?: React.ReactNode;
  /** Optional slot for a tag action button rendered before recurringAction */
  tagAction?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean | "label" | "amount";
}

export function EntryFormRow({
  labelValue,
  onLabelChange,
  labelPlaceholder,
  amountValue,
  onAmountChange,
  amountPlaceholder,
  amountMode = "numeric",
  amountPreview = null,
  amountError = null,
  onSave,
  onCancel,
  disabled = false,
  fieldsDisabled = disabled,
  saveDisabled = disabled,
  showSaveAction = true,
  showCancelAction = true,
  isSaving = false,
  saveLabel,
  savingLabel,
  cancelLabel,
  folderAction,
  monthAction,
  recurringAction,
  completionAction,
  tagAction,
  onKeyDown,
  autoFocus = false,
}: EntryFormRowProps) {
  const autoFocusTarget = autoFocus === true ? "label" : autoFocus;
  const amountFeedbackId = useId();
  const hasAmountFeedback = Boolean(amountPreview || amountError);
  const isAmountCalculationInProgress = amountMode === "expression" && /[-+*/()]/.test(amountValue);
  const shouldShowAmountFeedback = isAmountCalculationInProgress || hasAmountFeedback;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2">
      <Input
        className="h-9 min-w-0 text-sm"
        placeholder={labelPlaceholder}
        value={labelValue}
        onChange={(e) => onLabelChange(e.target.value)}
        disabled={fieldsDisabled}
        onKeyDown={onKeyDown}
        autoFocus={autoFocusTarget === "label"}
      />
      <div className="relative w-36">
        <Input
          className="h-9 w-full pr-8 text-right text-sm"
          placeholder={amountPlaceholder}
          value={amountValue}
          onChange={(e) =>
            onAmountChange(
              amountMode === "expression"
                ? sanitizeMoneyExpressionInput(e.target.value)
                : sanitizeNumericInput(e.target.value)
            )
          }
          disabled={fieldsDisabled}
          onKeyDown={onKeyDown}
          inputMode={amountMode === "expression" ? "text" : "decimal"}
          autoFocus={autoFocusTarget === "amount"}
          aria-invalid={amountError ? true : undefined}
          aria-describedby={hasAmountFeedback ? amountFeedbackId : undefined}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        >
          €
        </span>
      </div>
      <div
        className={`col-span-2 overflow-hidden transition-[max-height,margin-top,opacity] duration-200 ease-out motion-reduce:transition-none ${
          shouldShowAmountFeedback ? "mt-2 max-h-4 opacity-100" : "mt-0 max-h-0 opacity-0"
        }`}
      >
        <div
          id={amountFeedbackId}
          aria-live="polite"
          className={`col-span-2 min-h-4 text-right text-[11px] leading-4 tabular-nums ${
            amountError ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {amountError ? amountError : amountPreview}
        </div>
      </div>
      <div className="col-span-2 mt-2 flex items-center justify-end gap-0">
        {tagAction}
        {recurringAction}
        {completionAction}
        {monthAction}
        {folderAction}
        {showSaveAction ? (
          <Button size="sm" className="ml-2 h-9 px-3" onClick={onSave} disabled={saveDisabled}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isSaving ? savingLabel : saveLabel}
          </Button>
        ) : null}
        {showCancelAction ? (
          <Button size="sm" variant="ghost" className="h-9 px-3" onClick={onCancel} disabled={disabled}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
