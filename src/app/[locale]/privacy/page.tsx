import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://appgridly.com";

  return {
    title: t("title"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        es: `${BASE_URL}/es/privacy`,
        en: `${BASE_URL}/en/privacy`,
        "x-default": `${BASE_URL}/es/privacy`,
      },
    },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  const sections = [
    { key: "controller", title: t("controller.title"), body: t("controller.body") },
    { key: "data", title: t("data.title"), body: t("data.body") },
    { key: "basis", title: t("basis.title"), body: t("basis.body") },
    { key: "retention", title: t("retention.title"), body: t("retention.body") },
    { key: "recipients", title: t("recipients.title"), body: t("recipients.body") },
    { key: "rights", title: t("rights.title"), body: t("rights.body") },
    { key: "changes", title: t("changes.title"), body: t("changes.body") },
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
