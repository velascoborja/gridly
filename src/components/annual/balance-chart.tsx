"use client";

import { useTranslations, useLocale } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
}

function getNiceStep(value: number) {
  if (value <= 0) return 1;

  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function getBalanceYAxisDomain(values: number[]): [number, number] {
  const finiteValues = values.filter(Number.isFinite);

  if (finiteValues.length === 0) return [0, 1];

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const range = max - min;
  const padding = Math.max(range * 0.12, Math.abs(max || min) * 0.04, 1000);
  const paddedMin = min - padding;
  const paddedMax = max + padding;
  const step = getNiceStep((paddedMax - paddedMin) / 4);
  const lowerBound = Math.floor(paddedMin / step) * step;
  const upperBound = Math.ceil(paddedMax / step) * step;

  return [min >= 0 ? Math.max(0, lowerBound) : lowerBound, upperBound];
}

export function BalanceChart({ months }: Props) {
  const t = useTranslations("Annual.charts");
  const locale = useLocale();

  const data = months.map((m) => ({
    name: formatMonthName(m.month, locale, "short"),
    saldo: m.endingBalance,
  }));
  const yAxisDomain = getBalanceYAxisDomain(data.map((m) => m.saldo));

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-light tracking-[-0.02em]">{t("balanceTitle")}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{t("balanceDescription")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
              <YAxis
                domain={yAxisDomain}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                width={40}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v), locale)} labelClassName="font-medium" />
              <Line
                name={t("balanceLabel")}
                type="monotone"
                dataKey="saldo"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                className="stroke-primary"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
