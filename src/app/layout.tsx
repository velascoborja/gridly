import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
