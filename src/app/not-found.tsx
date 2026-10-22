import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 text-center">
      <Logo size={52} />
      <h1 className="text-2xl font-bold">页面不存在</h1>
      <p className="max-w-sm text-sm leading-6 text-zinc-500">
        链接可能已失效，或该应用已被作者设为私密。
      </p>
      <Link
        href="/"
        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-glow transition-colors hover:bg-brand-500"
      >
        返回首页
      </Link>
    </div>
  );
}
