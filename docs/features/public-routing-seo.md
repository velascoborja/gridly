# Feature: Public Routing & Search Crawling

## Overview

Gridly provides localized not-found pages and public metadata routes for search crawlers. Production advertises only the Spanish and English home, privacy, and terms pages. Robots rules control crawling; authentication remains responsible for protecting account data. A disallowed URL can still appear in search results if linked elsewhere.

## Key Components

- `src/app/[locale]/not-found.tsx`: Handles existing `notFound()` calls inside localized routes.
- `src/app/[locale]/[...rest]/page.tsx`: Calls `notFound()` for otherwise unmatched localized paths.
- `src/app/global-not-found.tsx`: Complete Spanish fallback document for requests outside the localized layout, including its own Geist font, styles, metadata, and minimal translation provider. Enabled by `experimental.globalNotFound` in `next.config.ts` (experimental in Next.js 16.2).
- `src/app/not-found.tsx`: Reuses the standalone document when an invalid locale matches `[locale]` and its layout throws before the localized boundary is mounted (for example, `/inexistente.txt`).
- `src/components/errors/not-found-view.tsx`: Shared responsive view, using the `NotFound` messages in both languages and a locale-aware home link with immediate pending feedback.
- `src/app/robots.ts` and `src/app/sitemap.ts`: Public metadata handlers; no authentication or database access.
- `src/lib/public-seo.ts`: Shared origin resolution and crawl rules, covered by `public-seo.test.ts`.

## Implementation Details

### Not-found navigation

Unknown localized routes and invalid resources render the same branded 404. The home link preserves the locale and uses `useLinkStatus` in a descendant to show pending text and a spinner while navigation is in progress. The normal home route continues handling authenticated-user redirects. The global fallback uses Spanish explicitly, without relying on a valid locale or the normal root layout.

Next.js injects `noindex` when `notFound()` is called. A response returns HTTP 404 before streaming starts; if the response has already started streaming, its HTTP status can remain 200 while rendering the not-found UI and `noindex`. The global fallback explicitly declares non-indexable metadata as well.

### Production crawling

The metadata routes are cached using Next.js defaults. Crawling is enabled only when `NODE_ENV=production` and `VERCEL_ENV` is absent or equals `production`. Development, test, and Vercel preview deployments return `Disallow: /` without a sitemap directive, and an empty sitemap. Rebuild when changing deployment configuration.

Robots blocks `/api/` and localized subroutes, with exact public-page exceptions. Root assets, including `/_next/`, remain crawlable. Private screens, help, setup, evolution, and demo pages are excluded from crawling and the sitemap. The existing locale proxy excludes root metadata URLs containing a dot, so `/robots.txt` and `/sitemap.xml` do not redirect to a locale.

The sitemap contains exactly six absolute URLs: `/es`, `/en`, and `/privacy` and `/terms` under each locale. Each entry declares reciprocal `es` and `en` language alternatives. Redirect-only URLs, query strings, invented modification dates, and user data are omitted. Locale values come from the shared routing configuration.

Both metadata routes resolve their origin from `NEXT_PUBLIC_APP_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then `https://appgridly.com`. Missing protocols become HTTPS; paths, queries, and trailing slashes are removed by URL origin normalization. Preview-specific `VERCEL_URL` is deliberately not a fallback. This is separate from the existing Open Graph metadata configuration.

## Verification

Run `npm test`, `npm run lint`, and `npm run build`. Check localized unknown routes, invalid demo months, and `/inexistente.txt`; confirm the language, home navigation, responsive layout, and `noindex`. Check the content types and bodies of both metadata routes in production and development, including all six sitemap entries and their language alternatives.
