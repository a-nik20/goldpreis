import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Goldpreise in Österreich - Referenzpreise & Marktpreise",
  description:
    "Aktuelle Goldpreise für Österreich und türkisches Gold in Euro und Lira. Referenzpreise und marktnahe Richtwerte.",
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