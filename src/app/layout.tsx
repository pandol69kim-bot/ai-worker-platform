import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 직원 메이커 | 전문가의 노하우를 AI로",
  description: "전문가의 업무 노하우를 AI 직원으로 제작하고 검수·유통·판매할 수 있는 AI 직원 마켓플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col bg-gray-50">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
              <p>© 2026 AI 직원 메이커 플랫폼. 전문가의 노하우를 AI로.</p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
