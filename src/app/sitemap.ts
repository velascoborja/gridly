import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { createPublicSitemap } from "@/lib/public-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return createPublicSitemap(process.env, routing.locales);
}
