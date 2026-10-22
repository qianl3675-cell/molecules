"use client";
// 登录 / 注册 / 一键游客体验
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoText } from "@/components/Logo";
import { Button, Input, Spinner, toast } from "@/components/ui";
import { api } from "@/lib/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"form" | "demo" | null>(null);

  const go = () => router.replace(params.get("next") ?? "/dashboard");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("form");
    try {
      await api(`/api/auth/${tab}`, { method: "POST", body: { username, password } });
      toast(tab === "login" ? "欢迎回来 👋" : "注册成功，开始创造吧 🎉", "ok");
      go();
    } catch (err) {
      toast((err as Error).message, "err");
      setBusy(null);
    }
  };

  const demo = async () => {
    setBusy("demo");
    try {
      await api("/api/auth/demo", { method: "POST" });
      toast("已进入游客模式，数据将保留", "ok");
      go();
    } catch (err) {
      toast((err as Error).message, "err");
      setBusy(null);
    }
  };

  useEffect(() => {
    if (params.get("demo") === "1") demo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(700px_400px_at_50%_-10%,rgba(124,58,237,.14),transparent)] p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <LogoText />
        </Link>
        <div className="card p-7">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-ink-900 p-1 text-sm">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg py-2 transition-colors ${tab === t ? "bg-white/10 font-medium text-zinc-100" : "text-zinc-500"}`}
              >
                {t === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-3.5">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名（2-16 位）"
              autoComplete="username"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码（至少 6 位）"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              required
            />
            <Button type="submit" size="lg" className="w-full" disabled={busy !== null}>
              {busy === "form" ? <Spinner /> : tab === "login" ? "登录" : "创建账号"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-zinc-600">
            <span className="h-px flex-1 bg-white/10" /> 或 <span className="h-px flex-1 bg-white/10" />
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={demo} disabled={busy !== null}>
            {busy === "demo" ? <Spinner /> : "🚀 一键游客体验"}
          </Button>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-zinc-600">
          数据存储于服务端（演示部署为浏览器无关的 Redis/文件），游客模式使用共享 demo 账号
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
