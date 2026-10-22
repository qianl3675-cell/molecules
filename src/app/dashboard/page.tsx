"use client";
// 我的应用：网格、新建、重命名、删除、公开徽标
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { NewProjectModal } from "@/components/NewProjectModal";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { Button, Modal, Input, Spinner, toast } from "@/components/ui";
import { api } from "@/lib/client";
import { timeAgo } from "@/lib/utils";
import type { ProjectMeta } from "@/lib/types";
import { Globe, Pencil, Plus, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>();
  const [projects, setProjects] = useState<ProjectMeta[] | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renaming, setRenaming] = useState<ProjectMeta | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [deleting, setDeleting] = useState<ProjectMeta | null>(null);

  const load = useCallback(async () => {
    try {
      const [me, list] = await Promise.all([
        api<{ user: { username: string } | null }>("/api/auth/me"),
        api<{ projects: ProjectMeta[] }>("/api/projects"),
      ]);
      if (!me.user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setUsername(me.user.username);
      setProjects(list.projects);
    } catch (err) {
      toast((err as Error).message, "err");
      setProjects([]);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const doRename = async () => {
    if (!renaming || !renameVal.trim()) return;
    try {
      await api(`/api/projects/${renaming.id}`, { method: "PATCH", body: { title: renameVal.trim() } });
      setRenaming(null);
      load();
    } catch (err) {
      toast((err as Error).message, "err");
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await api(`/api/projects/${deleting.id}`, { method: "DELETE" });
      toast("已删除", "ok");
      setDeleting(null);
      load();
    } catch (err) {
      toast((err as Error).message, "err");
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <Header username={username} onSettings={() => setSettingsOpen(true)} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">我的应用</h1>
          <p className="mt-1 text-sm text-zinc-500">用一句话开始，或者从模板改造</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={16} /> 新建应用
        </Button>
      </div>

      {projects === null ? (
        <div className="flex justify-center py-24 text-zinc-500">
          <Spinner className="h-6 w-6" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
          <span className="text-5xl">🧪</span>
          <p className="text-zinc-400">还没有应用——让智能体为你创造第一个吧</p>
          <Button onClick={() => setNewOpen(true)}>
            <Plus size={16} /> 创建第一个应用
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/w/${p.id}`)}
              className="card group cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-glow"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-fuchsia-500/10 text-xl">
                  ⚛️
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming(p);
                      setRenameVal(p.title);
                    }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                    title="重命名"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(p);
                    }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 truncate font-medium">{p.title}</h3>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                {timeAgo(p.updatedAt)} · {p.fileCount} 个文件
                {p.isPublic && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                    <Globe size={11} /> 公开
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} />
      <ApiKeyModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="重命名应用">
        <div className="space-y-4">
          <Input
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            placeholder="新名称"
            onKeyDown={(e) => e.key === "Enter" && doRename()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              取消
            </Button>
            <Button onClick={doRename}>保存</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="删除应用">
        <p className="text-sm leading-6 text-zinc-400">
          确定删除「{deleting?.title}」吗？包含全部版本历史，操作不可撤销。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            取消
          </Button>
          <Button variant="danger" onClick={doDelete}>
            删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
