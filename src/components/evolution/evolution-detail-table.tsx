"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvolutionYearMetric } from "@/lib/evolution";
import type { HistoricalYear } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  metrics: EvolutionYearMetric[];
  historicalYears: HistoricalYear[];
  onEditHistoricalYear: (row: HistoricalYear) => void;
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatOptionalCurrency(value: number | null, locale: string, fallback: string) {
  return value === null ? fallback : formatCurrency(value, locale);
}

export function EvolutionDetailTable({ metrics, historicalYears, onEditHistoricalYear }: Props) {
  const t = useTranslations("Evolution.table");
  const deleteT = useTranslations("Evolution.deleteHistoricalYear");
  const locale = useLocale();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const historicalByYear = new Map(historicalYears.map((row) => [row.year, row]));

  const deleteHistoricalYear = async (row: HistoricalYear) => {
    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/historical-years/${row.id}`, { method: "DELETE" });
      if (response.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-light tracking-[-0.02em]">{t("title")}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-[1040px] w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium text-center">{t("sourceLabel")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("year")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("startingBalance")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("finalBalance")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("savedAmount")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("investedAmount")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("accumulatedInvested")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("totalIncome")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("totalExpenses")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("savingsRate")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("interestEarned")}</th>
                <th className="px-3 py-3 font-medium text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {metrics.map((metric) => {
                const historicalYear = metric.source === "historical" ? historicalByYear.get(metric.year) : undefined;

                return (
                  <tr key={`${metric.source}-${metric.year}`} className="bg-card/70">
                    <td className="px-3 py-3 text-center text-muted-foreground">{t(`source.${metric.source}`)}</td>
                    <td className="px-3 py-3 text-center font-medium text-foreground">{metric.year}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatCurrency(metric.startingBalance, locale)}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatCurrency(metric.finalBalance, locale)}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatCurrency(metric.savedAmount, locale)}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatCurrency(metric.investedAmount, locale)}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatCurrency(metric.accumulatedInvested, locale)}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatOptionalCurrency(metric.totalIncome, locale, t("notAvailable"))}</td>
                    <td className="px-3 py-3 text-center finance-number">{formatOptionalCurrency(metric.totalExpenses, locale, t("notAvailable"))}</td>
                    <td className="px-3 py-3 text-center finance-number">
                      {metric.savingsRate === null ? t("notAvailable") : formatPercent(metric.savingsRate, locale)}
                    </td>
                    <td className="px-3 py-3 text-center finance-number">{formatCurrency(metric.interestsEarned, locale)}</td>
                    <td className="px-3 py-3 text-center">
                      {historicalYear ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEditHistoricalYear(historicalYear)}
                            aria-label={t("editHistoricalYear", { year: metric.year })}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={deletingId === historicalYear.id}
                                  aria-label={t("deleteHistoricalYear", { year: metric.year })}
                                />
                              }
                            >
                              <Trash2 className="size-4" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{deleteT("title")}</AlertDialogTitle>
                                <AlertDialogDescription>{deleteT("description", { year: metric.year })}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deletingId === historicalYear.id}>{deleteT("cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={deletingId === historicalYear.id}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    void deleteHistoricalYear(historicalYear);
                                  }}
                                >
                                  {deleteT("confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
