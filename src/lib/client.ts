// 浏览器端 API 客户端 + BYOK Key 本地存储
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, opts?: { method?: string; body?: unknown; headers?: Record<string, string> }): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method ?? "GET",
    headers: {
      ...(opts?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(opts?.headers ?? {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(res.status, data.error ?? `请求失败（${res.status}）`, data.error);
  return data as T;
}

// ---- BYOK（自带 Anthropic Key，仅存 localStorage，仅随 /api/agent 请求传输） ----
const KEY_NAME = "mol_llm_key";

export function getLocalKey(): string {
  try {
    return localStorage.getItem(KEY_NAME) ?? "";
  } catch {
    return "";
  }
}

export function setLocalKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_NAME, key);
    else localStorage.removeItem(KEY_NAME);
  } catch {
    /* 隐私模式等 */
  }
}

export type AgentMode = "server" | "byok" | "demo";

export interface AgentStatus {
  hasServerKey: boolean;
  model: string;
}

export async function fetchAgentStatus(): Promise<AgentStatus> {
  return api<AgentStatus>("/api/agent/status");
}
