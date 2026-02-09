import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LooPyck - Smart Fashion Price Comparison",
  description: "Compare prices across multiple stores and pick the best option. LooPyck uses smart search to help you shop efficiently.",
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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFFFFF',
};


import ScrollToTop from "@/components/shared/ScrollToTop";

// ... existing code ...

import { UserProvider } from "@/contexts/UserContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import PWAInstallPrompt from "@/components/mobile/PWAInstallPrompt";
import StyleChat from "@/components/ai/StyleChat";
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
            <PWAInstallPrompt />
            <StyleChat />
            <NotificationSystem />
            <ScrollToTop />
          </LanguageProvider>
        </UserProvider>
      </body>
    </html>
  );
}
