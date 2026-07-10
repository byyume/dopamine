import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const galmuri = localFont({
  src: [
    { path: "./fonts/Galmuri11.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Galmuri11-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-galmuri",
});

export const metadata: Metadata = {
  title: "도파민 뿜뿜 카지노",
  description: "슬롯머신과 주식으로 인생역전! 도트 감성 도파민 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${galmuri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
