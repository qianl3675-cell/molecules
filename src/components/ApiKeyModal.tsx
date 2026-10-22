"use client";
// 设置弹窗：BYOK 填入自己的 Anthropic API Key（仅存浏览器 localStorage）
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Modal, toast } from "@/components/ui";
import { fetchAgentStatus, getLocalKey, setLocalKey, type AgentStatus } from "@/lib/client";
import { cn } from "@/lib/utils";

export function ApiKeyModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged?: () => void }) {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getLocalKey());
      fetchAgentStatus().then(setStatus).catch(() => setStatus(null));
    }
  }, [open]);

  const mode = status ? (status.hasServerKey ? "server" : getLocalKey() ? "byok" : "demo") : "demo";

  const save = () => {
    setLocalKey(key.trim());
    toast(key.trim() ? "已保存，将使用你的 Key 调用模型" : "已清除本地 Key", "ok");
    onChanged?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="模型设置">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-850 px-4 py-3">
          <span className="text-zinc-400">当前模式</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              mode === "server" && "bg-emerald-500/15 text-emerald-300",
              mode === "byok" && "bg-brand-500/15 text-brand-300",
              mode === "demo" && "bg-amber-500/15 text-amber-300"
            )}
          >
            {mode === "server" ? "服务端模型（平台已配置）" : mode === "byok" ? "个人模型（BYOK）" : "演示模式（内置模板智能体）"}
          </span>
        </div>

        {status && !status.hasServerKey && (
          <div>
            <p className="mb-2 text-zinc-400">
              填入你的 Anthropic API Key 后，即可由大模型自由生成任意应用。
              Key 仅保存在你的浏览器本地，只随生成请求传输，不会存储到服务器。
            </p>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input pr-14 font-mono text-xs"
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {show ? "隐藏" : "显示"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              模型：<span className="font-mono text-zinc-400">{status.model}</span> · 获取 Key：
              <Link href="https://console.anthropic.com" target="_blank" className="text-brand-400 hover:underline">
                console.anthropic.com
              </Link>
            </p>
          </div>
        )}

        {status?.hasServerKey && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300/90">
            平台已配置服务端模型（{status.model}），直接使用即可，无需个人 Key。
          </p>
        )}

        {mode === "demo" && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 leading-6 text-amber-200/80">
            演示模式下无需任何配置：内置模板智能体会按需求意图生成完整应用（支持换主题色/改名等轻量迭代）。
          </p>
        )}

        {status && !status.hasServerKey && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button onClick={save}>保存</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
