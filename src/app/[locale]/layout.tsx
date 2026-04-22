import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { StatusBarTheme } from "@/components/layout/status-bar-theme";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  applicationName: "Gridly",
  title: {
    default: "Gridly",
    template: "%s · Gridly",
  },
  description: "Controla ingresos, gastos y ahorro con balances mensuales claros.",
  keywords: ["finanzas personales", "ahorro", "gastos", "ingresos", "nóminas"],
  referrer: "origin-when-cross-origin",
  creator: "Gridly",
  publisher: "Gridly",
  appleWebApp: {
    capable: true,
    title: "Gridly",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html 
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <StatusBarTheme />
          {children}
        </NextIntlClientProvider>
        <Script id="ios-active-states" strategy="afterInteractive">
          {`document.addEventListener('touchstart', function() {}, true);`}
        </Script>
      </body>
    </html>
  );
}
