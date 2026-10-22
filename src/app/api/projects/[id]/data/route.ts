// 生成应用的业务数据持久化（localStorage 桥的后端）：
// GET 读取当前用户的快照；PUT 保存（≤50 键，总量 ≤32KB，值为字符串）
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import { bad } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

async function requireOwner(id: string) {
  const user = await getSessionUser();
  if (!user) return { err: bad("未登录", 401) } as const;
  const project = await store.getProject(id);
  if (!project || project.ownerId !== user.id) return { err: bad("项目不存在", 404) } as const;
  return { userId: user.id } as const;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await requireOwner(id);
  if ("err" in r) return r.err;
  const data = await store.getAppData(id, r.userId);
  return NextResponse.json({ data: data ?? {} });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await requireOwner(id);
  if ("err" in r) return r.err;
  const body = (await req.json().catch(() => ({}))) as { data?: Record<string, unknown> };
  const input = body.data;
  if (typeof input !== "object" || input === null) return bad("data 必须为对象");
  const entries = Object.entries(input);
  if (entries.length > 50) return bad("数据键数超限（≤50）");
  const out: Record<string, string> = {};
  let total = 0;
  for (const [k, v] of entries) {
    if (!k || k.length > 100) return bad("存在非法键名");
    if (typeof v !== "string") return bad("值必须为字符串");
    total += v.length;
    out[k] = v;
  }
  if (total > 32_000) return bad("数据总量超限（≤32KB）");
  await store.setAppData(id, r.userId, out);
  return NextResponse.json({ ok: true });
}
