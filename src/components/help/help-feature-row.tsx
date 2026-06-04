"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface HelpFeatureRowProps {
  title: string;
  summary: string;
  detail: string;
}

export function HelpFeatureRow({ title, summary, detail }: HelpFeatureRowProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("Help");

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-background/60">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? t("collapseLabel") : t("expandLabel")}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <div className="border-t border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground/80">{detail}</p>
        </div>
      )}
    </div>
  );
}
