import type { Metadata, Viewport } from "next";
import { Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-malayalam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ജ്വര അലർട്ട് | Jwara Alert",
  description:
    "Spot fever clusters in a panchayat early and act on them. All data shown is fake example data.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ml" className={malayalam.variable}>
      <body className="font-sans antialiased">
        <Header />
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-4">{children}</main>
      </body>
    </html>
  );
}
