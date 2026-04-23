import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ChartColumnBig, PiggyBank, Wallet } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoHref } from "@/lib/demo/demo-year";
import { cn } from "@/lib/utils";

export function PublicHero() {
  const t = useTranslations("Landing");
  const demoHref = getDemoHref();

  const FEATURES = [
    {
      icon: Wallet,
      title: t("features.monthly.title"),
      description: t("features.monthly.description"),
    },
    {
      icon: PiggyBank,
      title: t("features.chained.title"),
      description: t("features.chained.description"),
    },
    {
      icon: ChartColumnBig,
      title: t("features.annual.title"),
      description: t("features.annual.description"),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(83,58,253,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,107,238,0.12),transparent_24%),linear-gradient(180deg,#fbfcff_0%,#f6f8fc_42%,#f2f5fb_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-2">
          <Image
            src="/gridly-wordmark.svg"
            alt="Gridly"
            width={216}
            height={64}
            className="h-11 w-[149px] transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-12 sm:w-[162px]"
            priority
          />
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={demoHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-[4px] border-[#b9b9f9] bg-white/80 px-5 text-base font-normal text-[#533afd] shadow-[0_15px_35px_-18px_rgba(50,50,93,0.18)] backdrop-blur-sm hover:bg-[#533afd]/[0.05] hover:text-[#533afd]",
            )}
          >
            {t("demoCta")}
          </Link>
          <GoogleSignInButton />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-center lg:px-8 lg:pt-16">
        <section className="space-y-8">
          <div className="max-w-2xl space-y-5">
            <h1 className="max-w-3xl text-[clamp(2.8rem,7vw,5.1rem)] font-light tracking-[-0.05em] text-[#061b31]">
              {t("heroTitle")}
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#64748d] sm:text-lg">
              {t("heroDescription")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-[1.5rem] border-border/70 bg-white/82 shadow-[0_24px_50px_-38px_rgba(50,50,93,0.3)] backdrop-blur-sm">
                <CardContent className="space-y-3 p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-medium tracking-tight text-[#061b31]">{title}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative">
          <div className="absolute -left-10 top-14 h-32 w-32 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -right-8 bottom-6 h-24 w-24 rounded-full bg-pink-400/15 blur-3xl" />
          <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-white/92 shadow-[0_40px_80px_-50px_rgba(50,50,93,0.45)] backdrop-blur-md">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">{t("preview.title")}</p>
                  <h2 className="mt-2 text-2xl font-light tracking-tight text-[#061b31]">{t("preview.yearLabel")}</h2>
                </div>
                <div className="rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t("preview.privateAccount")}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(83,58,253,0.08),rgba(255,255,255,0.9))] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("preview.annualBalance")}</p>
                  <p className="mt-3 finance-number text-2xl font-semibold tracking-tight text-[#061b31]">€18.420</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("preview.avgSavings")}</p>
                  <p className="mt-3 finance-number text-2xl font-semibold tracking-tight text-[#061b31]">€1.245</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("preview.extraPays")}</p>
                  <p className="mt-3 finance-number text-2xl font-semibold tracking-tight text-[#061b31]">2</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,252,0.92))] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#061b31]">{t("preview.currentMonth")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("preview.connectedBalance")}</p>
                  </div>
                  <div className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    {t("preview.monthName")}
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <p className="text-sm text-muted-foreground">{t("preview.totalIncome")}</p>
                    <p className="finance-number text-sm font-semibold text-[#061b31]">€3.450</p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <p className="text-sm text-muted-foreground">{t("preview.totalExpenses")}</p>
                    <p className="finance-number text-sm font-semibold text-[#061b31]">€2.185</p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-border/70 pt-4">
                    <p className="text-sm font-medium text-[#061b31]">{t("preview.monthlySavings")}</p>
                    <p className="finance-number text-base font-semibold text-primary">€1.265</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
