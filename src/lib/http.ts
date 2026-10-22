// API 路由小工具
import { NextResponse } from "next/server";
import type { Project } from "./types";

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const USERNAME_RE = /^[一-龥A-Za-z0-9_-]{2,16}$/;

/** 服务端文件白名单校验（防路径注入与体积滥用） */
export function sanitizeFiles(input: unknown): Record<string, string> | null {
  if (typeof input !== "object" || input === null) return null;
  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length === 0 || entries.length > 8) return null;
  const out: Record<string, string> = {};
  let total = 0;
  for (const [path, content] of entries) {
    if (!/^[\w.\-]{1,40}$/.test(path)) return null;
    if (typeof content !== "string" || content.length > 64_000) return null;
    total += content.length;
    out[path] = content;
  }
  if (total > 200_000) return null;
  return out;
}

export function toMeta(p: Project) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    isPublic: p.isPublic,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    fileCount: Object.keys(p.files).length,
    messageCount: p.messages.length,
  };
}
