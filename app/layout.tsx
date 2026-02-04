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

import ScrollToTop from "@/components/shared/ScrollToTop";

// ... existing code ...

import { UserProvider } from "@/contexts/UserContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <UserProvider>
          {children}
          <ScrollToTop />
        </UserProvider>
      </body>
    </html>
  );
}
