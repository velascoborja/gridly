"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { computeMonthChain } from "@/lib/calculations";
import { KpiCards } from "./kpi-cards";
import { BalanceChart } from "./balance-chart";
import { SavingsChart } from "./savings-chart";
import type { YearData, YearConfig } from "@/lib/types";

interface Props {
  yearData: YearData;
  startingBalanceEditable: boolean;
  readOnly?: boolean;
  onYearDataChange?: (yearData: YearData) => void;
}

export function AnnualView({
  yearData: initial,
  startingBalanceEditable,
  readOnly = false,
  onYearDataChange,
}: Props) {
  const t = useTranslations("Annual");
  const [config, setConfig] = useState<YearConfig>(initial.config);
  const [monthRows, setMonthRows] = useState(initial.months);
  const [savingConfig, setSavingConfig] = useState(false);
  const pendingSaveCountRef = useRef(0);
  const pendingSavesRef = useRef(new Set<Promise<void>>());
  const months = computeMonthChain(monthRows, config.startingBalance, config.interestRate);

  const applyExtraPaymentsToMonths = (hasExtraPayments: boolean, estimatedExtraPayment: number) => {
    setMonthRows((current) => {
      const updatedRows = current.map((month) =>
        month.month === 6 || month.month === 12
          ? { ...month, additionalPayslip: hasExtraPayments ? estimatedExtraPayment : 0 }
          : month
      );
      const nextConfig = { ...config, hasExtraPayments, estimatedExtraPayment };
      const recomputedMonths = computeMonthChain(updatedRows, nextConfig.startingBalance, nextConfig.interestRate);
      onYearDataChange?.({
        config: nextConfig,
        months: recomputedMonths,
      });
      return updatedRows;
    });
  };

  const trackPendingSave = (savePromise: Promise<void>) => {
    if (readOnly) {
      return;
    }

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
    if (readOnly) {
      return;
    }

    await waitForPendingSaves();
    window.open(`/api/years/${config.year}/export`, "_blank");
  };

  return (
    <div className="space-y-5">
      <KpiCards
        months={months}
        startingBalance={config.startingBalance}
        config={config}
        description={t("description")}
        savingConfig={readOnly ? false : savingConfig}
        startingBalanceEditable={startingBalanceEditable}
        readOnly={readOnly}
        onConfigChange={setConfig}
        onExtraPaymentsApplied={applyExtraPaymentsToMonths}
        onExport={handleExport}
        onPendingSave={trackPendingSave}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <BalanceChart months={months} />
        <SavingsChart months={months} />
      </div>
    </div>
  );
}
