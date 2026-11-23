import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ChartColumnBig, CheckCircle2, Info, PiggyBank, Wallet } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDemoHref } from "@/lib/demo/demo-year";
import { cn } from "@/lib/utils";

interface PublicHeroProps {
  accountDeleted?: boolean;
  authError?: boolean;
}

const ANNUAL_BARS = [
  { month: "E", value: 38 },
  { month: "F", value: 46 },
  { month: "M", value: 42 },
  { month: "A", value: 54 },
  { month: "M", value: 58 },
  { month: "J", value: 82, highlight: true },
  { month: "J", value: 62 },
  { month: "A", value: 67 },
  { month: "S", value: 64 },
  { month: "O", value: 72 },
  { month: "N", value: 76 },
  { month: "D", value: 92, highlight: true },
];

export function PublicHero({ accountDeleted = false, authError = false }: PublicHeroProps) {
  const t = useTranslations("Landing");
  const demoHref = getDemoHref();

  const FEATURE_PROOF = [
    {
      icon: Wallet,
      title: t("proof.monthly.title"),
      description: t("proof.monthly.description"),
    },
    {
      icon: PiggyBank,
      title: t("proof.chain.title"),
      description: t("proof.chain.description"),
    },
    {
      icon: ChartColumnBig,
      title: t("proof.annual.title"),
      description: t("proof.annual.description"),
    },
  ];
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] landing-atmosphere" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card/85 px-4 py-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="group inline-flex items-center gap-2">
            <Image
              src="/gridly-wordmark.svg"
              alt="Gridly"
              width={216}
              height={64}
              className="h-10 w-[135px] transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-11 sm:w-[149px]"
              priority
            />
            {process.env.NODE_ENV === "development" && (
              <Badge variant="default" className="pointer-events-none">
                DEV
              </Badge>
            )}
          </Link>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={demoHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full justify-center rounded-md border-primary/35 bg-card/90 px-5 text-base font-normal text-primary shadow-sm backdrop-blur-sm hover:bg-primary/[0.05] hover:text-primary sm:w-auto",
              )}
            >
              {t("demoCta")}
            </Link>
            <GoogleSignInButton className="w-full sm:w-auto" buttonClassName="w-full justify-center sm:w-auto" />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
        {accountDeleted ? (
          <div className="flex max-w-2xl items-start gap-3 rounded-md border border-financial-positive/40 bg-financial-positive/15 px-4 py-3 text-financial-positive shadow-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("accountDeletedTitle")}</p>
              <p className="text-sm leading-6 text-financial-positive/85">{t("accountDeletedDescription")}</p>
            </div>
          </div>
        ) : null}

        {authError ? (
          <div className="flex max-w-2xl items-start gap-3 rounded-md border border-primary/35 bg-card/90 px-4 py-3 text-primary shadow-sm">
            <Info className="mt-0.5 size-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t("authErrorTitle")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{t("authErrorDescription")}</p>
            </div>
          </div>
        ) : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1.05fr)] lg:items-center">
          <div className="space-y-7">
            <div className="max-w-2xl space-y-5">
              <h1 className="max-w-3xl text-5xl font-light leading-none tracking-[-0.04em] sm:text-6xl lg:text-7xl text-foreground">
                {t("heroTitle")}
              </h1>
              <p className="max-w-xl text-base font-light leading-7 text-muted-foreground sm:text-lg">{t("heroDescription")}</p>
            </div>
          </div>

          <section className="relative">
            <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-card shadow-featured">
              <div className="border-b border-border bg-linear-to-b from-card to-muted/50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t("preview.title")}</p>
                    <h2 className="mt-1 text-2xl font-light text-foreground">{t("preview.yearLabel")}</h2>
                  </div>
                  <div className="rounded-md border border-border bg-card px-2 py-1 text-xs font-normal text-muted-foreground">
                    {t("preview.privateAccount")}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <PreviewMetric label={t("preview.annualBalance")} value="18.420 EUR" active />
                  <PreviewMetric label={t("preview.avgSavings")} value="1.245 EUR" />
                  <PreviewMetric label={t("preview.extraPays")} value="2" />
                </div>

                <div className="rounded-lg border border-border bg-linear-to-b from-card to-muted/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-normal text-foreground">{t("preview.currentMonth")}</p>
                      <p className="mt-1 text-sm font-light leading-6 text-muted-foreground">{t("preview.connectedBalance")}</p>
                    </div>
                    <div className="w-fit rounded-md bg-primary px-3 py-1 text-xs font-normal text-primary-foreground">
                      {t("preview.monthName")}
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <PreviewRow label={t("preview.totalIncome")} value="3.450 EUR" />
                    <PreviewRow label={t("preview.totalExpenses")} value="2.185 EUR" />
                    <PreviewRow label={t("preview.monthlySavings")} value="1.265 EUR" emphasis />
                    <PreviewRow label={t("preview.endingBalance")} value="18.420 EUR" strong />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="mt-12 grid gap-6 rounded-lg border border-border bg-card px-4 py-5 shadow-sm sm:px-5 lg:mt-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:p-6">
          <div className="max-w-xl space-y-3">
            <h2 className="text-3xl font-light tracking-[-0.04em] text-foreground sm:text-4xl">{t("annualStory.title")}</h2>
            <p className="text-base font-light leading-7 text-muted-foreground">{t("annualStory.description")}</p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-normal text-foreground/80">{t("annualStory.projectedClose")}</p>
              <p className="finance-number text-lg font-normal text-foreground">18.420 EUR</p>
            </div>
            <div className="mt-5 grid h-40 grid-cols-12 items-end gap-1.5 sm:gap-2">
              {ANNUAL_BARS.map((bar, index) => (
                <div key={`${bar.month}-${index}`} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <div
                    className={cn(
                      "w-full rounded-sm border transition-colors",
                      bar.highlight
                        ? "border-primary bg-primary shadow-sm"
                        : "border-primary/20 bg-primary/25",
                    )}
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-xs font-light text-muted-foreground">{bar.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-light text-muted-foreground">
              <span className="size-2 rounded-sm bg-primary" />
              {t("annualStory.extraPayMarker")}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {FEATURE_PROOF.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/[0.06] text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-xl font-light text-foreground">{title}</h2>
              <p className="mt-2 text-sm font-light leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </section>

        <footer className="mt-10 flex items-center gap-4 text-xs font-light text-muted-foreground lg:mt-14">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t("footer.terms")}
          </Link>
        </footer>
      </main>
    </div>
  );
}

function PreviewMetric({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        active
          ? "border-primary/20 bg-linear-to-b from-primary/[0.08] to-card"
          : "border-border bg-card",
      )}
    >
      <p className="text-xs font-medium leading-4 text-muted-foreground">{label}</p>
      <p className="finance-number mt-2 text-xl font-normal text-foreground">{value}</p>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  emphasis = false,
  strong = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto] items-center gap-3", strong && "border-t border-border pt-3")}>
      <p className={cn("text-sm font-light text-muted-foreground", strong && "font-normal text-foreground")}>{label}</p>
      <p className={cn("finance-number text-sm font-normal text-foreground", emphasis && "text-primary")}>{value}</p>
    </div>
  );
}
