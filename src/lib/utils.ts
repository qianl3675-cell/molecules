// 纯工具函数（前后端通用，无副作用）

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomId(len = 10): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return out;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function extOf(path: string): string {
  const i = path.lastIndexOf(".");
  return i === -1 ? "" : path.slice(i + 1).toLowerCase();
}

/** 文件路径 -> Prism 语言 id */
export function langOf(path: string): "markup" | "css" | "javascript" {
  switch (extOf(path)) {
    case "css":
      return "css";
    case "js":
    case "mjs":
    case "jsx":
      return "javascript";
    default:
      return "markup";
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 从需求文本提取项目标题（截断） */
export function titleFromPrompt(prompt: string, max = 16): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  if (!t) return "未命名应用";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

/** 触发浏览器下载文本文件（仅浏览器端调用） */
export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
