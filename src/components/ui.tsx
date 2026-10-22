"use client";
// 基础 UI 组件：Button / Input / Modal / Tabs / Spinner / Toast
import { useEffect, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-1.5 rounded-xl font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-[13px]",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-[15px]",
        variant === "primary" && "bg-brand-600 text-white shadow-glow hover:bg-brand-500",
        variant === "ghost" && "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
        variant === "outline" && "border border-white/15 text-zinc-200 hover:border-white/50 hover:bg-white/5",
        variant === "danger" && "bg-red-500/10 text-red-400 hover:bg-red-500/20",
        variant === "subtle" && "bg-white/5 text-zinc-200 hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "card relative z-10 w-full p-6 shadow-2xl",
          wide ? "max-w-2xl" : "max-w-md"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  className,
}: {
  items: Array<{ key: T; label: string; badge?: number | string }>;
  active: T;
  onChange: (k: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
            active === it.key ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {it.label}
          {it.badge !== undefined && it.badge !== 0 && (
            <span className="ml-1.5 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-300">{it.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------------- Toast ----------------
type ToastItem = { id: number; msg: string; kind: "ok" | "err" | "info" };
let toasts: ToastItem[] = [];
let toastListeners: Set<(t: ToastItem[]) => void> = new Set();
let toastSeq = 1;

export function toast(msg: string, kind: ToastItem["kind"] = "info") {
  const t = { id: toastSeq++, msg, kind };
  toasts = [...toasts, t];
  toastListeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l(toasts));
  }, kind === "err" ? 5000 : 3000);
}

export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    toastListeners.add(setList);
    return () => void toastListeners.delete(setList);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto animate-[fadein_.2s_ease] rounded-xl border px-4 py-2.5 text-sm shadow-xl backdrop-blur",
            t.kind === "ok" && "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
            t.kind === "err" && "border-red-500/30 bg-red-500/15 text-red-200",
            t.kind === "info" && "border-white/10 bg-ink-800/95 text-zinc-200"
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
