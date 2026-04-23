import { auth } from "@/auth";
import { PublicHero } from "@/components/landing/public-hero";
import { getAppRedirectPath } from "@/lib/server/year-data";
import { redirect } from "@/i18n/routing";

export default async function Home() {
  const session = await auth();
  const currentYear = new Date().getFullYear();

  if (session?.user?.id) {
    const path = await getAppRedirectPath(session.user.id, currentYear);
    // path is something like "/2025/4" or "/setup/2025"
    // createNavigation's redirect will prepend the locale
    redirect(path);
  }

  return <PublicHero />;
}
