import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

function getLocaleFromCallbackUrl(request: NextRequest) {
  const callbackUrl = request.cookies.get("authjs.callback-url")?.value;

  if (!callbackUrl) {
    return routing.defaultLocale;
  }

  try {
    const decodedCallbackUrl = decodeURIComponent(callbackUrl);
    const callbackPath = new URL(decodedCallbackUrl).pathname;
    const locale = routing.locales.find((candidate) => callbackPath === `/${candidate}` || callbackPath.startsWith(`/${candidate}/`));

    return locale ?? routing.defaultLocale;
  } catch {
    return routing.defaultLocale;
  }
}

export function GET(request: NextRequest) {
  const locale = getLocaleFromCallbackUrl(request);
  const redirectUrl = new URL(`/${locale}`, request.url);
  const error = request.nextUrl.searchParams.get("error");

  redirectUrl.searchParams.set("authError", "1");
  redirectUrl.searchParams.set("authErrorId", randomUUID());

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(redirectUrl);
}
