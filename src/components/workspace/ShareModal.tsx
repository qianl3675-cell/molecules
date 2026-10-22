"use client";
// 分享弹窗：公开开关 + 链接复制 + Remix 说明
import { useState } from "react";
import { Button, Modal, toast } from "@/components/ui";
import { api } from "@/lib/client";
import type { Project } from "@/lib/types";
import { Copy, Globe, Lock } from "lucide-react";

export function ShareModal({
  project,
  open,
  onClose,
  onUpdated,
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
  onUpdated: (p: Project) => void;
}) {
  const [busy, setBusy] = useState(false);
  const shareUrl = project.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${project.slug}` : "";

  const toggle = async (next: boolean) => {
    setBusy(true);
    try {
      const { project: p } = await api<{ project: Project }>(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: { isPublic: next },
      });
      onUpdated(p);
      toast(next ? "已公开，任何人可通过链接访问" : "已切换为私密", "ok");
    } catch (err) {
      toast((err as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("链接已复制", "ok");
    } catch {
      toast("复制失败，请手动选择复制", "err");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="分享应用">
      <div className="space-y-4 text-sm">
        <button
          onClick={() => toggle(!project.isPublic)}
          disabled={busy}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-ink-850 px-4 py-3.5 transition-colors hover:border-white/15"
        >
          <span className="flex items-center gap-3">
            {project.isPublic ? <Globe size={17} className="text-emerald-400" /> : <Lock size={17} className="text-zinc-500" />}
            <span>
              <span className="block font-medium">{project.isPublic ? "公开访问" : "私密"}</span>
              <span className="block text-xs text-zinc-500">
                {project.isPublic ? "任何人可通过链接查看和体验" : "仅自己可见"}
              </span>
            </span>
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${project.isPublic ? "bg-emerald-500" : "bg-zinc-700"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${project.isPublic ? "left-[22px]" : "left-0.5"}`}
            />
          </span>
        </button>

        {project.isPublic && project.slug && (
          <div className="flex gap-2">
            <input readOnly value={shareUrl} className="input flex-1 font-mono text-xs" onFocus={(e) => e.target.select()} />
            <Button onClick={copy}>
              <Copy size={14} /> 复制
            </Button>
          </div>
        )}

        <p className="rounded-xl border border-white/5 bg-ink-900 px-4 py-3 text-xs leading-6 text-zinc-500">
          💡 访客打开分享链接即可直接体验你的应用；登录后还可以点击「Remix」复制一份源文件，
          在自己的工作台中继续改造。
        </p>
      </div>
    </Modal>
  );
}
