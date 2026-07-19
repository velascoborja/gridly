"use client";

import { useId, useState, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sanitizeMoneyExpressionInput, sanitizeNumericInput } from "@/lib/currency-input";

interface EntryFormActionBase {
  id: "tag" | "recurring" | "completion" | "month" | "group";
  label: string;
  icon: ReactNode;
  active?: boolean;
  activeTone?: "primary" | "success";
  pending?: boolean;
  disabled?: boolean;
}

export interface EntryFormCommandAction extends EntryFormActionBase {
  kind: "command";
  onSelect: () => void | Promise<void>;
}

export interface EntryFormSelectorAction extends EntryFormActionBase {
  kind: "selector";
  renderPanel: (controls: { close: () => void }) => ReactNode;
}

export type EntryFormAction = EntryFormCommandAction | EntryFormSelectorAction;

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
  actions?: EntryFormAction[];
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean | "label" | "amount";
}

const actionButtonClass = (active?: boolean, activeTone: "primary" | "success" = "primary") =>
  cn(
    "h-9 w-9 shrink-0",
    active && activeTone === "success"
      ? "bg-emerald-500/10 text-emerald-700 shadow-[inset_0_0_0_1px_rgb(21_190_83_/_0.18)] hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-300"
      : active
        ? "bg-primary/10 text-primary hover:bg-primary/20"
        : "text-muted-foreground hover:text-primary"
  );

function ActionIconButton({ action, onClick }: { action: EntryFormAction; onClick?: () => void }) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      type="button"
      className={actionButtonClass(action.active, action.activeTone)}
      aria-label={action.label}
      title={action.label}
      aria-pressed={action.active || undefined}
      aria-busy={action.pending || undefined}
      onClick={onClick}
      disabled={action.disabled || action.pending}
    >
      {action.pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
      ) : (
        action.icon
      )}
    </Button>
  );
}

function SelectorPopover({ action }: { action: EntryFormSelectorAction }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger render={<ActionIconButton action={action} />} />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4} className="isolate z-50">
          <Popover.Popup
            className="w-56 max-w-[calc(100vw-1rem)] max-h-[min(var(--available-height),calc(100dvh-1rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-md outline-none motion-reduce:transition-none"
            finalFocus
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {action.label}
            </p>
            {action.renderPanel({ close: () => setOpen(false) })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function EntryFormSelectorList({ children }: { children: ReactNode }) {
  return <div className="space-y-0.5">{children}</div>;
}

export function EntryFormSelectorItem({
  children,
  selected = false,
  disabled = false,
  onSelect,
}: {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  const handleSelect = async () => {
    if (pending || disabled) return;
    setPending(true);
    try {
      await onSelect();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
        selected && "bg-primary/8 text-primary"
      )}
      disabled={disabled || pending}
      aria-pressed={selected}
      aria-busy={pending || undefined}
      onClick={() => void handleSelect()}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
      ) : selected ? (
        <span aria-hidden="true" className="text-xs leading-none">✓</span>
      ) : null}
    </button>
  );
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
  actions = [],
  onKeyDown,
  autoFocus = false,
}: EntryFormRowProps) {
  const t = useTranslations("Monthly.additionalEntries");
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileSelectorId, setMobileSelectorId] = useState<EntryFormAction["id"] | null>(null);
  const [internalPendingId, setInternalPendingId] = useState<EntryFormAction["id"] | null>(null);
  const autoFocusTarget = autoFocus === true ? "label" : autoFocus;
  const amountFeedbackId = useId();
  const hasAmountFeedback = Boolean(amountPreview || amountError);
  const isAmountCalculationInProgress = amountMode === "expression" && /[-+*/()]/.test(amountValue);
  const shouldShowAmountFeedback = isAmountCalculationInProgress || hasAmountFeedback;
  const mobileSelector = actions.find(
    (action): action is EntryFormSelectorAction => action.kind === "selector" && action.id === mobileSelectorId
  );
  const hasPrimaryActiveAction = actions.some((action) => action.active && action.activeTone !== "success");
  const hasSuccessActiveAction = actions.some((action) => action.active && action.activeTone === "success");
  const hasPendingAction = internalPendingId !== null || actions.some((action) => action.pending);

  const handleMoreOpenChange = (open: boolean) => {
    setMoreOpen(open);
    if (!open) setMobileSelectorId(null);
  };

  const runCommand = async (action: EntryFormCommandAction) => {
    if (internalPendingId !== null || action.pending || action.disabled) return;
    setInternalPendingId(action.id);
    try {
      await action.onSelect();
      setMoreOpen(false);
    } finally {
      setInternalPendingId(null);
    }
  };

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
      <div className="col-span-2 mt-2 flex min-w-0 items-center justify-end gap-0">
        {actions.length > 0 ? (
          <>
            <Popover.Root open={moreOpen} onOpenChange={handleMoreOpenChange}>
              <Popover.Trigger
                render={
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    className={cn(
                      "relative mr-auto h-9 min-w-0 gap-1.5 px-2 sm:hidden",
                      hasSuccessActiveAction
                        ? "bg-emerald-500/10 text-emerald-700 shadow-[inset_0_0_0_1px_rgb(21_190_83_/_0.18)] hover:bg-emerald-500/15 hover:text-emerald-800 aria-expanded:bg-emerald-500/15 aria-expanded:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 dark:aria-expanded:text-emerald-200"
                        : hasPrimaryActiveAction
                          ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgb(83_58_253_/_0.14)] hover:bg-primary/15 hover:text-primary aria-expanded:bg-primary/15 aria-expanded:text-primary"
                          : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-busy={hasPendingAction || undefined}
                    disabled={disabled || hasPendingAction}
                  >
                    <span>{t("actions")}</span>
                    {hasPendingAction ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-150 motion-reduce:transition-none",
                          moreOpen && "rotate-180"
                        )}
                      />
                    )}
                  </Button>
                }
              />
              <Popover.Portal>
                <Popover.Positioner side="bottom" align="start" sideOffset={4} className="isolate z-50 sm:hidden">
                  <Popover.Popup
                    className="w-[min(17rem,calc(100vw-1rem))] max-h-[min(var(--available-height),calc(100dvh-1rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-md outline-none motion-reduce:transition-none"
                    aria-busy={hasPendingAction || undefined}
                    finalFocus
                  >
                    {mobileSelector ? (
                      <div>
                        <button
                          type="button"
                          className="mb-1 flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          onClick={() => setMobileSelectorId(null)}
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>{t("back")}</span>
                        </button>
                        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {mobileSelector.label}
                        </p>
                        {mobileSelector.renderPanel({ close: () => setMoreOpen(false) })}
                      </div>
                    ) : (
                      <div className="space-y-0.5" role="group" aria-label={t("actions")}>
                        {actions.map((action) => {
                          const pending = action.pending || internalPendingId === action.id;
                          return (
                            <button
                              key={action.id}
                              type="button"
                              className={cn(
                                "flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
                                action.active && (action.activeTone === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-primary")
                              )}
                              disabled={action.disabled || pending || internalPendingId !== null}
                              aria-busy={pending || undefined}
                              aria-pressed={action.active || undefined}
                              onClick={() => {
                                if (action.kind === "selector") setMobileSelectorId(action.id);
                                else void runCommand(action);
                              }}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : action.icon}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{action.label}</span>
                              {action.kind === "selector" ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <div className="hidden items-center sm:flex">
              {actions.map((action) =>
                action.kind === "selector" ? (
                  <SelectorPopover key={action.id} action={action} />
                ) : (
                  <ActionIconButton key={action.id} action={action} onClick={() => void runCommand(action)} />
                )
              )}
            </div>
          </>
        ) : null}
        <div className={cn("flex shrink-0 items-center", actions.length > 0 && "sm:ml-2")}>
          {showSaveAction ? (
            <Button size="sm" className="h-9 px-3" onClick={onSave} disabled={saveDisabled} aria-busy={isSaving || undefined}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : null}
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
    </div>
  );
}
