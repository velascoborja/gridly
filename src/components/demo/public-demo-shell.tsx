import type { ReactNode } from "react";
import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

interface PublicDemoShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function PublicDemoShell({
  eyebrow,
  title,
  description,
  children,
}: PublicDemoShellProps) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(83,58,253,0.14),transparent_26%),linear-gradient(180deg,#fbfcff_0%,#f6f8fc_42%,#f2f5fb_100%)] text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-2">
          <Image
            src="/gridly-wordmark.svg"
            alt="Gridly"
            width={216}
            height={64}
            className="h-11 w-[149px] transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-12 sm:w-[162px]"
            priority
          />
          {process.env.NODE_ENV === "development" && (
            <Badge variant="default" className="pointer-events-none uppercase">
              DEV
            </Badge>
          )}
        </Link>
        <GoogleSignInButton />
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-white/88 shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-24px_rgba(0,0,0,0.1)] backdrop-blur-sm">
          <CardContent className="space-y-2 px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-light tracking-[-0.04em] text-[#061b31] sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </CardContent>
        </Card>

        {children}
      </main>
    </div>
  );
}
