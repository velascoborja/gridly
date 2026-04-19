"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
}

export function AnnualView({ yearData: initial }: Props) {
  const t = useTranslations("Annual");
  const [config, setConfig] = useState<YearConfig>(initial.config);
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
              {t("title")}
            </div>
            <div className="mt-4 flex items-center gap-3">
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

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
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
            <p className="text-xs leading-5 text-slate-400">
              {savingConfig
                ? t("savingDescription")
                : t("exportDescription")}
            </p>
          </div>
        </div>
      </section>

      <KpiCards months={initial.months} startingBalance={config.startingBalance} />

      <div className="grid gap-6 md:grid-cols-2">
        <BalanceChart months={initial.months} />
        <SavingsChart months={initial.months} />
      </div>
    </div>
  );
}
