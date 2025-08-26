import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/app/QueryProvider";
import HeaderGate from "@/components/HeaderGate";
import AuthSessionProvider from "@/app/AuthSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N잡 AI | 전국민을 위한 돈버는 AI 시스템 플랫폼",
  description:
    "누구나 쉽게 시작할 수 있는 AI 자동화 수익 시스템. 전국민을 위한 N잡 플랫폼으로 지금 바로 월수익을 만들어보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="antialiased bg-black">
        <AuthSessionProvider>
          <QueryProvider>
            <HeaderGate />
            {children}
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
