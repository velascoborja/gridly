import type { ReactNode } from "react";
import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

interface PublicDemoShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function PublicDemoShell({
  title,
  description,
  children,
}: PublicDemoShellProps) {
  return (
    <div className="app-atmosphere min-h-dvh text-foreground">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-2">
          <Image
            src="/gridly-wordmark.svg"
            alt="Gridly"
            width={216}
            height={64}
            className="h-auto w-28 transition-transform duration-200 group-hover:-translate-y-0.5 sm:w-[162px]"
            priority
          />
          {process.env.NODE_ENV === "development" && (
            <Badge variant="default" className="pointer-events-none">
              DEV
            </Badge>
          )}
        </Link>
        <GoogleSignInButton buttonClassName="gap-2 px-3 sm:gap-3 sm:px-5" />
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <Card className="border-border/70 shadow-featured">
          <CardContent className="space-y-2 px-6 py-6 sm:px-8">
            <h1 className="text-3xl font-light tracking-[-0.04em] text-foreground sm:text-4xl">
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
