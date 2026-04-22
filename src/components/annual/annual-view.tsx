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
  const months = computeMonthChain(initial.months, config.startingBalance, config.interestRate);

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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#1c1e54] via-[#0d253d] to-slate-950 text-white shadow-[0_30px_45px_-30px_rgba(50,50,93,0.45),0_18px_36px_-18px_rgba(0,0,0,0.22)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-light tracking-[-0.04em] text-white">
                {t("yearLabel", { year: config.year })}
              </h1>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
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
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={savingConfig}
              className="w-fit border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              {savingConfig ? t("saving") : t("exportExcel")}
            </Button>
            <p className="max-w-sm text-xs leading-5 text-white/55 sm:max-w-md lg:text-right">
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
