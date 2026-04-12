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
    <div className={`flex justify-between items-center py-2 ${highlight ? "border-t border-border mt-1 pt-3" : ""}`}>
      <span className={`text-sm ${highlight ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${color} ${highlight ? "text-base font-bold" : ""}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export function SummaryCard({ month }: Props) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumen del mes</CardTitle>
      </CardHeader>
      <CardContent>
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
