"use client";

import Image from "next/image";
import { useLinkStatus } from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function HomeLinkLabel() {
  const { pending } = useLinkStatus();
  const t = useTranslations("NotFound");

  return (
    <span className="inline-flex items-center justify-center gap-2" aria-live="polite" aria-busy={pending}>
      {pending
        ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        : <ArrowLeft className="size-4" aria-hidden="true" />}
      {t(pending ? "returningHome" : "backHome")}
    </span>
  );
}

export function NotFoundView() {
  const t = useTranslations("NotFound");
  const locale = useLocale();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-5 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Image src="/gridly-wordmark.svg" alt="Gridly" width={216} height={64} className="h-10 w-[135px]" priority />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-12 sm:px-8 sm:py-20">
        <div className="w-full max-w-xl">
          <p className="mb-6 text-7xl font-light tracking-[-0.04em] text-primary sm:text-8xl">404</p>
          <h1 className="text-3xl font-light leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-md text-base font-light leading-7 text-muted-foreground sm:text-lg">
            {t("description")}
          </p>
          <Link
            href="/"
            locale={locale}
            className={cn(buttonVariants(), "mt-8 min-h-11 w-full min-w-52 px-5 text-base font-normal sm:w-auto")}
          >
            <HomeLinkLabel />
          </Link>
        </div>
      </main>
    </div>
  );
}
