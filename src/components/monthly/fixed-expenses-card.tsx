"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "./inline-edit-field";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
  onUpdate: (field: string, value: number) => Promise<void>;
}

export function FixedExpensesCard({ month, onUpdate }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Gastos fijos</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/50">
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
