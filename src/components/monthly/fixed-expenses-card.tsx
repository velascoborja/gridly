"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "./inline-edit-field";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
}

export function FixedExpensesCard({ month, onUpdate }: Props) {
  const t = useTranslations("Monthly.fixedExpenses");

  return (
    <Card size="sm" className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InlineEditField
          label={t("homeExpense")}
          value={month.homeExpense}
          onSave={(v) => onUpdate("homeExpense", v)}
        />
        <InlineEditField
          label={t("personalExpense")}
          value={month.personalExpense}
          onSave={(v) => onUpdate("personalExpense", v)}
        />
        <InlineEditField
          label={t("investment")}
          value={month.investment}
          onSave={(v) => onUpdate("investment", v)}
        />
      </CardContent>
    </Card>
  );
}
