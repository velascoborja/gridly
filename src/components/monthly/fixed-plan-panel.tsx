import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FixedPlanPanel({ children }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-border/70 bg-muted/30 text-sm text-card-foreground">
      <div className="grid divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0">
        {children}
      </div>
    </section>
  );
}
