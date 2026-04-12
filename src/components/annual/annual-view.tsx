"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCards } from "./kpi-cards";
import { BalanceChart } from "./balance-chart";
import { SavingsChart } from "./savings-chart";
import { YearConfigForm } from "./year-config-form";
import type { YearData, YearConfig } from "@/lib/types";
import { Download, RefreshCw } from "lucide-react";

interface Props {
  yearData: YearData;
}

export function AnnualView({ yearData: initial }: Props) {
  const [config, setConfig] = useState<YearConfig>(initial.config);
  const [prefilling, setPrefilling] = useState(false);

  const handlePrefill = async () => {
    if (!confirm("Esto sobreescribirá todos los meses con los valores estimados de la configuración. ¿Continuar?")) return;
    setPrefilling(true);
    await fetch(`/api/years/${config.year}/prefill`, { method: "POST" });
    setPrefilling(false);
    window.location.reload();
  };

  const handleExport = () => {
    window.open(`/api/years/${config.year}/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handlePrefill} disabled={prefilling}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {prefilling ? "Rellenando…" : "Rellenar estimaciones"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* KPIs */}
      <KpiCards months={initial.months} startingBalance={config.startingBalance} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <BalanceChart months={initial.months} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <SavingsChart months={initial.months} />
          </CardContent>
        </Card>
      </div>

      {/* Config */}
      <YearConfigForm config={config} onConfigChange={setConfig} />
    </div>
  );
}
