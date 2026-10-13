import test from "node:test";
import assert from "node:assert/strict";
import { createPublicRobots, createPublicSitemap, getPublicSiteOrigin } from "./public-seo.ts";

const production = { NODE_ENV: "production" };
const locales = ["es", "en"];

test("public origin follows deployment configuration and excludes URL paths", () => {
  assert.equal(getPublicSiteOrigin({}), "https://appgridly.com");
  assert.equal(getPublicSiteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "gridly.vercel.app/" }), "https://gridly.vercel.app");
  assert.equal(getPublicSiteOrigin({
    NEXT_PUBLIC_APP_URL: " https://example.com/base/?query=1 ",
    VERCEL_PROJECT_PRODUCTION_URL: "gridly.vercel.app",
  }), "https://example.com");
  assert.equal(getPublicSiteOrigin({ NEXT_PUBLIC_APP_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "gridly.vercel.app" }), "https://gridly.vercel.app");
});

test("development, test and preview deployments do not advertise crawlable URLs", () => {
  for (const env of [
    {}, { NODE_ENV: "development" }, { NODE_ENV: "test" },
    { ...production, VERCEL_ENV: "preview" }, { ...production, VERCEL_ENV: "development" },
  ]) {
    assert.deepEqual(createPublicRobots(env, locales), { rules: { userAgent: "*", disallow: "/" } });
    assert.deepEqual(createPublicSitemap(env, locales), []);
  }
});

test("production sitemap has exactly six public URLs with reciprocal language alternatives", () => {
  for (const env of [production, { ...production, VERCEL_ENV: "production" }]) {
    const sitemap = createPublicSitemap(env, locales);
    assert.deepEqual(sitemap.map((entry) => entry.url), [
      "https://appgridly.com/es", "https://appgridly.com/en",
      "https://appgridly.com/es/privacy", "https://appgridly.com/en/privacy",
      "https://appgridly.com/es/terms", "https://appgridly.com/en/terms",
    ]);
    for (const entry of sitemap) {
      const path = new URL(entry.url).pathname.slice(3);
      assert.deepEqual(entry.alternates?.languages, {
        es: `https://appgridly.com/es${path}`, en: `https://appgridly.com/en${path}`,
      });
      assert.equal(entry.lastModified, undefined);
    }
  }
});

test("robots permits public pages and assets while excluding localized app routes", () => {
  const robots = createPublicRobots(production, locales);
  const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
  assert.equal(rules.userAgent, "*");
  assert.equal(robots.sitemap, "https://appgridly.com/sitemap.xml");

  // Evaluate longest-match precedence and end-of-URL anchors used in these rules.
  const allows = [rules.allow ?? []].flat();
  const disallows = [rules.disallow ?? []].flat();
  function matches(pattern: string, url: string) {
    return pattern.endsWith("$") ? url === pattern.slice(0, -1) : url.startsWith(pattern);
  }
  function canVisit(url: string) {
    const specificity = (patterns: string[]) => Math.max(-1, ...patterns.filter((p) => matches(p, url)).map((p) => p.replace(/\$$/, "").length));
    return specificity(allows) >= specificity(disallows);
  }

  for (const url of ["/", "/favicon.ico", "/icon.svg", "/gridly-wordmark.svg", "/_next/static/app.js", "/_next/image?url=logo", "/sitemap.xml"]) {
    assert.equal(canVisit(url), true, url);
  }
  assert.equal(canVisit("/api/years"), false);
  for (const locale of locales) {
    for (const path of ["", "/", "/privacy", "/terms"]) {
      assert.equal(canVisit(`/${locale}${path}`), true, path);
    }
    for (const path of ["/settings", "/help", "/evolution", "/setup/2026", "/2026/4", "/2026/summary", "/demo/2026/4", "/demo/2026/summary", "/privacy/unknown", "/unknown"]) {
      assert.equal(canVisit(`/${locale}${path}`), false, path);
    }
  }
});

test("robots and sitemap use the same configured public origin", () => {
  const env = { ...production, NEXT_PUBLIC_APP_URL: "custom.example/ignored/path" };
  assert.equal(createPublicRobots(env, locales).sitemap, "https://custom.example/sitemap.xml");
  assert.ok(createPublicSitemap(env, locales).every((entry) => new URL(entry.url).origin === "https://custom.example"));
});
