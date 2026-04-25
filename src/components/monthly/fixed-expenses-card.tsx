"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineEditField } from "./inline-edit-field";
import { RecurringExpensesList } from "./recurring-expenses-list";
import { sumRecurringExpenses } from "@/lib/recurring-expenses";
import { formatCurrency } from "@/lib/utils";
import type { MonthData, RecurringExpense, YearConfig } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
  onRecurringEntriesChange: (entries: RecurringExpense[]) => void;
  annualDefaults: Pick<YearConfig, "monthlyHomeExpense" | "monthlyPersonalBudget" | "monthlyInvestment">;
  readOnly?: boolean;
}

export function FixedExpensesCard({ month, onUpdate, onRecurringEntriesChange, annualDefaults, readOnly = false }: Props) {
  const t = useTranslations("Monthly.fixedExpenses");
  const tFixed = useTranslations("Monthly.fixed");
  const locale = useLocale();
  const recurringTotal = sumRecurringExpenses(month.recurringExpenses);

  return (
    <Card size="sm" className="relative border-border/70 bg-muted/40 shadow-sm shadow-black/5">
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
          <Badge variant="outline" className="h-4.5 border-border/60 bg-background/50 px-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {tFixed("badge")}
          </Badge>
        </div>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InlineEditField
          label={t("homeExpense")}
          value={month.homeExpense}
          onSave={(v) => onUpdate("homeExpense", v)}
          readOnly={readOnly}
          activateOnRowPress
          resetValue={annualDefaults.monthlyHomeExpense}
        />
        <InlineEditField
          label={t("personalExpense")}
          value={month.personalExpense}
          onSave={(v) => onUpdate("personalExpense", v)}
          readOnly={readOnly}
          activateOnRowPress
          resetValue={annualDefaults.monthlyPersonalBudget}
        />
        <InlineEditField
          label={t("investment")}
          value={month.investment}
          onSave={(v) => onUpdate("investment", v)}
          readOnly={readOnly}
          activateOnRowPress
          resetValue={annualDefaults.monthlyInvestment}
        />
        <div className="mt-3 border-t border-border/60 pt-3">
          <div className="mb-2 flex items-center justify-between gap-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("recurringExpensesTitle")}
            </p>
            <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-300">
              {formatCurrency(recurringTotal, locale)}
            </span>
          </div>
          <RecurringExpensesList
            monthId={month.id}
            entries={month.recurringExpenses}
            onEntriesChange={onRecurringEntriesChange}
            readOnly={readOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
}
