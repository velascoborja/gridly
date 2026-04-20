"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { computeMonthChain } from "@/lib/calculations";
import { KpiCards } from "./kpi-cards";
import { BalanceChart } from "./balance-chart";
import { SavingsChart } from "./savings-chart";
import { YearConfigForm } from "./year-config-form";
import type { YearData, YearConfig } from "@/lib/types";
import { Download, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  yearData: YearData;
  startingBalanceEditable: boolean;
}

export function AnnualView({ yearData: initial, startingBalanceEditable }: Props) {
  const t = useTranslations("Annual");
  const [config, setConfig] = useState<YearConfig>(initial.config);
  const [savingConfig, setSavingConfig] = useState(false);
  const pendingSaveCountRef = useRef(0);
  const pendingSavesRef = useRef(new Set<Promise<void>>());
  const months = computeMonthChain(initial.months, config.startingBalance);

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

  const handleExport = async () => {
    await waitForPendingSaves();
    window.open(`/api/years/${config.year}/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-950/20">
        <div className="grid gap-6 px-6 py-7 md:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {t("yearLabel", { year: config.year })}
              </h1>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">{t("configButton")}</span>
                    </Button>
                  }
                />
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("configTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("configDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <YearConfigForm
                    config={config}
                    startingBalanceEditable={startingBalanceEditable}
                    onConfigChange={setConfig}
                    onPendingSave={trackPendingSave}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 lg:items-end">
            <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={savingConfig}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                {savingConfig ? t("saving") : t("exportExcel")}
              </Button>
            </div>
            <p className="text-center text-xs leading-5 text-slate-400 lg:text-right">
              {savingConfig
                ? t("savingDescription")
                : t("exportDescription")}
            </p>
          </div>
        </div>
      </section>

      <KpiCards months={months} startingBalance={config.startingBalance} />

      <div className="grid gap-6 md:grid-cols-2">
        <BalanceChart months={months} />
        <SavingsChart months={months} />
      </div>
    </div>
  );
}
