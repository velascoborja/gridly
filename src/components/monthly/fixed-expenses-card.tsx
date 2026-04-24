"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineEditField } from "./inline-edit-field";
import type { MonthData, YearConfig } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
  annualDefaults: Pick<YearConfig, "monthlyHomeExpense" | "monthlyPersonalBudget" | "monthlyInvestment">;
  readOnly?: boolean;
}

export function FixedExpensesCard({ month, onUpdate, annualDefaults, readOnly = false }: Props) {
  const t = useTranslations("Monthly.fixedExpenses");
  const tFixed = useTranslations("Monthly.fixed");

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
      </CardContent>
    </Card>
  );
}
