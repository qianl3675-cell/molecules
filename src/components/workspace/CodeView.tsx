"use client";
// 代码视图：文件树 + 语法高亮阅读 / 编辑双模式（人工改码，AI 协同）
import { useEffect, useMemo, useRef, useState } from "react";
import Prism from "prismjs";
import { Button } from "@/components/ui";
import { cn, langOf } from "@/lib/utils";
import { Check, FileCode, Pencil, Save, X } from "lucide-react";

function fileOrder(a: string, b: string) {
  const w = (p: string) => (p === "index.html" ? 0 : p.endsWith(".css") ? 1 : p.endsWith(".js") ? 2 : 3);
  return w(a) - w(b) || a.localeCompare(b);
}

export function CodeView({
  files,
  selected,
  streamingPath,
  onSelect,
  onSave,
}: {
  files: Record<string, string>;
  selected: string | null;
  streamingPath: string | null;
  onSelect: (path: string) => void;
  onSave: (path: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const preRef = useRef<HTMLPreElement>(null);
  const paths = Object.keys(files).sort(fileOrder);
  const current = selected && files[selected] !== undefined ? selected : paths[0] ?? null;
  const code = current ? files[current] ?? "" : "";

  useEffect(() => {
    setEditing(false);
  }, [current]);

  // 流式写入时自动滚到底部
  useEffect(() => {
    if (streamingPath && streamingPath === current && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [code, streamingPath, current]);

  const lang = current ? langOf(current) : "markup";
  const highlighted = useMemo(() => {
    try {
      const g = Prism.languages[lang] ?? Prism.languages.markup;
      return Prism.highlight(editing ? draft : code, g, lang);
    } catch {
      return code;
    }
  }, [code, draft, editing, lang]);

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        暂无文件 —— 先在左侧让智能体生成应用
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* 文件树 */}
      <div className="w-44 shrink-0 overflow-y-auto border-r border-white/5 p-2">
        {paths.map((p) => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-xs transition-colors",
              p === current ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            )}
          >
            <FileCode size={13} className="shrink-0 opacity-60" />
            <span className="truncate">{p}</span>
            {streamingPath === p && <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-400" />}
          </button>
        ))}
      </div>

      {/* 代码区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
          <span className="font-mono text-xs text-zinc-500">
            {current} · {(code.length / 1024).toFixed(1)} KB
          </span>
          {editing ? (
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => { onSave(current, draft); setEditing(false); }}>
                <Save size={13} /> 保存并刷新预览
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X size={13} />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { setDraft(code); setEditing(true); }}>
              <Pencil size={13} /> 编辑
            </Button>
          )}
        </div>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-[#0b0b14] p-4 font-mono text-[12.5px] leading-relaxed text-zinc-200 outline-none"
          />
        ) : (
          <pre
            ref={preRef}
            className="min-h-0 flex-1 overflow-auto bg-[#0b0b14] p-4 font-mono text-[12.5px] leading-relaxed"
          >
            <code dangerouslySetInnerHTML={{ __html: highlighted + "\n" }} />
          </pre>
        )}
      </div>
    </div>
  );
}
