"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "./inline-edit-field";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
}

export function IncomeCard({ month, onUpdate }: Props) {
  const isJuneOrDec = month.month === 6 || month.month === 12;
  const isJuly = month.month === 7;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Ingresos fijos</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/50">
        <InlineEditField
          label="Nómina"
          value={month.payslip}
          onSave={(v) => onUpdate("payslip", v)}
        />
        {isJuneOrDec && (
          <InlineEditField
            label="Paga extra"
            value={month.additionalPayslip}
            onSave={(v) => onUpdate("additionalPayslip", v)}
          />
        )}
        {isJuly && (
          <InlineEditField
            label="Bonus"
            value={month.bonus}
            onSave={(v) => onUpdate("bonus", v)}
          />
        )}
        <InlineEditField
          label="Intereses cuenta"
          value={month.interests}
          onSave={(v) => onUpdate("interests", v)}
        />
        <InlineEditField
          label="Sobrante propios"
          value={month.personalRemaining}
          onSave={(v) => onUpdate("personalRemaining", v)}
        />
      </CardContent>
    </Card>
  );
}
