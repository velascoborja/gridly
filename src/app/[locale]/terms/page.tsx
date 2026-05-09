import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://appgridly.com";

  return {
    title: t("title"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/terms`,
      languages: {
        es: `${BASE_URL}/es/terms`,
        en: `${BASE_URL}/en/terms`,
        "x-default": `${BASE_URL}/es/terms`,
      },
    },
  };
}

export default async function TermsPage() {
  const t = await getTranslations("Terms");

  const sections = [
    { key: "description", title: t("description.title"), body: t("description.body") },
    { key: "age", title: t("age.title"), body: t("age.body") },
    { key: "use", title: t("use.title"), body: t("use.body") },
    { key: "account", title: t("account.title"), body: t("account.body") },
    { key: "availability", title: t("availability.title"), body: t("availability.body") },
    { key: "liability", title: t("liability.title"), body: t("liability.body") },
    { key: "law", title: t("law.title"), body: t("law.body") },
    { key: "changes", title: t("changes.title"), body: t("changes.body") },
    { key: "contact", title: t("contact.title"), body: t("contact.body") },
  ];

  return (
    <LegalShell>
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-[-0.04em] text-[#061b31] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-sm font-light text-[#64748d]">{t("lastUpdated")}</p>
        </div>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.key} className="space-y-2">
              <h2 className="text-lg font-normal tracking-[-0.02em] text-[#061b31]">
                {section.title}
              </h2>
              <p className="text-sm font-light leading-7 text-[#64748d]">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </LegalShell>
  );
}
