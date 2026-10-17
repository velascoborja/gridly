"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";

interface Props {
  headerRightContent?: React.ReactNode;
  children: React.ReactNode;
}

export function BaseAppShell({ headerRightContent, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const root = rootRef.current;
    if (!header || !root) return;

    const measureHeader = () => {
      const height = getComputedStyle(header).position === "sticky"
        ? header.getBoundingClientRect().height
        : 0;
      root.style.setProperty("--app-sticky-header-height", `${height}px`);
    };
    measureHeader();
    const observer = new ResizeObserver(measureHeader);
    observer.observe(header);
    window.addEventListener("resize", measureHeader);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureHeader);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(64,148,255,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),transparent)]" />
      <header ref={headerRef} className="relative md:sticky top-0 z-40 app-header-surface">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:flex md:items-center md:justify-between md:gap-4 md:py-4 lg:px-8">
          <Link href="/" className="group inline-flex items-center gap-2 justify-self-start">
            <Image
              src="/gridly-wordmark.svg"
              alt="Gridly"
              width={216}
              height={64}
              className="h-10 w-[135px] transition-transform duration-200 group-hover:-translate-y-0.5 md:h-12 md:w-[162px]"
              priority
            />
            {process.env.NODE_ENV === "development" && (
              <Badge variant="default" className="pointer-events-none uppercase">
                DEV
              </Badge>
            )}
          </Link>
          <div className="contents md:flex md:flex-col md:items-end md:gap-3">
            {headerRightContent}
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
