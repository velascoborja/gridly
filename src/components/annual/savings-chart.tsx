"use client";

import { useTranslations, useLocale } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
  year: number;
}

interface SavingsBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: {
    ahorro?: number;
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

function SavingsBarShape({ x, y, width, height, fill, payload }: SavingsBarShapeProps) {
  if (x === undefined || y === undefined || width === undefined || height === undefined) return null;

  const radius = 3;
  const barFill = payload?.ahorro !== undefined
    ? payload.ahorro < 0
      ? "var(--color-destructive)"
      : "hsl(142 76% 36%)"
    : fill ?? "var(--color-primary)";
  const normalizedY = height < 0 ? y + height : y;
  const normalizedHeight = Math.abs(height);

  if (!payload?.isCurrentMonth) {
    return <rect x={x} y={normalizedY} width={width} height={normalizedHeight} rx={radius} ry={radius} fill={barFill} />;
  }

  return (
    <g>
      <rect
        x={x - 3}
        y={normalizedY - 3}
        width={width + 6}
        height={normalizedHeight + 6}
        rx={radius + 2}
        ry={radius + 2}
        fill="var(--color-primary)"
        opacity={0.1}
      />
      <rect
        x={x}
        y={normalizedY}
        width={width}
        height={normalizedHeight}
        rx={radius}
        ry={radius}
        fill={barFill}
        stroke="var(--color-primary)"
        strokeWidth={2}
      />
    </g>
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

export function isCurrentSavingsChartMonth(year: number, month: number, now = new Date()) {
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

export function SavingsChart({ months, year }: Props) {
  const t = useTranslations("Annual.charts");
  const locale = useLocale();
  const now = new Date();

  const data = months.map((m) => ({
    name: formatMonthName(m.month, locale, "short"),
    ahorro: m.savings,
    isCurrentMonth: isCurrentSavingsChartMonth(year, m.month, now),
  }));
  const currentMonthName = data.find((m) => m.isCurrentMonth)?.name;

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-light tracking-[-0.02em]">{t("savingsTitle")}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{t("savingsDescription")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 6, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
              <XAxis
                dataKey="name"
                height={34}
                tick={(props) => <CurrentMonthAxisTick {...props} currentMonthName={currentMonthName} />}
              />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v), locale)}
                labelFormatter={(label, payload) => {
                  const entry = payload?.[0]?.payload as { isCurrentMonth?: boolean } | undefined;
                  return entry?.isCurrentMonth ? `${label} · ${t("currentMonthLabel")}` : label;
                }}
              />
              <Bar name={t("savingsLabel")} dataKey="ahorro" radius={[3, 3, 0, 0]} shape={<SavingsBarShape />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
