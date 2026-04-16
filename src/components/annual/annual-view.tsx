"use client";

import { useRef, useState } from "react";
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
  const [savingConfig, setSavingConfig] = useState(false);
  const pendingSaveCountRef = useRef(0);
  const pendingSavesRef = useRef(new Set<Promise<void>>());

  const trackPendingSave = (savePromise: Promise<void>) => {
    pendingSaveCountRef.current += 1;
    pendingSavesRef.current.add(savePromise);
    setSavingConfig(true);

    void savePromise.finally(() => {
      pendingSavesRef.current.delete(savePromise);
      pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1);
      if (pendingSaveCountRef.current === 0) {
        setSavingConfig(false);
      }
    });
  };

  const waitForPendingSaves = async () => {
    while (pendingSavesRef.current.size > 0) {
      await Promise.allSettled(Array.from(pendingSavesRef.current));
    }
  };

  const handlePrefill = async () => {
    if (!confirm("Esto sobreescribirá todos los meses con los valores estimados de la configuración. ¿Continuar?")) return;
    setPrefilling(true);
    try {
      await waitForPendingSaves();
      await fetch(`/api/years/${config.year}/prefill`, { method: "POST" });
      window.location.reload();
    } finally {
      setPrefilling(false);
    }
  };

  const handleExport = async () => {
    await waitForPendingSaves();
    window.open(`/api/years/${config.year}/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-950/20">
        <div className="grid gap-6 px-6 py-7 md:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
              Resumen anual
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ejercicio {config.year}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Panorama del año con métricas clave, evolución del saldo y controles de configuración en una sola vista.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrefill}
                disabled={prefilling || savingConfig}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {prefilling ? "Rellenando…" : savingConfig ? "Guardando…" : "Rellenar estimaciones"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={savingConfig}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                {savingConfig ? "Guardando…" : "Exportar Excel"}
              </Button>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              {savingConfig
                ? "Se están guardando cambios en la configuración antes de lanzar acciones del año."
                : "El relleno sobrescribe los 12 meses con la configuración actual del año."}
            </p>
          </div>
        </div>
      </section>

      <KpiCards months={initial.months} startingBalance={config.startingBalance} />

      <div className="grid gap-6 md:grid-cols-2">
        <BalanceChart months={initial.months} />
        <SavingsChart months={initial.months} />
      </div>

      <YearConfigForm config={config} onConfigChange={setConfig} onPendingSave={trackPendingSave} />
    </div>
  );
}
