import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "패션 가격 비교 - 똑똑한 쇼핑의 시작",
  description: "여러 쇼핑몰의 가격을 한눈에 비교하고 가성비 있게 쇼핑하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
