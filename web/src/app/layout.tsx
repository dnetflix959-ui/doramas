import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Instrument_Sans } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
};

export const viewport: Viewport = {
  themeColor: "#13171a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${gowunBatang.variable} ${instrumentSans.variable} antialiased`}>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
