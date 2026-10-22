import Link from "next/link";
import { LogoText } from "@/components/Logo";
import { ArrowRight, Sparkles, Zap, Share2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(900px_480px_at_70%_-10%,rgba(124,58,237,.16),transparent)]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <LogoText />
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-zinc-400 transition-colors hover:text-zinc-100">
            登录
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white shadow-glow transition-colors hover:bg-brand-500"
          >
            进入工作台
          </Link>
        </div>
      </nav>

      <header className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800/80 px-4 py-1.5 text-[13px] text-brand-300">
          <Sparkles size={14} /> AI Native · 像 Atoms 一样构建应用
        </div>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
          一句话，生成
          <span className="bg-gradient-to-r from-brand-300 to-fuchsia-400 bg-clip-text text-transparent">可运行的应用</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl leading-8 text-zinc-400">
          Molecules 是一个迷你版「Atoms」：向智能体描述你的想法，它将规划、编写并实时预览一个完整网页应用；
          你可以继续对话迭代、亲手修改代码、回滚历史版本，并把作品分享给任何人。
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-glow transition-all hover:bg-brand-500 active:scale-[0.98]"
          >
            免费开始构建 <ArrowRight size={16} />
          </Link>
          <Link
            href="/login?demo=1"
            className="rounded-xl border border-white/15 px-7 py-3.5 text-[15px] text-zinc-300 transition-colors hover:border-white/50 hover:bg-white/5"
          >
            一键游客体验
          </Link>
        </div>

        {/* 模拟工作台窗口 */}
        <div className="card mx-auto mt-16 max-w-3xl overflow-hidden text-left shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
            <span className="ml-3 text-xs text-zinc-500">molecules · 工作台</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/5 text-[13px]">
            <div className="space-y-3 p-5">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-white">
                帮我做一个贪吃蛇小游戏
              </div>
              <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-ink-700 px-3.5 py-2 text-zinc-300">
                收到！我来构建「贪吃蛇」🐍
                <div className="mt-2 space-y-1 text-xs text-zinc-500">
                  <div>✓ 搭建页面结构</div>
                  <div>✓ 编写视觉样式</div>
                  <div className="text-brand-300">⟳ 实现交互逻辑…</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center p-5">
              <div className="flex h-32 w-full items-center justify-center rounded-xl border border-white/10 bg-[repeating-linear-gradient(45deg,#141428_0_10px,#181832_10px_20px)] text-4xl">
                🐍🍎
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-24 sm:grid-cols-3">
        {[
          { icon: Zap, title: "流式生成", desc: "计划 → 多文件代码 → 实时预览，全过程可视；生成完即可在沙箱中直接体验。" },
          { icon: Sparkles, title: "人机协同", desc: "继续对话迭代，或直接上手改代码；每一轮生成都有版本快照，可随时回滚。" },
          { icon: Share2, title: "一键分享", desc: "公开链接即可让任何人体验你的应用，还能被他人 Remix 再创作。" },
        ].map((f) => (
          <div key={f.title} className="card p-6 transition-colors hover:border-brand-500/40">
            <f.icon size={22} className="text-brand-400" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-[13px] text-zinc-600">
        Molecules —— Atoms 的同源小兄弟 · 用一句话开启创造
      </footer>
    </div>
  );
}
