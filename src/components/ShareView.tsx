"use client";
// 分享页视图：全屏沙箱预览 + 底部品牌条 + Remix
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button, Spinner, toast } from "@/components/ui";
import { api } from "@/lib/client";
import { GitFork } from "lucide-react";

export function ShareView({ title, projectId, html }: { title: string; projectId: string; html: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remix = async () => {
    setBusy(true);
    try {
      const { project } = await api<{ project: { id: string } }>("/api/projects", {
        method: "POST",
        body: { copyFrom: projectId },
      });
      toast("已复制到你的工作台 ✨", "ok");
      router.push(`/w/${project.id}`);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (err.status === 401) {
        router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
      } else {
        toast(err.message ?? "Remix 失败", "err");
        setBusy(false);
      }
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="min-h-0 flex-1 bg-[#0d0d18]">
        <iframe srcDoc={html} sandbox="allow-scripts" title={title} className="h-full w-full border-0 bg-white" />
      </div>
      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-white/10 bg-ink-900 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={22} />
          <span className="truncate text-sm font-medium">{title}</span>
          <span className="hidden text-xs text-zinc-600 sm:inline">由智能体生成</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={remix} disabled={busy}>
            {busy ? <Spinner /> : <GitFork size={14} />}
            Remix 到我的工作台
          </Button>
          <Link
            href="/login"
            className="hidden text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:inline"
          >
            用 Molecules 创建你的应用 →
          </Link>
        </div>
      </footer>
    </div>
  );
}
