import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
  startingBalance: number;
}

export function KpiCards({ months, startingBalance }: Props) {
  const populated = months.filter((m) => m.totalIncome > 0 || m.totalExpenses > 0);
  const totalSavings = populated.reduce((s, m) => s + m.savings, 0);
  const avgSavings = populated.length > 0 ? totalSavings / populated.length : 0;
  const maxSavings = populated.length > 0 ? Math.max(...populated.map((m) => m.savings)) : 0;
  const endingBalance = months.length > 0 ? months[months.length - 1].endingBalance : startingBalance;

  const kpis = [
    {
      label: "Ahorro total",
      value: totalSavings,
      positive: totalSavings >= 0,
      note: "Suma de los meses con actividad",
    },
    {
      label: "Ahorro medio",
      value: avgSavings,
      positive: avgSavings >= 0,
      note: "Promedio sobre meses con flujo",
    },
    {
      label: "Mejor mes",
      value: maxSavings,
      positive: true,
      note: "Mayor ahorro mensual registrado",
    },
    {
      label: "Saldo final estimado",
      value: endingBalance,
      positive: endingBalance > startingBalance,
      note: "Cierre proyectado del ejercicio",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.label} className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
          <div className={`h-1 ${k.positive ? "bg-emerald-500" : "bg-rose-500"}`} />
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {k.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-2xl font-semibold tabular-nums ${k.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatCurrency(k.value)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{k.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
