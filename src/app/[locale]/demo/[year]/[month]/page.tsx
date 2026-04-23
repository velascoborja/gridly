import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PublicDemoShell } from "@/components/demo/public-demo-shell";
import { NavSelectors } from "@/components/layout/nav-selectors";
import { MonthOverview } from "@/components/monthly/month-overview";
import { routing } from "@/i18n/routing";
import { getDemoYearData, DEMO_YEAR } from "@/lib/demo/demo-year";
import { formatMonthName } from "@/lib/utils";

function parseRouteInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    notFound();
  }

  return Number.parseInt(value, 10);
}

export default async function DemoMonthPage({
  params,
}: {
  params: Promise<{ locale: string; year: string; month: string }>;
}) {
  const { locale, year: yearParam, month: monthParam } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const year = parseRouteInteger(yearParam);
  const month = parseRouteInteger(monthParam);

  if (year !== DEMO_YEAR || month < 1 || month > 12) {
    notFound();
  }

  const monthName = formatMonthName(month, locale);
  const t = await getTranslations({ locale, namespace: "Demo.month" });

  return (
    <PublicDemoShell
      eyebrow={t("eyebrow")}
      title={`${monthName} ${year}`}
      description={t("description", { month: monthName, year })}
    >
      <NavSelectors
        currentYear={year}
        currentMonth={month}
        view="overview"
        years={[DEMO_YEAR]}
        monthPathPrefix="/demo"
        summaryPathPrefix="/demo"
        hideCreateYear
        hideYearSelector
      />
      <MonthOverview
        yearData={getDemoYearData()}
        monthNumber={month}
        readOnly
        monthPathPrefix={`/demo/${year}`}
        currentMonthPathPrefix={`/demo/${year}`}
      />
    </PublicDemoShell>
  );
}
