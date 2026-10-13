import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { createPublicRobots } from "@/lib/public-seo";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots(process.env, routing.locales);
}
