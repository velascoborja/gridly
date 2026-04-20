"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "./inline-edit-field";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
}

export function IncomeCard({ month, onUpdate }: Props) {
  const t = useTranslations("Monthly.income");
  const isJuneOrDec = month.month === 6 || month.month === 12;
  const isJuly = month.month === 7;

  return (
    <Card size="sm" className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InlineEditField
          label={t("payslip")}
          value={month.payslip}
          onSave={(v) => onUpdate("payslip", v)}
        />
        {isJuneOrDec && (
          <InlineEditField
            label={t("additionalPayslip")}
            value={month.additionalPayslip}
            onSave={(v) => onUpdate("additionalPayslip", v)}
          />
        )}
        {isJuly && (
          <InlineEditField
            label={t("bonus")}
            value={month.bonus}
            onSave={(v) => onUpdate("bonus", v)}
          />
        )}
        <InlineEditField
          label={t("interests")}
          value={month.interests}
          onSave={(v) => onUpdate("interests", v)}
        />
        <InlineEditField
          label={t("personalRemaining")}
          value={month.personalRemaining}
          onSave={(v) => onUpdate("personalRemaining", v)}
        />
      </CardContent>
    </Card>
  );
}
