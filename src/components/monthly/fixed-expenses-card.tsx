"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "./inline-edit-field";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
}

export function FixedExpensesCard({ month, onUpdate }: Props) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Gastos fijos</CardTitle>
        <CardDescription>
          Conceptos recurrentes del mes que alimentan el cálculo del ahorro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <InlineEditField
          label="Casa (mes siguiente)"
          value={month.homeExpense}
          onSave={(v) => onUpdate("homeExpense", v)}
        />
        <InlineEditField
          label="Gastos propios"
          value={month.personalExpense}
          onSave={(v) => onUpdate("personalExpense", v)}
        />
        <InlineEditField
          label="Inversión"
          value={month.investment}
          onSave={(v) => onUpdate("investment", v)}
        />
      </CardContent>
    </Card>
  );
}
