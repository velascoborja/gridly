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
import { Button } from "@/components/ui/button";

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
        <Button asChild variant="outline">
          <Link href="/help">{t("cardButton")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
