// Agent 流式代理：NDJSON 事件流（客户端 fetch reader 消费）
// Key 优先级：服务端 env > 请求头 x-llm-key（BYOK，不落盘不打印）
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad } from "@/lib/http";
import { streamAgentText, describeAgentError } from "@/lib/agent/anthropic";
import { AgentStreamParser } from "@/lib/agent/parser";
import { sanitizeFiles } from "@/lib/http";
import type { AgentEvent, ChatMessage } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return bad("未登录", 401);

  const body = (await req.json().catch(() => ({}))) as {
    instruction?: string;
    history?: Pick<ChatMessage, "role" | "text">[];
    files?: Record<string, string>;
  };
  const instruction = (body.instruction ?? "").trim();
  if (!instruction || instruction.length > 2000) return bad("需求描述需为 1-2000 字");

  const key = process.env.ANTHROPIC_API_KEY || req.headers.get("x-llm-key") || "";
  if (!key) return bad("NO_KEY", 400);

  const files = sanitizeFiles(body.files ?? {}) ?? {};
  const history = Array.isArray(body.history)
    ? body.history.filter((m) => m && typeof m.text === "string").slice(-8)
    : [];

  const parser = new AgentStreamParser();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
        } catch {
          /* 客户端断开 */
        }
      };
      try {
        for await (const text of streamAgentText({ history, files, instruction }, key)) {
          for (const ev of parser.push(text)) send(ev);
        }
        for (const ev of parser.end()) send(ev);
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: describeAgentError(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
