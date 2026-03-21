import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "FIT 헤어컨설팅 — MERCI MOMONG",
  description: "오늘 나에게 가장 어울리는 디자인을 제안합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-white text-[#111111]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
