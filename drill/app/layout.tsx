import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from '@/components/layout/navbar';
import { MobileUserInfo } from '@/components/layout/mobile-user-info';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drill - İşçi ve Makine Takip Sistemi",
  description: "İşçi ve makine takip sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-white`}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <MobileUserInfo />
            <main className="py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
