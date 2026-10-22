import { NextResponse } from "next/server";
import { hasServerKey, DEFAULT_MODEL } from "@/lib/agent/anthropic";

// 客户端据此决定运行模式：服务端有 Key / 用户自带 Key（BYOK）/ 演示模式
export async function GET() {
  return NextResponse.json({
    hasServerKey: hasServerKey(),
    model: DEFAULT_MODEL,
  });
}
