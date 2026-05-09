import { auth } from "@/auth";
import { PublicHero } from "@/components/landing/public-hero";
import { getAppRedirectPath } from "@/lib/server/year-data";
import { redirect } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://appgridly.com";

const LOCALE_META = {
  es: {
    title: "Gridly — Planificador Financiero Personal",
    description:
      "Controla ingresos, gastos y ahorro mes a mes. Gridly encadena tus saldos mensuales en un ejercicio anual claro, con pagas extra, resumen y exportación a Excel.",
    keywords: [
      "planificador financiero",
      "control de gastos",
      "seguimiento de ingresos",
      "ahorro mensual",
      "nómina pagas extra",
    ],
  },
  en: {
    title: "Gridly — Personal Finance Tracker",
    description:
      "Track income, expenses and savings month by month. Gridly chains your monthly balances into a clear annual picture, with extra pay periods, yearly summary and Excel export.",
    keywords: [
      "personal finance tracker",
      "monthly budget planner",
      "income expense tracker",
      "salary tracker",
      "savings tracker",
    ],
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_META[locale as keyof typeof LOCALE_META] ?? LOCALE_META.en;

  return {
    title: meta.title,
    description: meta.description,
    keywords: [...meta.keywords],
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE_URL}/${locale}`,
    },
    twitter: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ accountDeleted?: string | string[]; authError?: string | string[] }>;
}) {
  const { locale } = await params;
  const { accountDeleted, authError } = await searchParams;
  const accountDeletedConfirmed = Array.isArray(accountDeleted)
    ? accountDeleted.includes("1")
    : accountDeleted === "1";
  const authErrorDetected = Array.isArray(authError) ? authError.includes("1") : authError === "1";
  const session = await auth();
  const currentYear = new Date().getFullYear();

  if (session?.user?.id) {
    const path = await getAppRedirectPath(session.user.id, currentYear);
    // path is something like "/2025/4" or "/setup/2025"
    // createNavigation's redirect will prepend the locale
    redirect({ href: path, locale });
  }

  const meta = LOCALE_META[locale as keyof typeof LOCALE_META] ?? LOCALE_META.en;
  const faqT = await getTranslations({ locale, namespace: "FAQ" });
  const faqItems = faqT.raw("items") as Array<{ question: string; answer: string }>;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Gridly",
    url: BASE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    description: meta.description,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <JsonLd schema={webAppSchema} />
      <JsonLd schema={faqSchema} />
      <PublicHero accountDeleted={accountDeletedConfirmed} authError={authErrorDetected} />
    </>
  );
}
