"use client";
// 新建应用弹窗：描述需求（进入工作台由智能体生成） / 从模板开始
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Spinner, Tabs, toast } from "@/components/ui";
import { api } from "@/lib/client";
import { TEMPLATES } from "@/lib/templates";
import { titleFromPrompt } from "@/lib/utils";

const SUGGESTIONS = ["一个带筛选和本地存储的待办清单", "番茄工作法专注计时器", "贪吃蛇小游戏，有最高分记录", "一个 SaaS 产品的营销落地页"];

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<"desc" | "tpl">("desc");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const createByDesc = async () => {
    const text = prompt.trim();
    setBusy("desc");
    try {
      const { project } = await api<{ project: { id: string } }>("/api/projects", {
        method: "POST",
        body: { title: titleFromPrompt(text) },
      });
      router.push(`/w/${project.id}?prefill=${encodeURIComponent(text)}`);
    } catch (err) {
      toast((err as Error).message, "err");
      setBusy(null);
    }
  };

  const createByTpl = async (key: string) => {
    setBusy(key);
    try {
      const { project } = await api<{ project: { id: string } }>("/api/projects", {
        method: "POST",
        body: { template: key },
      });
      router.push(`/w/${project.id}`);
    } catch (err) {
      toast((err as Error).message, "err");
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="新建应用" wide>
      <Tabs
        className="mb-5"
        items={[
          { key: "desc", label: "✍️ 描述需求" },
          { key: "tpl", label: "📦 从模板开始" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "desc" ? (
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="描述你想构建的应用，例如：一个可以记录番茄钟专注次数的计时器…"
            className="input resize-none leading-6"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-brand-500/50 hover:text-zinc-200"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button onClick={createByDesc} disabled={!prompt.trim() || busy !== null}>
              {busy === "desc" ? <Spinner /> : "开始生成 →"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => createByTpl(t.key)}
              disabled={busy !== null}
              className="card group p-4 text-left transition-all hover:border-brand-500/50 hover:shadow-glow disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-xl">{t.emoji}</span>
                <div>
                  <div className="text-sm font-medium">
                    {t.name}
                    {busy === t.key && <Spinner className="ml-2 inline" />}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">{t.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
