"use client";

import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineEditField } from "@/components/monthly/inline-edit-field";
import type { YearConfig } from "@/lib/types";

interface Props {
  config: YearConfig;
  onConfigChange: Dispatch<SetStateAction<YearConfig>>;
  onPendingSave?: (savePromise: Promise<void>) => void;
}

export function YearConfigForm({ config, onConfigChange, onPendingSave }: Props) {
  const handleSave = async (field: keyof YearConfig, value: number) => {
    const savePromise = (async () => {
      const res = await fetch(`/api/years/${config.year}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onConfigChange((current) => ({ ...current, [field]: value }));
    })();

    onPendingSave?.(savePromise);
    await savePromise;
  };

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-base font-semibold">Configuración del año</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ajusta los supuestos base que alimentan el cálculo de los 12 meses y la proyección final.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <InlineEditField
              label="Saldo inicial del año"
              value={config.startingBalance}
              onSave={(v) => handleSave("startingBalance", v)}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <InlineEditField
              label="Salario estimado mensual"
              value={config.estimatedSalary}
              onSave={(v) => handleSave("estimatedSalary", v)}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <InlineEditField
              label="Inversión mensual"
              value={config.monthlyInvestment}
              onSave={(v) => handleSave("monthlyInvestment", v)}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <InlineEditField
              label="Gasto hogar mensual"
              value={config.monthlyHomeExpense}
              onSave={(v) => handleSave("monthlyHomeExpense", v)}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <InlineEditField
              label="Presupuesto personal"
              value={config.monthlyPersonalBudget}
              onSave={(v) => handleSave("monthlyPersonalBudget", v)}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Tipo de interés anual (%)</span>
              <button
                className="rounded-md border border-transparent px-2 py-1 text-sm font-medium tabular-nums text-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground cursor-pointer"
                onClick={() => {
                  const v = prompt("Tipo de interés anual (%)", String(config.interestRate * 100));
                  if (v === null) return;
                  const num = parseFloat(v.replace(",", "."));
                  if (!isNaN(num)) void handleSave("interestRate", num / 100);
                }}
              >
                {(config.interestRate * 100).toFixed(2)}%
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
