import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FixedPlanPanel({ children }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#533afd]/20 bg-linear-to-br from-[#533afd]/[0.10] via-[#533afd]/[0.05] to-[#533afd]/[0.02] dark:border-[#8b7cff]/25 dark:from-[#533afd]/[0.18] dark:via-[#533afd]/[0.10] dark:to-[#533afd]/[0.05] text-sm text-card-foreground">
      <div className="grid divide-y divide-[#533afd]/15 dark:divide-[#8b7cff]/20 md:grid-cols-2 md:divide-x md:divide-y-0">
        {children}
      </div>
    </section>
  );
}
