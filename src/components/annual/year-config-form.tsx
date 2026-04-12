"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "@/components/monthly/inline-edit-field";
import type { YearConfig } from "@/lib/types";

interface Props {
  config: YearConfig;
  onConfigChange: (updated: YearConfig) => void;
}

export function YearConfigForm({ config, onConfigChange }: Props) {
  const handleSave = async (field: keyof YearConfig, value: number) => {
    const res = await fetch(`/api/years/${config.year}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error("Failed to update");
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Configuración del año</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/50">
        <InlineEditField
          label="Saldo inicial del año"
          value={config.startingBalance}
          onSave={(v) => handleSave("startingBalance", v)}
        />
        <InlineEditField
          label="Salario estimado mensual"
          value={config.estimatedSalary}
          onSave={(v) => handleSave("estimatedSalary", v)}
        />
        <InlineEditField
          label="Inversión mensual"
          value={config.monthlyInvestment}
          onSave={(v) => handleSave("monthlyInvestment", v)}
        />
        <InlineEditField
          label="Gasto hogar mensual"
          value={config.monthlyHomeExpense}
          onSave={(v) => handleSave("monthlyHomeExpense", v)}
        />
        <InlineEditField
          label="Presupuesto personal"
          value={config.monthlyPersonalBudget}
          onSave={(v) => handleSave("monthlyPersonalBudget", v)}
        />
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-muted-foreground">Tipo de interés anual (%)</span>
          <button
            className="text-sm font-medium tabular-nums hover:text-primary hover:underline cursor-pointer"
            onClick={() => {
              const v = prompt("Tipo de interés anual (%)", String(config.interestRate * 100));
              if (v === null) return;
              const num = parseFloat(v.replace(",", "."));
              if (!isNaN(num)) handleSave("interestRate", num / 100);
            }}
          >
            {(config.interestRate * 100).toFixed(2)}%
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
