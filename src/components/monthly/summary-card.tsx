import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  month: MonthData;
}

function SummaryRow({
  label,
  value,
  locale,
  highlight,
  emphasize,
  positive,
}: {
  label: string;
  value: number;
  locale: string;
  highlight?: boolean;
  emphasize?: boolean;
  positive?: boolean;
}) {
  const color = positive !== undefined
    ? (positive ? "finance-number-positive" : "finance-number-negative")
    : "";

  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? "mt-1 border-t border-border/70 pt-3" : ""}`}>
      <span className={`text-sm ${highlight ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm finance-number ${color} ${emphasize ? "text-base font-semibold text-foreground" : "font-medium"} ${highlight && !emphasize ? "text-base font-semibold" : ""}`}>
        {formatCurrency(value, locale)}
      </span>
    </div>
  );
}

export function SummaryCard({ month }: Props) {
  const t = useTranslations("Monthly.summary");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        <SummaryRow label={t("startingBalance")} value={month.startingBalance} locale={locale} />
        <SummaryRow label={t("totalIncome")} value={month.totalIncome} locale={locale} />
        <SummaryRow label={t("totalExpenses")} value={month.totalExpenses} locale={locale} />
        <SummaryRow
          label={t("netSavings")}
          value={month.savings}
          locale={locale}
          positive={month.savings >= 0}
        />
        <SummaryRow
          label={t("endingBalance")}
          value={month.endingBalance}
          locale={locale}
          highlight
          emphasize
        />
      </CardContent>
    </Card>
  );
}
