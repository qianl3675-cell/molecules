import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import { bad, toMeta } from "@/lib/http";
import { getTemplate } from "@/lib/templates";
import { randomId } from "@/lib/utils";
import type { Project } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return bad("未登录", 401);
  const projects = await store.listProjects(user.id);
  return NextResponse.json({ projects: projects.map(toMeta) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return bad("未登录", 401);
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    template?: string;
    copyFrom?: string;
  };

  let title = (body.title ?? "").trim().slice(0, 30) || "未命名应用";
  let files: Record<string, string> = {};

  if (body.copyFrom) {
    const src = await store.getProject(body.copyFrom);
    if (!src || (!src.isPublic && src.ownerId !== user.id)) return bad("源项目不存在或未公开", 404);
    files = { ...src.files };
    title = src.title + "（副本）";
  } else if (body.template) {
    const tpl = getTemplate(body.template);
    if (!tpl) return bad("未知模板");
    files = tpl.files();
    title = tpl.name + " · " + title;
  }

  const now = Date.now();
  const project: Project = {
    id: randomId(10),
    ownerId: user.id,
    title,
    slug: null,
    isPublic: false,
    files,
    messages: [],
    versions: files && Object.keys(files).length ? [{ id: randomId(8), ts: now, label: "初始版本", files }] : [],
    createdAt: now,
    updatedAt: now,
  };
  await store.saveProject(project);
  return NextResponse.json({ project });
}
