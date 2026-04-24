"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineEditField } from "./inline-edit-field";
import { calculateMonthlyInterest } from "@/lib/calculations";
import type { MonthData, YearConfig } from "@/lib/types";

type FixedUpdateOptions = { interestsManualOverride?: boolean };

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number, options?: FixedUpdateOptions) => Promise<void>;
  showAdditionalPayslip: boolean;
  annualDefaults: Pick<YearConfig, "estimatedSalary" | "estimatedExtraPayment" | "interestRate">;
  readOnly?: boolean;
}

export function IncomeCard({ month, onUpdate, showAdditionalPayslip, annualDefaults, readOnly = false }: Props) {
  const t = useTranslations("Monthly.income");
  const tFixed = useTranslations("Monthly.fixed");
  const isJuly = month.month === 7;

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
          label={t("payslip")}
          value={month.payslip}
          onSave={(v) => onUpdate("payslip", v)}
          readOnly={readOnly}
          activateOnRowPress
          resetValue={annualDefaults.estimatedSalary}
        />
        {showAdditionalPayslip && (
          <InlineEditField
            label={t("additionalPayslip")}
            value={month.additionalPayslip}
            onSave={(v) => onUpdate("additionalPayslip", v)}
            readOnly={readOnly}
            activateOnRowPress
            resetValue={annualDefaults.estimatedExtraPayment}
          />
        )}
        {isJuly && (
          <InlineEditField
            label={t("bonus")}
            value={month.bonus}
            onSave={(v) => onUpdate("bonus", v)}
            readOnly={readOnly}
            activateOnRowPress
          />
        )}
        <InlineEditField
          label={t("interests")}
          value={month.interests}
          onSave={(v) => onUpdate("interests", v)}
          readOnly={readOnly}
          activateOnRowPress
          resetValue={calculateMonthlyInterest(month.startingBalance, annualDefaults.interestRate)}
          showReset={month.interestsManualOverride}
          onReset={(v) => onUpdate("interests", v, { interestsManualOverride: false })}
        />
        <InlineEditField
          label={t("personalRemaining")}
          value={month.personalRemaining}
          onSave={(v) => onUpdate("personalRemaining", v)}
          readOnly={readOnly}
          activateOnRowPress
        />
      </CardContent>
    </Card>
  );
}
