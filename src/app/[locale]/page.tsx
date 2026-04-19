import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PublicHero } from "@/components/landing/public-hero";
import { getAppRedirectPath } from "@/lib/server/year-data";

export default async function Home() {
  const session = await auth();
  const currentYear = new Date().getFullYear();

  if (session?.user?.id) {
    const path = await getAppRedirectPath(session.user.id, currentYear);
    // path is something like "/2025/overview"
    redirect(path);
  }

  return <PublicHero />;
}
