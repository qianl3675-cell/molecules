import type { Metadata } from "next";
import "./globals.css";
import "prismjs/themes/prism-tomorrow.css";
import { ToastHost } from "@/components/ui";

export const metadata: Metadata = {
  title: "Molecules · AI 应用工坊",
  description: "像 Atoms 一样：一句话描述需求，智能体为你生成可运行的应用，实时预览、持续迭代、一键分享。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-ink-950 font-sans text-zinc-100 antialiased">
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
