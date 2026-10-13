import type { MetadataRoute } from "next";

type SeoEnvironment = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

const publicPaths = ["", "/privacy", "/terms"] as const;

export function getPublicSiteOrigin(env: SeoEnvironment): string {
  const url = env.NEXT_PUBLIC_APP_URL?.trim()
    || env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    || "https://appgridly.com";
  return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).origin;
}

function canCrawl(env: SeoEnvironment): boolean {
  return env.NODE_ENV === "production"
    && (!env.VERCEL_ENV || env.VERCEL_ENV === "production");
}

export function createPublicRobots(env: SeoEnvironment, locales: readonly string[]): MetadataRoute.Robots {
  if (!canCrawl(env)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", ...locales.flatMap((locale) => [
        `/${locale}/$`,
        ...publicPaths.map((path) => `/${locale}${path}$`),
      ])],
      // More-specific public exceptions above keep localized app screens out of crawling.
      // Root assets (including /_next/) remain accessible for page rendering.
      disallow: ["/api/", ...locales.map((locale) => `/${locale}/`)],
    },
    sitemap: `${getPublicSiteOrigin(env)}/sitemap.xml`,
  };
}

export function createPublicSitemap(env: SeoEnvironment, locales: readonly string[]): MetadataRoute.Sitemap {
  if (!canCrawl(env)) return [];

  const origin = getPublicSiteOrigin(env);
  return publicPaths.flatMap((path) => {
    const languages = Object.fromEntries(
      locales.map((locale) => [locale, `${origin}/${locale}${path}`]),
    );
    return locales.map((locale) => ({
      url: languages[locale],
      alternates: { languages },
    }));
  });
}
