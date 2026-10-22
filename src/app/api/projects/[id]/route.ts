import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import { bad, sanitizeFiles } from "@/lib/http";
import { randomId } from "@/lib/utils";
import { MAX_VERSIONS } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

async function loadOwnProject(id: string) {
  const user = await getSessionUser();
  if (!user) return { err: bad("未登录", 401) } as const;
  const project = await store.getProject(id);
  if (!project || project.ownerId !== user.id) return { err: bad("项目不存在", 404) } as const;
  return { project } as const;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await loadOwnProject(id);
  if ("err" in r) return r.err;
  return NextResponse.json({ project: r.project });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await loadOwnProject(id);
  if ("err" in r) return r.err;
  const p = r.project;
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    isPublic?: boolean;
    files?: Record<string, string>;
    appendMessages?: Array<{ role: "user" | "agent"; text: string }>;
    appendVersion?: { label: string; files: Record<string, string> };
  };

  if (typeof body.title === "string" && body.title.trim()) p.title = body.title.trim().slice(0, 30);
  if (typeof body.isPublic === "boolean") {
    p.isPublic = body.isPublic;
    if (p.isPublic && !p.slug) p.slug = randomId(8);
  }
  if (body.files !== undefined) {
    const files = sanitizeFiles(body.files);
    if (!files) return bad("文件集不合法（≤8 个文件，单文件 ≤64KB）");
    p.files = files;
  }
  if (Array.isArray(body.appendMessages)) {
    for (const m of body.appendMessages) {
      if (m?.text) {
        p.messages.push({ role: m.role === "agent" ? "agent" : "user", text: m.text.slice(0, 4000), ts: Date.now() });
      }
    }
    if (p.messages.length > 200) p.messages = p.messages.slice(-200);
  }
  if (body.appendVersion) {
    const files = sanitizeFiles(body.appendVersion.files);
    if (files) {
      p.versions.push({ id: randomId(8), ts: Date.now(), label: body.appendVersion.label.slice(0, 40) || "新版本", files });
      if (p.versions.length > MAX_VERSIONS) p.versions = [p.versions[0], ...p.versions.slice(-(MAX_VERSIONS - 1))];
    }
  }
  p.updatedAt = Date.now();
  await store.saveProject(p);
  return NextResponse.json({ project: p });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await loadOwnProject(id);
  if ("err" in r) return r.err;
  await store.deleteProject(id);
  return NextResponse.json({ ok: true });
}
