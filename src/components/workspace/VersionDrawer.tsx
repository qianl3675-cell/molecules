"use client";
// 版本历史抽屉：每轮生成快照，一键回滚（回滚本身也会产生新版本）
import { Button } from "@/components/ui";
import { formatTime, timeAgo } from "@/lib/utils";
import type { VersionSnapshot } from "@/lib/types";
import { History, RotateCcw, X } from "lucide-react";

export function VersionDrawer({
  versions,
  open,
  onClose,
  onRestore,
}: {
  versions: VersionSnapshot[];
  open: boolean;
  onClose: () => void;
  onRestore: (v: VersionSnapshot) => void;
}) {
  if (!open) return null;
  const list = [...versions].reverse(); // 最新在前
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-80 flex-col border-l border-white/10 bg-ink-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <History size={15} className="text-brand-400" /> 版本历史
          </span>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:text-zinc-200">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {list.length === 0 && <p className="pt-8 text-center text-xs text-zinc-600">暂无版本记录</p>}
          {list.map((v, i) => (
            <div key={v.id} className="card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium">
                  {v.label}
                  {i === 0 && <span className="ml-1.5 rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] text-brand-300">最新</span>}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-zinc-600">
                  {timeAgo(v.ts)} · {formatTime(v.ts)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">{Object.keys(v.files).length} 个文件 · {(JSON.stringify(v.files).length / 1024).toFixed(1)} KB</p>
              {i !== 0 && (
                <Button size="sm" variant="outline" className="mt-2.5 w-full" onClick={() => onRestore(v)}>
                  <RotateCcw size={12} /> 回滚到此版本
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="border-t border-white/5 px-4 py-3 text-[11px] leading-5 text-zinc-600">
          回滚会以「新版本」形式应用，不会丢弃任何历史 —— 随时可以再滚回来。
        </p>
      </div>
    </div>
  );
}
