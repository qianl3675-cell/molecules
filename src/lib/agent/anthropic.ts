// Anthropic Messages API 服务端流式代理
// 规范依据 claude-api 技能：默认模型 claude-opus-5-5（可用 AGENT_MODEL 覆盖）、
// 流式输出、启用服务端 refusal fallback（server-side-fallback-2026-07-01）。
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserContent, type AgentTurn } from "./prompt";

export const DEFAULT_MODEL = process.env.AGENT_MODEL || "claude-opus-5-5";
const MAX_TOKENS = Number(process.env.AGENT_MAX_TOKENS || 16000);

export function hasServerKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** 生成文本增量流（供 API 路由接入解析器） */
export async function* streamAgentText(
  turn: AgentTurn,
  apiKey: string
): AsyncGenerator<string, void, undefined> {
  const client = new Anthropic({ apiKey });
  const stream = client.beta.messages.stream({
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserContent(turn) }],
  } as Parameters<typeof client.beta.messages.stream>[0]);

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

/** 错误归类为可读的中文提示 */
export function describeAgentError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "API Key 无效或已失效，请检查后重试。";
  if (err instanceof Anthropic.RateLimitError) return "请求过于频繁或额度不足（429），请稍后重试。";
  if (err instanceof Anthropic.BadRequestError) return `请求被拒绝（400）：${err.message}`;
  if (err instanceof Anthropic.APIError) return `模型服务错误（${err.status ?? "?"}）：${err.message}`;
  if (err instanceof Error) return `连接模型服务失败：${err.message}`;
  return "未知错误";
}
