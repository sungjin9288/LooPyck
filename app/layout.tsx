import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} - Smart Fashion Price Comparison`,
  description: "Compare prices across multiple stores and pick the best option. LooPyck uses smart search to help you shop efficiently.",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    title: `${SITE_NAME} - Smart Fashion Price Comparison`,
    description: "Compare prices across multiple stores and pick the best option.",
    url: SITE_URL,
    siteName: SITE_NAME,
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
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

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
        <ErrorBoundary>
          <UserProvider>
            <LanguageProvider>
              {children}
              <PWAInstallPrompt />
              <NotificationSystem />
              <ScrollToTop />
            </LanguageProvider>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
