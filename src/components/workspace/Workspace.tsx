"use client";
// 工作台主组件：聊天驱动智能体（真模型 NDJSON 流 / 演示模式本地生成器）→
// 文件实时写入 → 沙箱预览；支持人工改码、版本回滚、公开分享、导出。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatPanel, type StreamingState } from "./ChatPanel";
import { CodeView } from "./CodeView";
import { PreviewPane, type LogItem } from "./PreviewPane";
import { ShareModal } from "./ShareModal";
import { VersionDrawer } from "./VersionDrawer";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { Logo } from "@/components/Logo";
import { Button, Spinner, Tabs, toast } from "@/components/ui";
import { api, fetchAgentStatus, getLocalKey, type AgentMode } from "@/lib/client";
import { assembleDocument } from "@/lib/agent/assemble";
import { runDemoAgent } from "@/lib/agent/demo";
import { downloadText } from "@/lib/utils";
import type { AgentEvent, ChatMessage, Project, VersionSnapshot } from "@/lib/types";
import { ArrowLeft, Download, History, Settings, Share2 } from "lucide-react";

const IDLE_STREAMING: StreamingState = { active: false, plan: "", stage: "", thinking: "", currentPath: null, doneFiles: [] };

export function Workspace({ id, prefill }: { id: string; prefill: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "missing">("loading");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<AgentMode>("demo");
  const [keyVersion, setKeyVersion] = useState(0);
  const [streaming, setStreaming] = useState<StreamingState>(IDLE_STREAMING);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [selected, setSelected] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const filesRef = useRef(files);
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);
  const stopRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSent = useRef(false);
  filesRef.current = files;
  messagesRef.current = messages;

  // ---- 模式判定（服务端 Key > 个人 BYOK > 演示模式）----
  useEffect(() => {
    fetchAgentStatus()
      .then((s) => setMode(s.hasServerKey ? "server" : getLocalKey() ? "byok" : "demo"))
      .catch(() => setMode("demo"));
  }, [keyVersion]);

  // ---- 加载项目 ----
  useEffect(() => {
    setLoadState("loading");
    api<{ project: Project }>(`/api/projects/${id}`)
      .then(({ project }) => {
        setProject(project);
        setFiles(project.files);
        setPreviewFiles(project.files);
        setMessages(project.messages);
        setSelected(Object.keys(project.files)[0] ?? null);
        setLoadState("ok");
      })
      .catch((e) => {
        if (e.status === 401) router.replace(`/login?next=/w/${id}`);
        else setLoadState("missing");
      });
  }, [id, router]);

  // ---- 首条需求自动发送（从「描述需求」新建时带 prefill）----
  useEffect(() => {
    if (loadState === "ok" && prefill && !autoSent.current && messages.length === 0 && !streaming.active) {
      autoSent.current = true;
      send(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState]);

  const persist = useCallback(
    (body: Record<string, unknown>, label = "保存") => {
      return api<{ project: Project }>(`/api/projects/${id}`, { method: "PATCH", body })
        .then(({ project }) => {
          setProject(project);
          setSaveState("saved");
          return project;
        })
        .catch((e) => {
          toast(`${label}失败：${e.message}`, "err");
          setSaveState("dirty");
          throw e;
        });
    },
    [id]
  );

  // ---- 生成完成收尾：落盘消息 + 版本快照，切预览 ----
  const finalize = useCallback(
    (instruction: string, agentText: string, wroteAny: boolean, stopped: boolean) => {
      const finalFiles = filesRef.current;
      const agentMsg = (agentText.trim() || "已完成。") + (stopped ? "\n（本轮已手动停止）" : "");
      setStreaming(IDLE_STREAMING);
      setMessages((m) => [...m, { role: "agent", text: agentMsg, ts: Date.now() }]);
      setPreviewFiles({ ...finalFiles });
      setTab("preview");
      const body: Record<string, unknown> = {
        appendMessages: [
          { role: "user", text: instruction },
          { role: "agent", text: agentMsg },
        ],
      };
      if (Object.keys(finalFiles).length > 0) body.files = finalFiles;
      if (wroteAny) body.appendVersion = { label: instruction.slice(0, 24), files: finalFiles };
      setSaveState("saving");
      persist(body, "保存生成结果").then(() => wroteAny && toast("已保存新版本 ✅", "ok"));
    },
    [persist]
  );

  // ---- 核心：发送一轮 ----
  const send = useCallback(
    async (instruction: string) => {
      const text = instruction.trim();
      if (!text || streaming.active) return;
      setMessages((m) => [...m, { role: "user", text, ts: Date.now() }]);
      setStreaming({ active: true, plan: "", stage: "", thinking: "", currentPath: null, doneFiles: [] });
      setLogs([]);
      stopRef.current = false;
      let stageText = "";
      let wroteAny = false;

      const handle = (ev: AgentEvent) => {
        if (ev.type === "stage") {
          const t = ev.text;
          stageText += t;
          setStreaming((s) => ({ ...s, stage: s.stage + t }));
        } else if (ev.type === "thinking") {
          const t = ev.text;
          setStreaming((s) => ({ ...s, thinking: s.thinking + t }));
        } else if (ev.type === "plan") {
          const t = ev.text;
          setStreaming((s) => ({ ...s, plan: s.plan + t }));
        } else if (ev.type === "file_start") {
          wroteAny = true;
          const p = ev.path;
          filesRef.current = { ...filesRef.current, [p]: "" };
          setFiles(filesRef.current);
          setStreaming((s) => ({ ...s, currentPath: p }));
          setSelected(p);
          setTab("code");
        } else if (ev.type === "file_delta") {
          const { path: p, delta: d } = ev;
          const next = { ...filesRef.current, [p]: (filesRef.current[p] ?? "") + d };
          filesRef.current = next;
          setFiles(next);
        } else if (ev.type === "file_end") {
          const p = ev.path;
          setStreaming((s) => ({
            ...s,
            doneFiles: [...s.doneFiles, p],
            currentPath: s.currentPath === p ? null : s.currentPath,
          }));
        } else if (ev.type === "error") {
          throw new Error(ev.message);
        }
      };

      const runDemo = async () => {
        for await (const ev of runDemoAgent(text, filesRef.current)) {
          if (stopRef.current) break;
          handle(ev);
        }
      };

      try {
        if (mode === "demo") {
          await runDemo();
        } else {
          const ac = new AbortController();
          abortRef.current = ac;
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (mode === "byok") headers["x-llm-key"] = getLocalKey();
          const res = await fetch("/api/agent", {
            method: "POST",
            headers,
            body: JSON.stringify({
              instruction: text,
              history: messagesRef.current.slice(-8).map((m) => ({ role: m.role, text: m.text })),
              files: filesRef.current,
            }),
            signal: ac.signal,
          });
          if (res.status === 400) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            if (data.error === "NO_KEY") {
              toast("未配置模型 Key，本轮已使用演示模式", "info");
              setMode("demo");
              await runDemo();
            } else {
              throw new Error(data.error ?? "请求失败");
            }
          } else if (!res.ok || !res.body) {
            throw new Error(`模型请求失败（${res.status}）`);
          } else {
            const reader = res.body.getReader();
            const dec = new TextDecoder();
            let buf = "";
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (stopRef.current) {
                ac.abort();
                break;
              }
              buf += dec.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (line.trim()) handle(JSON.parse(line) as AgentEvent);
              }
            }
          }
        }
        finalize(text, stageText, wroteAny, stopRef.current);
      } catch (e) {
        const err = e as Error;
        if (err.name === "AbortError" || stopRef.current) {
          finalize(text, stageText, wroteAny, true);
        } else {
          setStreaming(IDLE_STREAMING);
          setMessages((m) => [...m, { role: "agent", text: "⚠️ " + err.message + "\n可点击输入框重试，或在设置中检查 API Key。", ts: Date.now() }]);
          toast(err.message, "err");
        }
      } finally {
        abortRef.current = null;
      }
    },
    [mode, streaming.active, finalize]
  );

  const stop = () => {
    stopRef.current = true;
    abortRef.current?.abort();
  };

  // ---- 人工编辑文件：防抖自动保存 + 刷新预览 ----
  const onFileSave = useCallback(
    (path: string, content: string) => {
      const next = { ...filesRef.current, [path]: content };
      filesRef.current = next;
      setFiles(next);
      setPreviewFiles({ ...next });
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (Object.keys(filesRef.current).length > 0) {
          persist({ files: filesRef.current }, "保存修改");
        }
      }, 1200);
      toast("已应用修改，预览已刷新", "ok");
    },
    [persist]
  );

  const renameProject = (title: string) => {
    if (!title.trim()) return;
    persist({ title: title.trim() }, "重命名");
  };

  const restoreVersion = (v: VersionSnapshot) => {
    filesRef.current = { ...v.files };
    setFiles(filesRef.current);
    setPreviewFiles(filesRef.current);
    setSelected(Object.keys(v.files)[0] ?? null);
    setVersionsOpen(false);
    setSaveState("saving");
    persist(
      {
        files: filesRef.current,
        appendMessages: [{ role: "agent", text: `⏪ 已回滚至「${v.label}」` }],
        appendVersion: { label: `回滚 → ${v.label}`, files: v.files },
      },
      "回滚"
    ).then(() => toast("已回滚 ✅（原版本仍保留在历史中）", "ok"));
  };

  const exportHtml = () => {
    if (!project) return;
    const safeName = (project.title || "app").replace(/[/\\?%*:|"'<>]/g, "_");
    downloadText(`${safeName}.html`, assembleDocument(filesRef.current), "text/html");
  };

  const previewDoc = useMemo(() => assembleDocument(previewFiles), [previewFiles]);

  // ---- 渲染 ----
  if (loadState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (loadState === "missing" || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">项目不存在或已被删除</p>
        <Link href="/dashboard">
          <Button variant="outline">← 返回我的应用</Button>
        </Link>
      </div>
    );
  }

  const hasFiles = Object.keys(files).length > 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 顶栏 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4">
        <Link href="/dashboard" className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200" title="返回">
          <ArrowLeft size={17} />
        </Link>
        <input
          key={project.id + project.title}
          defaultValue={project.title}
          onBlur={(e) => {
            if (e.target.value.trim() && e.target.value !== project.title) renameProject(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-48 truncate rounded-lg bg-transparent px-2 py-1 text-[15px] font-semibold outline-none transition-colors hover:bg-white/5 focus:bg-white/5 md:w-64"
          title="点击重命名"
        />
        <span className={`text-xs ${saveState === "saved" ? "text-zinc-600" : "text-amber-400/80"}`}>
          {saveState === "saved" ? "已保存" : saveState === "saving" ? "保存中…" : "有未保存修改"}
        </span>
        <span
          className={`ml-1 hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${
            mode === "demo" ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {mode === "server" ? "平台模型" : mode === "byok" ? "个人模型" : "演示模式"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setVersionsOpen(true)}>
            <History size={15} />
            <span className="hidden md:inline">版本 {project.versions.length}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={exportHtml} disabled={!hasFiles}>
            <Download size={15} />
            <span className="hidden md:inline">导出</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 size={14} />
            分享
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} title="模型设置">
            <Settings size={15} />
          </Button>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="h-[46%] shrink-0 border-b border-white/5 lg:h-auto lg:w-[390px] lg:border-b-0 lg:border-r">
          <ChatPanel
            messages={messages}
            streaming={streaming}
            mode={mode}
            onSend={send}
            onStop={stop}
          />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/5 px-3">
            <Tabs
              items={[
                { key: "preview", label: "👁 预览" },
                { key: "code", label: "⌨ 代码" },
              ]}
              active={tab}
              onChange={setTab}
            />
            <Logo size={18} />
          </div>

          <div className={tab === "preview" ? "flex min-h-0 flex-1" : "hidden"}>
            {hasFiles ? (
              <div className="min-h-0 flex-1">
                <PreviewPane
                  doc={previewDoc}
                  logs={logs}
                  onLog={(l) => setLogs((prev) => [...prev.slice(-99), l])}
                  onClearLogs={() => setLogs([])}
                  projectTitle={project.title}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-600">
                <Logo size={44} />
                <p className="text-sm">在左侧描述你的想法，应用将在这里生成</p>
              </div>
            )}
          </div>
          <div className={tab === "code" ? "flex min-h-0 flex-1" : "hidden"}>
            <div className="min-h-0 flex-1">
              <CodeView files={files} selected={selected} streamingPath={streaming.currentPath} onSelect={setSelected} onSave={onFileSave} />
            </div>
          </div>
        </main>
      </div>

      <ShareModal project={project} open={shareOpen} onClose={() => setShareOpen(false)} onUpdated={setProject} />
      <VersionDrawer versions={project.versions} open={versionsOpen} onClose={() => setVersionsOpen(false)} onRestore={restoreVersion} />
      <ApiKeyModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onChanged={() => setKeyVersion((v) => v + 1)} />
    </div>
  );
}
