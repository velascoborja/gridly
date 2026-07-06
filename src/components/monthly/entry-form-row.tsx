"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeNumericInput } from "@/lib/currency-input";

interface EntryFormRowProps {
  labelValue: string;
  onLabelChange: (v: string) => void;
  labelPlaceholder?: string;
  amountValue: string;
  onAmountChange: (v: string) => void;
  amountPlaceholder?: string;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
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
  /** Optional slot for a tag action button rendered before recurringAction */
  tagAction?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export function EntryFormRow({
  labelValue,
  onLabelChange,
  labelPlaceholder,
  amountValue,
  onAmountChange,
  amountPlaceholder,
  onSave,
  onCancel,
  disabled = false,
  isSaving = false,
  saveLabel,
  savingLabel,
  cancelLabel,
  folderAction,
  monthAction,
  recurringAction,
  tagAction,
  onKeyDown,
  autoFocus = false,
}: EntryFormRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <Input
        className="h-9 min-w-0 text-sm"
        placeholder={labelPlaceholder}
        value={labelValue}
        onChange={(e) => onLabelChange(e.target.value)}
        disabled={disabled}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
      <div className="relative w-28">
        <Input
          className="h-9 w-full pr-8 text-right text-sm"
          placeholder={amountPlaceholder}
          value={amountValue}
          onChange={(e) => onAmountChange(sanitizeNumericInput(e.target.value))}
          disabled={disabled}
          onKeyDown={onKeyDown}
          inputMode="decimal"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        >
          €
        </span>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-0">
        {tagAction}
        {recurringAction}
        {monthAction}
        {folderAction}
        <Button size="sm" className="ml-2 h-9 px-3" onClick={onSave} disabled={disabled}>
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {isSaving ? savingLabel : saveLabel}
        </Button>
        <Button size="sm" variant="ghost" className="h-9 px-3" onClick={onCancel} disabled={disabled}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
