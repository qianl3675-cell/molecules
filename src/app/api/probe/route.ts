// 出网连通性诊断：验证部署平台服务器能否访问各模型端点（调试用，只允许探测白名单域名，不回显 Key）
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "https://open.bigmodel.cn",
  "https://open.bigmodel.ai",
  "https://api.z.ai",
  "https://api.anthropic.com",
];

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("url") ?? ALLOWED_HOSTS[0];
  if (!ALLOWED_HOSTS.some((a) => u === a)) {
    return NextResponse.json({ error: "host not allowed", allowed: ALLOWED_HOSTS });
  }
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  const t0 = Date.now();
  try {
    const res = await fetch(`${u}/api/anthropic/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.AGENT_MODEL || "glm-5.3",
        max_tokens: 8,
        messages: [{ role: "user", content: "hi" }],
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const body = (await res.text()).slice(0, 150);
    return NextResponse.json({ host: u, ms: Date.now() - t0, status: res.status, body });
  } catch (e) {
    return NextResponse.json({ host: u, ms: Date.now() - t0, error: String(e).slice(0, 200) });
  }
}
