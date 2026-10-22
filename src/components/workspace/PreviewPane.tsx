"use client";
// 预览面板：沙箱 iframe（blob URL）+ 设备切换 + 运行控制台（postMessage 捕获）
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eraser, ExternalLink, Monitor, RotateCw, Smartphone, Terminal } from "lucide-react";

export interface LogItem {
  level: "log" | "info" | "warn" | "error";
  text: string;
  ts: number;
}

export function PreviewPane({
  doc,
  logs,
  onLog,
  onClearLogs,
  projectTitle,
}: {
  doc: string;
  logs: LogItem[];
  onLog: (l: LogItem) => void;
  onClearLogs: () => void;
  projectTitle: string;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showConsole, setShowConsole] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [url, setUrl] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);
  const onLogRef = useRef(onLog);
  onLogRef.current = onLog;

  // 组装文档 -> blob URL（doc 变化或手动刷新时重建）
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [doc, nonce]);

  // 监听沙箱 harness 上报
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { __molecules?: number; type?: string; payload?: { level?: string; args?: string[] } };
      if (!d || d.__molecules !== 1 || d.type !== "console") return;
      onLogRef.current({
        level: (d.payload?.level as LogItem["level"]) ?? "log",
        text: (d.payload?.args ?? []).join(" "),
        ts: Date.now(),
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight });
  }, [logs]);

  const errCount = useMemo(() => logs.filter((l) => l.level === "error").length, [logs]);

  const openNewTab = () => {
    const u = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    window.open(u, "_blank");
    setTimeout(() => URL.revokeObjectURL(u), 30_000);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-ink-900 p-0.5">
          <button
            onClick={() => setDevice("desktop")}
            className={cn("rounded-md p-1.5 transition-colors", device === "desktop" ? "bg-white/10 text-zinc-100" : "text-zinc-500")}
            title="桌面"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={cn("rounded-md p-1.5 transition-colors", device === "mobile" ? "bg-white/10 text-zinc-100" : "text-zinc-500")}
            title="移动端"
          >
            <Smartphone size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              showConsole ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Terminal size={13} />
            控制台
            {errCount > 0 && (
              <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] font-medium text-red-400">{errCount}</span>
            )}
          </button>
          <button onClick={() => setNonce((n) => n + 1)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-300" title="刷新预览">
            <RotateCw size={14} />
          </button>
          <button onClick={openNewTab} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-300" title="新标签打开">
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* iframe 舞台 */}
      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto bg-[#0d0d18] p-3">
        <div
          className={cn(
            "h-full overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl",
            device === "mobile" ? "w-[390px] max-w-full" : "w-full"
          )}
        >
          {url && (
            <iframe
              key={url}
              src={url}
              sandbox="allow-scripts"
              title={`预览 · ${projectTitle}`}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>

      {/* 控制台抽屉 */}
      {showConsole && (
        <div className="flex h-44 shrink-0 flex-col border-t border-white/5 bg-ink-900">
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-zinc-500">
            <span>运行控制台（console / 错误 / alert 拦截）</span>
            <button onClick={onClearLogs} className="flex items-center gap-1 hover:text-zinc-300">
              <Eraser size={11} /> 清空
            </button>
          </div>
          <div ref={consoleRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 font-mono text-[11.5px] leading-5">
            {logs.length === 0 && <p className="pt-3 text-center text-zinc-600">暂无输出</p>}
            {logs.map((l, i) => (
              <p
                key={i}
                className={cn(
                  "whitespace-pre-wrap break-all border-b border-white/5 py-1",
                  l.level === "error" && "text-red-400",
                  l.level === "warn" && "text-amber-400",
                  (l.level === "log" || l.level === "info") && "text-zinc-400"
                )}
              >
                <span className="mr-2 opacity-40">{l.level}</span>
                {l.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
