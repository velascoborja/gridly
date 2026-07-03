"use client";

import { useTranslations, useLocale } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
  year: number;
}

interface BalanceDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    isCurrentMonth?: boolean;
  };
}

interface CurrentMonthAxisTickProps {
  x?: string | number;
  y?: string | number;
  payload?: {
    value?: string;
  };
  currentMonthName?: string;
}

function BalanceDot({ cx, cy, payload }: BalanceDotProps) {
  if (cx === undefined || cy === undefined) return null;

  if (payload?.isCurrentMonth) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={9} fill="var(--color-primary)" opacity={0.14}>
          <animate attributeName="r" values="7;14;7" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0;0.28" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={6} fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-primary)" />
      </g>
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="var(--color-card)"
      stroke="var(--color-primary)"
      strokeWidth={1.5}
    />
  );
}

function CurrentMonthAxisTick({ x, y, payload, currentMonthName }: CurrentMonthAxisTickProps) {
  if (x === undefined || y === undefined || !payload?.value) return null;

  const isCurrentMonth = payload.value === currentMonthName;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill={isCurrentMonth ? "var(--color-primary)" : "currentColor"}
        fontSize={11}
        fontWeight={isCurrentMonth ? 600 : 400}
      >
        {payload.value}
      </text>
      {isCurrentMonth ? <circle cx={0} cy={20} r={2.5} fill="var(--color-primary)" /> : null}
    </g>
  );
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

export function isCurrentChartMonth(year: number, month: number, now = new Date()) {
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

export function BalanceChart({ months, year }: Props) {
  const t = useTranslations("Annual.charts");
  const locale = useLocale();
  const now = new Date();

  const data = months.map((m) => ({
    name: formatMonthName(m.month, locale, "short"),
    saldo: m.endingBalance,
    isCurrentMonth: isCurrentChartMonth(year, m.month, now),
  }));
  const yAxisDomain = getBalanceYAxisDomain(data.map((m) => m.saldo));
  const currentMonthName = data.find((m) => m.isCurrentMonth)?.name;

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-light tracking-[-0.02em]">{t("balanceTitle")}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{t("balanceDescription")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
              <XAxis
                dataKey="name"
                className="text-xs"
                height={34}
                tick={(props) => <CurrentMonthAxisTick {...props} currentMonthName={currentMonthName} />}
              />
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
                dot={<BalanceDot />}
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
