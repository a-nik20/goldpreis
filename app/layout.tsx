import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://goldpreis-ten.vercel.app"),
  title: {
    default: "Goldpreise in Österreich – Referenzpreise & Marktpreise",
    template: "%s | Goldpreise in Österreich",
  },
  description:
    "Aktuelle Goldpreise für Österreich, Wiener Philharmoniker, Dukaten, Goldbarren und türkisches Gold in Euro und Lira. Referenzpreise und marktnahe Richtwerte.",
  keywords: [
    "Goldpreise Österreich",
    "Goldpreis heute",
    "Goldpreis Österreich heute",
    "Wiener Philharmoniker Preis",
    "Dukaten Preis Österreich",
    "Goldbarren Preis",
    "Türkisches Gold Preis",
    "Gram Altın Preis",
    "Çeyrek Altın Preis",
    "Goldpreis in Euro",
    "Goldpreis in Lira",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Goldpreise in Österreich – Referenzpreise & Marktpreise",
    description:
      "Aktuelle Goldpreise für Österreich und türkisches Gold in Euro und Lira. Referenzpreise und marktnahe Richtwerte.",
    url: "https://goldpreis-ten.vercel.app/",
    siteName: "Goldpreise in Österreich",
    locale: "de_AT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goldpreise in Österreich – Referenzpreise & Marktpreise",
    description:
      "Aktuelle Goldpreise für Österreich, Goldbarren, Wiener Philharmoniker und türkisches Gold in Euro und Lira.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}