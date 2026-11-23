import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FixedPlanPanel({ children }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-primary/[0.02] text-sm text-card-foreground">
      <div className="grid divide-y divide-primary/15 md:grid-cols-2 md:divide-x md:divide-y-0">
        {children}
      </div>
    </section>
  );
}
