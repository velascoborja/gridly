"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { avgAdditionalEntriesPerMonth } from "@/lib/additional-entries";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
}

export function AdditionalEntriesAverages({ months }: Props) {
  const t = useTranslations("Annual.additionalAverages");
  const locale = useLocale();
  const avgExpenses = avgAdditionalEntriesPerMonth(months, "expense");
  const avgIncome = avgAdditionalEntriesPerMonth(months, "income");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/70 bg-card/92 shadow-sm">
        <CardContent className="px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                  <ArrowDownRight className="h-4.5 w-4.5" />
                </div>
                <p className="text-base font-medium text-muted-foreground">
                  {t("expensesLabel")}
                </p>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground/70">
                {t("expensesNote")}
              </p>
            </div>
            <div className="pl-4 text-right">
              <p className="finance-number text-3xl font-light tracking-[-0.04em] text-rose-600 dark:text-rose-400 md:text-4xl">
                {formatCurrency(avgExpenses, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/92 shadow-sm">
        <CardContent className="px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <ArrowUpRight className="h-4.5 w-4.5" />
                </div>
                <p className="text-base font-medium text-muted-foreground">
                  {t("incomeLabel")}
                </p>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground/70">
                {t("incomeNote")}
              </p>
            </div>
            <div className="pl-4 text-right">
              <p className="finance-number text-3xl font-light tracking-[-0.04em] text-emerald-600 dark:text-emerald-400 md:text-4xl">
                {formatCurrency(avgIncome, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
