"use client";
// 仪表盘顶栏
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoText } from "@/components/Logo";
import { Button, toast } from "@/components/ui";
import { api } from "@/lib/client";
import { LogOut, Settings } from "lucide-react";

export function Header({ username, onSettings }: { username?: string; onSettings: () => void }) {
  const router = useRouter();
  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (err) {
      toast((err as Error).message, "err");
    }
  };
  return (
    <header className="mb-8 flex items-center justify-between">
      <Link href="/">
        <LogoText />
      </Link>
      <div className="flex items-center gap-2 text-sm">
        {username && <span className="mr-1 text-zinc-500">@{username}</span>}
        <Button variant="ghost" size="sm" onClick={onSettings} title="模型设置">
          <Settings size={15} />
        </Button>
        <Button variant="ghost" size="sm" onClick={logout} title="退出登录">
          <LogOut size={15} />
        </Button>
      </div>
    </header>
  );
}
