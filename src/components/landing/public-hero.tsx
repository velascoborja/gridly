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
    <div className="relative min-h-screen overflow-hidden bg-[#fbfcff] text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_18%_0%,rgba(83,58,253,0.16),transparent_30%),radial-gradient(circle_at_82%_6%,rgba(249,107,238,0.12),transparent_26%),linear-gradient(180deg,#ffffff_0%,rgba(246,249,252,0.86)_56%,transparent_100%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[8px] border border-[#e5edf5]/80 bg-white/86 px-4 py-3 shadow-[0_15px_35px_-28px_rgba(50,50,93,0.28),0_8px_18px_-14px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
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
              <Badge variant="default" className="pointer-events-none rounded-[4px] uppercase">
                DEV
              </Badge>
            )}
          </Link>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={demoHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full justify-center rounded-[4px] border-[#b9b9f9] bg-white/88 px-5 text-base font-normal text-[#533afd] shadow-[0_15px_35px_-18px_rgba(50,50,93,0.18)] backdrop-blur-sm hover:bg-[#533afd]/[0.05] hover:text-[#533afd] sm:w-auto",
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
          <div className="flex max-w-2xl items-start gap-3 rounded-[6px] border border-[rgba(21,190,83,0.4)] bg-[rgba(21,190,83,0.12)] px-4 py-3 text-[#108c3d] shadow-[0_15px_35px_-28px_rgba(50,50,93,0.25)]">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("accountDeletedTitle")}</p>
              <p className="text-sm leading-6 text-[#108c3d]/85">{t("accountDeletedDescription")}</p>
            </div>
          </div>
        ) : null}

        {authError ? (
          <div className="flex max-w-2xl items-start gap-3 rounded-[6px] border border-[#b9b9f9] bg-white/86 px-4 py-3 text-[#533afd] shadow-[0_15px_35px_-28px_rgba(50,50,93,0.25)] backdrop-blur-sm">
            <Info className="mt-0.5 size-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#061b31]">{t("authErrorTitle")}</p>
              <p className="text-sm leading-6 text-[#64748d]">{t("authErrorDescription")}</p>
            </div>
          </div>
        ) : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1.05fr)] lg:items-center">
          <div className="space-y-7">
            <div className="max-w-2xl space-y-5">
              <p className="inline-flex rounded-[4px] border border-[#ffd7ef] bg-white px-2 py-1 text-xs font-normal uppercase tracking-[0.14em] text-[#ea2261] shadow-[0_12px_28px_-24px_rgba(50,50,93,0.28)]">
                {t("heroEyebrow")}
              </p>
              <h1 className="max-w-3xl text-[clamp(2.7rem,6.8vw,5rem)] font-light leading-[1.02] tracking-[-0.05em] text-[#061b31]">
                {t("heroTitle")}
              </h1>
              <p className="max-w-xl text-base font-light leading-7 text-[#64748d] sm:text-lg">{t("heroDescription")}</p>
            </div>
          </div>

          <section className="relative">
            <div className="relative overflow-hidden rounded-[8px] border border-[#d6d9fc] bg-white shadow-[0_30px_45px_-30px_rgba(50,50,93,0.36),0_18px_36px_-18px_rgba(0,0,0,0.14)]">
              <div className="border-b border-[#e5edf5] bg-[linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-normal uppercase tracking-[0.16em] text-[#64748d]">{t("preview.title")}</p>
                    <h2 className="mt-1 text-2xl font-light tracking-[-0.026em] text-[#061b31]">{t("preview.yearLabel")}</h2>
                  </div>
                  <div className="rounded-[4px] border border-[#e5edf5] bg-white px-2 py-1 text-xs font-normal text-[#64748d]">
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

                <div className="rounded-[8px] border border-[#e5edf5] bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fc_100%)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-normal text-[#061b31]">{t("preview.currentMonth")}</p>
                      <p className="mt-1 text-sm font-light leading-6 text-[#64748d]">{t("preview.connectedBalance")}</p>
                    </div>
                    <div className="w-fit rounded-[4px] bg-[#533afd] px-3 py-1 text-xs font-normal text-white">
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

        <section className="mt-12 grid gap-6 rounded-[8px] border border-[#e5edf5] bg-white px-4 py-5 shadow-[0_30px_45px_-38px_rgba(50,50,93,0.26),0_18px_36px_-24px_rgba(0,0,0,0.1)] sm:px-5 lg:mt-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:p-6">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-normal uppercase tracking-[0.16em] text-[#533afd]">{t("annualStory.eyebrow")}</p>
            <h2 className="text-3xl font-light tracking-[-0.04em] text-[#061b31] sm:text-4xl">{t("annualStory.title")}</h2>
            <p className="text-base font-light leading-7 text-[#64748d]">{t("annualStory.description")}</p>
          </div>

          <div className="rounded-[8px] border border-[#e5edf5] bg-[#fbfcff] p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-normal text-[#273951]">{t("annualStory.projectedClose")}</p>
              <p className="finance-number text-lg font-normal text-[#061b31]">18.420 EUR</p>
            </div>
            <div className="mt-5 grid h-40 grid-cols-12 items-end gap-1.5 sm:gap-2">
              {ANNUAL_BARS.map((bar, index) => (
                <div key={`${bar.month}-${index}`} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <div
                    className={cn(
                      "w-full rounded-[3px] border transition-colors",
                      bar.highlight
                        ? "border-[#533afd] bg-[#533afd] shadow-[0_14px_21px_-14px_rgba(50,50,93,0.34)]"
                        : "border-[#d6d9fc] bg-[#b9b9f9]/70",
                    )}
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-[10px] font-light text-[#64748d]">{bar.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-light text-[#64748d]">
              <span className="size-2 rounded-[2px] bg-[#533afd]" />
              {t("annualStory.extraPayMarker")}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {FEATURE_PROOF.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[8px] border border-[#e5edf5] bg-white/88 p-5 shadow-[0_18px_36px_-30px_rgba(50,50,93,0.26)] backdrop-blur-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-[6px] border border-[#d6d9fc] bg-[#533afd]/[0.06] text-[#533afd]">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-xl font-light tracking-[-0.026em] text-[#061b31]">{title}</h2>
              <p className="mt-2 text-sm font-light leading-6 text-[#64748d]">{description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function PreviewMetric({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[6px] border p-3",
        active
          ? "border-[#d6d9fc] bg-[linear-gradient(180deg,rgba(83,58,253,0.08),#ffffff)]"
          : "border-[#e5edf5] bg-white",
      )}
    >
      <p className="text-[11px] font-light uppercase leading-4 tracking-[0.12em] text-[#64748d]">{label}</p>
      <p className="finance-number mt-2 text-xl font-normal tracking-[-0.02em] text-[#061b31]">{value}</p>
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
    <div className={cn("grid grid-cols-[1fr_auto] items-center gap-3", strong && "border-t border-[#e5edf5] pt-3")}>
      <p className={cn("text-sm font-light text-[#64748d]", strong && "font-normal text-[#061b31]")}>{label}</p>
      <p className={cn("finance-number text-sm font-normal text-[#061b31]", emphasis && "text-[#533afd]")}>{value}</p>
    </div>
  );
}
