import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AnnualView } from "@/components/annual/annual-view";
import { PublicDemoShell } from "@/components/demo/public-demo-shell";
import { NavSelectors } from "@/components/layout/nav-selectors";
import { routing } from "@/i18n/routing";
import { DEMO_YEAR, getDemoYearData } from "@/lib/demo/demo-year";

function parseRouteInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    notFound();
  }

  return Number.parseInt(value, 10);
}

export default async function DemoSummaryPage({
  params,
}: {
  params: Promise<{ locale: string; year: string }>;
}) {
  const { locale, year: yearParam } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const year = parseRouteInteger(yearParam);
  if (year !== DEMO_YEAR) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Demo.summary" });

  return (
    <PublicDemoShell
      eyebrow={t("eyebrow")}
      title={t("title", { year })}
      description={t("description", { year })}
    >
      <NavSelectors
        currentYear={year}
        currentMonth={null}
        view="summary"
        years={[DEMO_YEAR]}
        monthPathPrefix="/demo"
        summaryPathPrefix="/demo"
        hideCreateYear
      />
      <AnnualView
        yearData={getDemoYearData()}
        startingBalanceEditable={false}
        readOnly
      />
    </PublicDemoShell>
  );
}
