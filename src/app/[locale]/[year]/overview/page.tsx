import { notFound, redirect } from "next/navigation";
import { getYearsForUser } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";

export default async function LegacyOverviewPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) notFound();

  const user = await requireSessionUser();
  const years = await getYearsForUser(user.id);

  if (years.length === 0) {
    redirect(`/setup/${year}?redirect=/${year}/1`);
  }

  const now = new Date();
  const defaultMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1;
  redirect(`/${year}/${defaultMonth}`);
}
