import type { Metadata } from "next";
import { FlashMessage } from "@/components/flash-message";
import "./globals.css";

export const metadata: Metadata = {
  title: "KST ERP | 鋒冠科技",
  description: "Keenness Technology Co., Ltd. ERP system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-[#f7f6fd] text-[#26223d] antialiased">
        {children}
        <FlashMessage />
      </body>
    </html>
  );
}
