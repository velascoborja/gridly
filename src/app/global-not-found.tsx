import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { NotFoundView } from "@/components/errors/not-found-view";
import messages from "../../messages/es.json";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${messages.NotFound.title} · Gridly`,
  description: messages.NotFound.description,
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body>
        <NextIntlClientProvider locale="es" messages={{ NotFound: messages.NotFound }} timeZone="Europe/Madrid">
          <NotFoundView />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
