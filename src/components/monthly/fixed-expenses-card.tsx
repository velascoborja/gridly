"use client";

import { useLocale, useTranslations } from "next-intl";
import { House, Repeat, TrendingUp, Wallet } from "lucide-react";
import { InlineEditField } from "./inline-edit-field";
import { RecurringExpensesList } from "./recurring-expenses-list";
import { sumRecurringExpenses } from "@/lib/recurring-expenses";
import { formatCurrency } from "@/lib/utils";
import type { MonthData, RecurringExpense, Tag, YearConfig } from "@/lib/types";

type FixedUpdateOptions = Partial<Pick<
  MonthData,
  "homeExpenseManualOverride" | "personalExpenseManualOverride" | "investmentManualOverride"
>>;

interface Props {
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<Tag>;
  month: MonthData;
  onUpdate: (field: string, value: number, options?: FixedUpdateOptions) => Promise<void>;
  onRecurringEntriesChange: (entries: RecurringExpense[]) => void;
  annualDefaults: Pick<YearConfig, "monthlyHomeExpense" | "monthlyPersonalBudget" | "monthlyInvestment">;
  readOnly?: boolean;
  highlightId?: string | null;
}

export function FixedExpensesCard({ tags, onCreateTag, month, onUpdate, onRecurringEntriesChange, annualDefaults, readOnly = false, highlightId = null }: Props) {
  const t = useTranslations("Monthly.fixedExpenses");
  const locale = useLocale();
  const recurringTotal = sumRecurringExpenses(month.recurringExpenses);

  return (
    <div className="flex min-w-0 flex-col gap-1 p-4">
      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {t("title")}
      </p>
      <InlineEditField
        label={t("homeExpense")}
        icon={<House />}
        value={month.homeExpense}
        onSave={(v) => onUpdate("homeExpense", v)}
        readOnly={readOnly}
        activateOnRowPress
        resetValue={annualDefaults.monthlyHomeExpense}
        showReset={month.homeExpenseManualOverride}
        onReset={(v) => onUpdate("homeExpense", v, { homeExpenseManualOverride: false })}
      />
      <InlineEditField
        label={t("personalExpense")}
        icon={<Wallet />}
        value={month.personalExpense}
        onSave={(v) => onUpdate("personalExpense", v)}
        readOnly={readOnly}
        activateOnRowPress
        resetValue={annualDefaults.monthlyPersonalBudget}
        showReset={month.personalExpenseManualOverride}
        onReset={(v) => onUpdate("personalExpense", v, { personalExpenseManualOverride: false })}
      />
      <p className="pb-2 pl-11.5 pr-2 text-xs text-muted-foreground tabular-nums">
        {t("personalNet", { amount: formatCurrency(month.personalExpense - month.personalRemaining, locale) })}
      </p>
      <InlineEditField
        label={t("investment")}
        icon={<TrendingUp />}
        value={month.investment}
        onSave={(v) => onUpdate("investment", v)}
        readOnly={readOnly}
        activateOnRowPress
        resetValue={annualDefaults.monthlyInvestment}
        showReset={month.investmentManualOverride}
        onReset={(v) => onUpdate("investment", v, { investmentManualOverride: false })}
      />
      <div className="mt-3 border-t border-[#533afd]/10 pt-3 dark:border-[#8b7cff]/15">
        <div className="mb-2 flex items-center justify-between gap-3 px-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <Repeat aria-hidden="true" className="size-3" />
            {t("recurringExpensesTitle")}
          </p>
          <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-300">
            {formatCurrency(recurringTotal, locale)}
          </span>
        </div>
        <RecurringExpensesList
          tags={tags}
          onCreateTag={onCreateTag}
          monthId={month.id}
          entries={month.recurringExpenses}
          onEntriesChange={onRecurringEntriesChange}
          readOnly={readOnly}
          highlightId={highlightId}
        />
      </div>
    </div>
  );
}
