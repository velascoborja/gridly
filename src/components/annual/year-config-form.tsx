"use client";

import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { RecurringExpenseTemplateEditor } from "@/components/recurring-expenses/recurring-expense-template-editor";
import { useRouter } from "@/i18n/routing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InlineEditField } from "@/components/monthly/inline-edit-field";
import { cn } from "@/lib/utils";
import type { RecurringExpenseInput } from "@/lib/recurring-expenses";
import type { YearConfig, YearData, YearRecurringExpense } from "@/lib/types";

interface Props {
  config: YearConfig;
  startingBalanceEditable: boolean;
  onConfigChange: Dispatch<SetStateAction<YearConfig>>;
  onConfigApplied?: (config: YearConfig) => void;
  recurringExpenses: YearRecurringExpense[];
  onRecurringExpensesApplied: (yearData: YearData) => void;
  onPendingSave?: (savePromise: Promise<void>) => void;
}

interface PendingOverwrite {
  field: keyof YearConfig;
  value: number | boolean;
  resolve: (confirmed: boolean) => void;
}

export function YearConfigForm({
  config,
  startingBalanceEditable,
  onConfigChange,
  onConfigApplied,
  recurringExpenses,
  onRecurringExpensesApplied,
  onPendingSave,
}: Props) {
  const t = useTranslations("Annual.config");
  const locale = useLocale();
  const router = useRouter();
  const [savingFields, setSavingFields] = useState<Set<keyof YearConfig>>(() => new Set());
  const [optimisticExtraPayments, setOptimisticExtraPayments] = useState<boolean | null>(null);
  const [recurringDraft, setRecurringDraft] = useState<RecurringExpenseInput[]>(
    recurringExpenses.map((entry) => ({ label: entry.label, amount: entry.amount }))
  );
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [recurringError, setRecurringError] = useState("");
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState<PendingOverwrite | null>(null);

  useEffect(() => {
    setRecurringDraft(recurringExpenses.map((entry) => ({ label: entry.label, amount: entry.amount })));
  }, [recurringExpenses]);
  const displayedHasExtraPayments = optimisticExtraPayments ?? config.hasExtraPayments;
  const isSavingField = (field: keyof YearConfig) => savingFields.has(field);
  const confirmFallback =
    locale === "en"
      ? {
          title: "Overwrite the months?",
          description: "This change will update all 12 months from the annual setup and overwrite manually edited fixed values.",
          cancel: "Cancel",
          action: "Apply",
        }
      : {
          title: "¿Sobrescribir los meses?",
          description: "Este cambio actualizará los 12 meses con la configuración anual y sobrescribirá los valores fijos editados manualmente.",
          cancel: "Cancelar",
          action: "Aplicar",
        };
  const confirmCopy = {
    title: t.has("confirmOverwriteTitle") ? t("confirmOverwriteTitle") : confirmFallback.title,
    description: t.has("confirmOverwriteDescription")
      ? t("confirmOverwriteDescription")
      : confirmFallback.description,
    cancel: t.has("confirmOverwriteCancel") ? t("confirmOverwriteCancel") : confirmFallback.cancel,
    action: t.has("confirmOverwriteAction") ? t("confirmOverwriteAction") : confirmFallback.action,
  };

  const requestOverwriteConfirmation = (field: keyof YearConfig, value: number | boolean) =>
    new Promise<boolean>((resolve) => {
      setPendingOverwrite({ field, value, resolve });
    });

  const settleOverwriteConfirmation = (confirmed: boolean) => {
    pendingOverwrite?.resolve(confirmed);
    setPendingOverwrite(null);
  };

  const handleSave = async (field: keyof YearConfig, value: number | boolean) => {
    if (config[field] === value) {
      return;
    }

    const confirmed = await requestOverwriteConfirmation(field, value);
    if (!confirmed) {
      return;
    }

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
        onConfigApplied?.(next);
        return next;
      });
      router.refresh();
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

  const handleSaveRecurringExpenses = async () => {
    setSavingRecurring(true);
    setRecurringError("");
    const savePromise = (async () => {
      const res = await fetch(`/api/years/${config.year}/recurring-expenses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurringExpenses: recurringDraft }),
      });
      if (!res.ok) throw new Error("Failed to update recurring expenses");
      const payload = await res.json();
      if (payload.yearData) {
        onRecurringExpensesApplied(payload.yearData);
      }
      router.refresh();
    })();

    onPendingSave?.(savePromise);
    try {
      await savePromise;
      setRecurringDialogOpen(false);
    } catch {
      setRecurringError(t("recurringExpensesError"));
    } finally {
      setSavingRecurring(false);
    }
  };

  return (
    <div className="space-y-4">
      <AlertDialog open={pendingOverwrite !== null} onOpenChange={(open) => {
        if (!open) settleOverwriteConfirmation(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settleOverwriteConfirmation(false)}>
              {confirmCopy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => settleOverwriteConfirmation(true)}>
              {confirmCopy.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="max-h-[min(72vh,44rem)] overflow-y-auto px-5 pb-5 md:px-6 md:pb-6">
        <div className="grid gap-3">
          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground">{t("sectionStartingPoint")}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("sectionStartingPointDescription")}</p>
              </div>
              <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t("overwriteBadge")}
              </span>
            </div>
            <InlineEditField
              label={t(startingBalanceEditable ? "startingBalanceEditableLabel" : "startingBalanceLabel")}
              value={config.startingBalance}
              onSave={(v) => handleSave("startingBalance", v)}
              disabled={!startingBalanceEditable}
            />
            <p className="px-2 pt-1 text-sm leading-6 text-muted-foreground">
              {t(startingBalanceEditable ? "startingBalanceEditableDescription" : "startingBalanceDescription")}
            </p>
          </section>

          <div className="grid items-stretch gap-3 lg:grid-cols-2">
            <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground">{t("sectionIncome")}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("sectionIncomeDescription")}</p>
              </div>
              <div className="divide-y divide-border/50">
                <div className="pb-4">
                  <InlineEditField
                    label={t("estimatedSalary")}
                    value={config.estimatedSalary}
                    onSave={(v) => handleSave("estimatedSalary", v)}
                  />
                </div>
                <div className="pt-4">
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
                          className="gap-x-4 gap-y-5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground">{t("sectionMonthlyAllocation")}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("sectionMonthlyAllocationDescription")}</p>
              </div>
              <div className="divide-y divide-border/50">
                <div className="pb-4">
                  <InlineEditField
                    label={t("monthlyInvestment")}
                    value={config.monthlyInvestment}
                    onSave={(v) => handleSave("monthlyInvestment", v)}
                  />
                </div>
                <div className="py-4">
                  <InlineEditField
                    label={t("monthlyHomeExpense")}
                    value={config.monthlyHomeExpense}
                    onSave={(v) => handleSave("monthlyHomeExpense", v)}
                  />
                </div>
                <div className="pt-4">
                  <InlineEditField
                    label={t("monthlyPersonalBudget")}
                    value={config.monthlyPersonalBudget}
                    onSave={(v) => handleSave("monthlyPersonalBudget", v)}
                  />
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground">{t("sectionGrowth")}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("sectionGrowthDescription")}</p>
            </div>
            <InlineEditField
              label={t("interestRate")}
              value={config.interestRate}
              onSave={(v) => handleSave("interestRate", v)}
              formatDisplayValue={(v) => `${(v * 100).toFixed(2)}%`}
              formatEditValue={(v) => String(+(v * 100).toFixed(2))}
              parseInputValue={(input) => parseFloat(input.replace(",", ".")) / 100}
            />
          </section>

          <section className="rounded-lg border border-primary/15 bg-primary/[0.035] p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">{t("sectionRecurringExpenses")}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("sectionRecurringExpensesDescription")}</p>
            </div>
          </section>

          <div>
            <RecurringExpenseTemplateEditor
              entries={recurringDraft}
              onChange={setRecurringDraft}
              disabled={savingRecurring}
              title={t("recurringExpensesTitle")}
              description={t("recurringExpensesDescription")}
            />
            {recurringError ? (
              <p role="alert" className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                {recurringError}
              </p>
            ) : null}
            <AlertDialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingRecurring}
                    className="mt-3 w-full border-primary/20 bg-primary/[0.06] text-primary hover:bg-primary/[0.1]"
                  >
                    {savingRecurring ? t("recurringExpensesSaving") : t("recurringExpensesSave")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("recurringExpensesConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("recurringExpensesConfirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={savingRecurring}>{t("recurringExpensesCancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleSaveRecurringExpenses()} disabled={savingRecurring}>
                    {savingRecurring ? t("recurringExpensesSaving") : t("recurringExpensesConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
