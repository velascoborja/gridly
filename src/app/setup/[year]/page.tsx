import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/server/session";
import { SetupPageClient } from "@/components/setup/setup-page-client";

export default async function SetupPage({ params }: { params: Promise<{ year: string }> }) {
  await requireSessionUser();

  const { year } = await params;
  const yearNum = parseInt(year, 10);

  if (Number.isNaN(yearNum)) {
    notFound();
  }

  return <SetupPageClient year={yearNum} />;
}
