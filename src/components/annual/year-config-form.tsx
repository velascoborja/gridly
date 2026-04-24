"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { InlineEditField } from "@/components/monthly/inline-edit-field";
import { cn } from "@/lib/utils";
import type { YearConfig } from "@/lib/types";

interface Props {
  config: YearConfig;
  startingBalanceEditable: boolean;
  onConfigChange: Dispatch<SetStateAction<YearConfig>>;
  onExtraPaymentsApplied?: (hasExtraPayments: boolean, estimatedExtraPayment: number) => void;
  onPendingSave?: (savePromise: Promise<void>) => void;
}

export function YearConfigForm({
  config,
  startingBalanceEditable,
  onConfigChange,
  onExtraPaymentsApplied,
  onPendingSave,
}: Props) {
  const t = useTranslations("Annual.config");
  const [savingFields, setSavingFields] = useState<Set<keyof YearConfig>>(() => new Set());
  const [optimisticExtraPayments, setOptimisticExtraPayments] = useState<boolean | null>(null);
  const displayedHasExtraPayments = optimisticExtraPayments ?? config.hasExtraPayments;
  const isSavingField = (field: keyof YearConfig) => savingFields.has(field);

  const handleSave = async (field: keyof YearConfig, value: number | boolean) => {
    setSavingFields((current) => new Set(current).add(field));
    if (field === "hasExtraPayments") {
      setOptimisticExtraPayments(Boolean(value));
    }

    const savePromise = (async () => {
      const res = await fetch(`/api/years/${config.year}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onConfigChange((current) => {
        const next = { ...current, [field]: value };
        if (field === "hasExtraPayments" || field === "estimatedExtraPayment") {
          onExtraPaymentsApplied?.(next.hasExtraPayments, next.estimatedExtraPayment);
        }
        return next;
      });
    })();

    onPendingSave?.(savePromise);
    try {
      await savePromise;
    } finally {
      setSavingFields((current) => {
        const next = new Set(current);
        next.delete(field);
        return next;
      });
      if (field === "hasExtraPayments") {
        setOptimisticExtraPayments(null);
      }
    }
  };

  return (
    <div className="space-y-3 mt-6">
      <div className="grid gap-3">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <InlineEditField
            label={t(startingBalanceEditable ? "startingBalanceEditableLabel" : "startingBalanceLabel")}
            value={config.startingBalance}
            onSave={(v) => handleSave("startingBalance", v)}
            disabled={!startingBalanceEditable}
          />
          <p className="px-2 pt-1 text-sm leading-6 text-muted-foreground">
            {t(startingBalanceEditable ? "startingBalanceEditableDescription" : "startingBalanceDescription")}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <InlineEditField
            label={t("estimatedSalary")}
            value={config.estimatedSalary}
            onSave={(v) => handleSave("estimatedSalary", v)}
          />
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <label
            className="flex items-start justify-between gap-4"
            aria-busy={isSavingField("hasExtraPayments")}
          >
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                {t("hasExtraPayments")}
              </span>
              <span className="block text-sm leading-6 text-muted-foreground">
                {t("hasExtraPaymentsDescription")}
              </span>
            </span>
            <span className="mt-1 flex h-5 shrink-0 items-center gap-2">
              <input
                type="checkbox"
                checked={displayedHasExtraPayments}
                onChange={(event) =>
                  void handleSave("hasExtraPayments", event.target.checked).catch(() => undefined)
                }
                disabled={isSavingField("hasExtraPayments")}
                className="h-5 w-5 rounded border-border text-primary accent-primary"
              />
              {isSavingField("hasExtraPayments") ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-primary"
                  aria-hidden="true"
                />
              ) : null}
            </span>
          </label>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out",
              displayedHasExtraPayments ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
            )}
            aria-hidden={!displayedHasExtraPayments}
          >
            <div className="overflow-hidden">
              <div className="border-t border-border/50 pt-4">
                <InlineEditField
                  label={t("estimatedExtraPayment")}
                  value={config.estimatedExtraPayment}
                  onSave={(v) => handleSave("estimatedExtraPayment", v)}
                  disabled={!displayedHasExtraPayments}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <InlineEditField
            label={t("monthlyInvestment")}
            value={config.monthlyInvestment}
            onSave={(v) => handleSave("monthlyInvestment", v)}
          />
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <InlineEditField
            label={t("monthlyHomeExpense")}
            value={config.monthlyHomeExpense}
            onSave={(v) => handleSave("monthlyHomeExpense", v)}
          />
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <InlineEditField
            label={t("monthlyPersonalBudget")}
            value={config.monthlyPersonalBudget}
            onSave={(v) => handleSave("monthlyPersonalBudget", v)}
          />
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">{t("interestRate")}</span>
            <button
              className="rounded-md border border-transparent px-2 py-1 text-sm font-medium tabular-nums text-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground cursor-pointer"
              onClick={() => {
                const v = prompt(t("interestRate"), String(config.interestRate * 100));
                if (v === null) return;
                const num = parseFloat(v.replace(",", "."));
                if (!isNaN(num)) void handleSave("interestRate", num / 100);
              }}
            >
              {(config.interestRate * 100).toFixed(2)}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
