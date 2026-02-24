import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LooPyck - Smart Fashion Price Comparison",
  description: "Compare prices across multiple stores and pick the best option. LooPyck uses smart search to help you shop efficiently.",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
  openGraph: {
    title: "LooPyck - Smart Fashion Price Comparison",
    description: "Compare prices across multiple stores and pick the best option.",
    type: "website",
    locale: "ko_KR",
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};


import ScrollToTop from "@/components/shared/ScrollToTop";

import { UserProvider } from "@/contexts/UserContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import PWAInstallPrompt from "@/components/mobile/PWAInstallPrompt";
import NotificationSystem from "@/components/shared/NotificationSystem";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <UserProvider>
          <LanguageProvider>
            {children}
            <PWAInstallPrompt />
            <NotificationSystem />
            <ScrollToTop />
          </LanguageProvider>
        </UserProvider>
      </body>
    </html>
  );
}
