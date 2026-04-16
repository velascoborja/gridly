import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
}

function SummaryRow({ label, value, highlight, positive }: { label: string; value: number; highlight?: boolean; positive?: boolean }) {
  const color = positive !== undefined
    ? (positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")
    : "";

  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? "mt-1 border-t border-border/70 pt-3" : ""}`}>
      <span className={`text-sm ${highlight ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${color} ${highlight ? "text-base font-bold" : ""}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export function SummaryCard({ month }: Props) {
  return (
    <Card className="border-border/80 bg-gradient-to-b from-background to-muted/30 shadow-md shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Resumen del mes</CardTitle>
        <p className="text-xs text-muted-foreground">
          Lectura final del mes con saldo, gasto y ahorro neto.
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        <SummaryRow label="Saldo inicial" value={month.startingBalance} />
        <SummaryRow label="Total ingresos" value={month.totalIncome} />
        <SummaryRow label="Total gastos" value={month.totalExpenses} />
        <SummaryRow
          label="Ahorro"
          value={month.savings}
          positive={month.savings >= 0}
        />
        <SummaryRow
          label="Saldo final"
          value={month.endingBalance}
          highlight
        />
      </CardContent>
    </Card>
  );
}
