import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationProgressBar } from "@/shared/components/NavigationProgressBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام إدارة مستودعات زهرة المحيط لتصدير الأسماك | Ocean Flower",
  description: "نظام متكامل لإدارة مستودعات التبريد ومخزون الأسماك وحساب رسوم التخزين وسندات الإدخال والصرف - شركة زهرة المحيط لتصدير الأسماك",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
