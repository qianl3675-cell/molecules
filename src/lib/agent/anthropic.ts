// 模型接入层：
// - 官方 Anthropic API（默认，claude-opus-5-5，流式 + refusal fallback）
// - 任意 Anthropic 兼容端点（如智谱 GLM：ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic）
//   兼容端点走原生 /v1/messages 协议，不附加官方专属的 beta 参数
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserContent, type AgentTurn } from "./prompt";

/** 自定义 Anthropic 兼容端点（空 = 官方 API） */
const BASE_URL = process.env.ANTHROPIC_BASE_URL?.trim() || "";

export const DEFAULT_MODEL =
  process.env.AGENT_MODEL?.trim() || (BASE_URL ? "glm-5.3" : "claude-opus-5-5");
const MAX_TOKENS = Number(process.env.AGENT_MAX_TOKENS || 16000);

export function hasServerKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** 流式增量：正文 text / 思考过程 thinking（思考也转发，避免长思考期间连接无输出） */
export type ModelChunk = { kind: "text" | "thinking"; delta: string };

/** 生成增量流（供 API 路由接入解析器） */
export async function* streamAgentChunks(
  turn: AgentTurn,
  apiKey: string
): AsyncGenerator<ModelChunk, void, undefined> {
  const isOfficial = !BASE_URL || /anthropic\.com/i.test(BASE_URL);
  // 兼容端点（如智谱）同样走 x-api-key 头认证
  const client = new Anthropic({ apiKey, ...(BASE_URL ? { baseURL: BASE_URL } : {}) });
  const params = {
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: buildUserContent(turn) }],
  };
  const stream = isOfficial
    ? client.beta.messages.stream({
        ...params,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      } as Parameters<typeof client.beta.messages.stream>[0])
    : client.messages.stream(params);

  for await (const event of stream) {
    if (event.type !== "content_block_delta") continue;
    if (event.delta.type === "text_delta") {
      yield { kind: "text", delta: event.delta.text };
    } else if (event.delta.type === "thinking_delta") {
      yield { kind: "thinking", delta: event.delta.thinking };
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
