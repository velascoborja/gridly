import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/es/setup/",
        "/en/setup/",
        "/es/evolution",
        "/en/evolution",
        "/es/settings",
        "/en/settings",
        "/es/20",
        "/en/20",
      ],
    },
    sitemap: "https://appgridly.com/sitemap.xml",
  };
}
