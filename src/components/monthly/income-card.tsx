"use client";

import { useTranslations } from "next-intl";
import { BriefcaseBusiness, Gift, Percent, Undo2 } from "lucide-react";
import { InlineEditField } from "./inline-edit-field";
import { calculateMonthlyInterest } from "@/lib/calculations";
import type { MonthData, YearConfig } from "@/lib/types";

type FixedUpdateOptions = Partial<Pick<
  MonthData,
  "payslipManualOverride" | "additionalPayslipManualOverride" | "interestsManualOverride"
>>;

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number, options?: FixedUpdateOptions) => Promise<void>;
  showAdditionalPayslip: boolean;
  annualDefaults: Pick<YearConfig, "estimatedSalary" | "estimatedExtraPayment" | "interestRate">;
  readOnly?: boolean;
}

export function IncomeCard({ month, onUpdate, showAdditionalPayslip, annualDefaults, readOnly = false }: Props) {
  const t = useTranslations("Monthly.income");
  const tCommon = useTranslations("Common");

  return (
    <div className="flex min-w-0 flex-col gap-1 p-4">
      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {t("title")}
      </p>
      <InlineEditField
        label={t("payslip")}
        icon={<BriefcaseBusiness />}
        value={month.payslip}
        onSave={(v) => onUpdate("payslip", v)}
        readOnly={readOnly}
        activateOnRowPress
        resetValue={annualDefaults.estimatedSalary}
        showReset={month.payslipManualOverride}
        onReset={(v) => onUpdate("payslip", v, { payslipManualOverride: false })}
      />
      {showAdditionalPayslip && (
        <InlineEditField
          label={t("additionalPayslip")}
          icon={<Gift />}
          value={month.additionalPayslip}
          onSave={(v) => onUpdate("additionalPayslip", v)}
          readOnly={readOnly}
          activateOnRowPress
          resetValue={annualDefaults.estimatedExtraPayment}
          showReset={month.additionalPayslipManualOverride}
          onReset={(v) => onUpdate("additionalPayslip", v, { additionalPayslipManualOverride: false })}
        />
      )}
      <InlineEditField
        label={t("interests")}
        icon={<Percent />}
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
        icon={<Undo2 />}
        value={month.personalRemaining}
        onSave={(v) => onUpdate("personalRemaining", v)}
        readOnly={readOnly}
        activateOnRowPress
        resetValue={0}
        showReset={Math.abs(month.personalRemaining) > 0.005}
        resetLabel={tCommon("resetToZero")}
      />
      <p className="pl-11.5 pr-2 text-xs text-muted-foreground">{t("personalRemainingHint")}</p>
    </div>
  );
}
