import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeaturesProvider } from "@/contexts/FeaturesContext";
import { DevMock } from "@/components/DevMock";

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
        {/* 개발 전용 목업(/dev) — NODE_ENV 가 development 일 때만 동작, 화면에는 아무것도 그리지 않는다 */}
        <DevMock />
        <AuthProvider>
          <FeaturesProvider>{children}</FeaturesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
