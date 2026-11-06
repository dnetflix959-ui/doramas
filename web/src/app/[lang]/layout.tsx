import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Instrument_Sans } from "next/font/google";
import { site } from "@/config/site";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { htmlLang, locales } from "@/i18n/config";
import "../globals.css";

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

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: `%s · ${site.name}` },
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#13171a",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html lang={htmlLang[locale]} className={`${gowunBatang.variable} ${instrumentSans.variable} antialiased`}>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
