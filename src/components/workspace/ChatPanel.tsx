"use client";
// 左侧对话面板：消息流 + 流式生成状态（计划清单/实时写入文件）+ 输入区
import { useEffect, useRef, useState } from "react";
import { Button, Spinner, toast } from "@/components/ui";
import { cn, formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import type { AgentMode } from "@/lib/client";
import { ArrowUp, Bot, Square, User } from "lucide-react";

export interface StreamingState {
  active: boolean;
  plan: string;
  stage: string;
  currentPath: string | null;
  doneFiles: string[];
}

const SUGGESTIONS = ["帮我做一个待办清单应用", "番茄工作法计时器", "贪吃蛇小游戏", "一个产品落地页"];

export function ChatPanel({
  messages,
  streaming,
  mode,
  onSend,
  onStop,
  initialText,
}: {
  messages: ChatMessage[];
  streaming: StreamingState;
  mode: AgentMode;
  onSend: (text: string) => void;
  onStop: () => void;
  initialText?: string;
}) {
  const [text, setText] = useState(initialText ?? "");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming.stage, streaming.plan]);

  const submit = () => {
    const t = text.trim();
    if (!t || streaming.active) return;
    onSend(t);
    setText("");
  };

  const planSteps = streaming.plan
    .split("\n")
    .map((s) => s.replace(/^\s*\d+[.、)]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 消息列表 */}
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !streaming.active && (
          <div className="pt-10 text-center">
            <div className="text-4xl">🧬</div>
            <p className="mt-4 text-[15px] font-medium text-zinc-300">描述你想构建的应用</p>
            <p className="mt-1.5 text-[13px] leading-6 text-zinc-500">
              智能体将规划方案、编写代码并实时预览
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                m.role === "user" ? "bg-brand-600/20 text-brand-300" : "bg-white/5 text-zinc-400"
              )}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </span>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-6",
                m.role === "user"
                  ? "rounded-tr-md bg-brand-600 text-white"
                  : "rounded-tl-md bg-ink-800 text-zinc-200"
              )}
            >
              {m.text}
              <span className="ml-2 align-baseline text-[10px] opacity-40">{formatTime(m.ts)}</span>
            </div>
          </div>
        ))}

        {/* 流式生成状态卡 */}
        {streaming.active && (
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
              <Bot size={14} />
            </span>
            <div className="w-[85%] rounded-2xl rounded-tl-md bg-ink-800 px-3.5 py-3 text-[13px]">
              {streaming.stage && (
                <p className="whitespace-pre-wrap leading-6 text-zinc-200">{streaming.stage}</p>
              )}
              {planSteps.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {planSteps.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-400">
                      {i < planSteps.length - 1 || streaming.currentPath ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <Spinner className="h-3 w-3 text-brand-400" />
                      )}
                      <span className="truncate">{s}</span>
                    </li>
                  ))}
                </ul>
              )}
              {streaming.currentPath && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-ink-900 px-2.5 py-1.5 font-mono text-[11.5px] text-brand-300">
                  <Spinner className="h-3 w-3" />
                  <span className="truncate">writing {streaming.currentPath}</span>
                </div>
              )}
              {streaming.doneFiles.length > 0 && !streaming.currentPath && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {streaming.doneFiles.map((f) => (
                    <span key={f} className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">
                      ✓ {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t border-white/5 p-3">
        {messages.length === 0 && !streaming.active && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSend(s)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-brand-500/50 hover:text-zinc-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder={streaming.active ? "生成中…" : "描述应用或提出修改需求（Enter 发送，Shift+Enter 换行）"}
            className="input max-h-32 resize-none pr-12 text-[13.5px] leading-6"
            disabled={streaming.active}
          />
          {streaming.active ? (
            <Button variant="subtle" size="sm" className="absolute bottom-2.5 right-2.5" onClick={onStop}>
              <Square size={12} /> 停止
            </Button>
          ) : (
            <Button size="sm" className="absolute bottom-2.5 right-2.5" onClick={submit} disabled={!text.trim()}>
              <ArrowUp size={14} />
            </Button>
          )}
        </div>
        {mode === "demo" && (
          <p className="mt-2 text-center text-[11px] text-amber-400/70">
            演示模式（未配置模型）· 在「设置」填入 API Key 解锁自由生成
          </p>
        )}
      </div>
    </div>
  );
}
