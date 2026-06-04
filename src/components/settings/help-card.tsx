"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HelpCard() {
  const t = useTranslations("Help");

  return (
    <Card className="border-border/70 bg-background/85 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-primary" />
          <CardTitle>{t("cardTitle")}</CardTitle>
        </div>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href="/help" className={cn(buttonVariants({ variant: "outline" }))}>
          {t("cardButton")}
        </Link>
      </CardContent>
    </Card>
  );
}
