import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import OfflineBanner from "@/components/OfflineBanner";
import { I18nProvider } from "@/components/I18nProvider";
import { getCurrentUser, ROLE_HOME } from "@/lib/authz";
import { getT } from "@/lib/i18n/server";
import { navFor } from "@/lib/nav";

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-malayalam",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Jwara Alert · ജ്വര അലർട്ട്", template: "%s · Jwara Alert" },
  description:
    "Residents report illness anonymously; red wards trigger officer-approved alerts and ASHA home visits. Malayalam, English, Hindi. Example data only.",
  applicationName: "Jwara Alert",
  appleWebApp: { capable: true, title: "Jwara Alert", statusBarStyle: "default" },
  openGraph: {
    title: "Jwara Alert · ജ്വര അലർട്ട്",
    description: "Spot illness clusters in Kerala panchayats early. Act fast.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { lang, t } = getT();
  const user = await getCurrentUser();
  const nav = navFor(user?.role ?? null);
  const homeHref = user ? ROLE_HOME[user.role] : "/";

  return (
    <html lang={lang} className={`${malayalam.variable} ${devanagari.variable}`}>
      <body className={`min-h-screen font-sans antialiased ${user?.large_text ? "text-[20px]" : ""}`}>
        <I18nProvider lang={lang} t={t}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-2">
            {t.skipToContent}
          </a>
          <Header user={user} t={t} nav={nav} homeHref={homeHref} />
          <OfflineBanner />
          <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:pb-12">
            {children}
          </main>
          <NavBar items={nav} variant="bottom" />
        </I18nProvider>
      </body>
    </html>
  );
}
