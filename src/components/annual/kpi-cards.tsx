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
    { label: "Ahorro total", value: totalSavings, positive: totalSavings >= 0 },
    { label: "Ahorro medio", value: avgSavings, positive: avgSavings >= 0 },
    { label: "Mejor mes", value: maxSavings, positive: true },
    { label: "Saldo final estimado", value: endingBalance, positive: endingBalance > startingBalance },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <Card key={k.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-bold tabular-nums ${k.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(k.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
