// 共享领域模型（前后端通用）

export interface User {
  id: string;
  username: string;
  passHash: string;
  createdAt: number;
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
  ts: number;
}

export interface VersionSnapshot {
  id: string;
  ts: number;
  label: string;
  files: Record<string, string>;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  /** 公开分享 slug（首次开启公开时生成） */
  slug: string | null;
  isPublic: boolean;
  files: Record<string, string>;
  messages: ChatMessage[];
  versions: VersionSnapshot[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMeta {
  id: string;
  title: string;
  slug: string | null;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  fileCount: number;
  messageCount: number;
}

/** Agent 事件协议：真模型（服务端 NDJSON 流）与演示模式（本地生成器）共用 */
export type AgentEvent =
  | { type: "stage"; text: string }
  | { type: "thinking"; text: string }
  | { type: "plan"; text: string }
  | { type: "file_start"; path: string }
  | { type: "file_delta"; path: string; delta: string }
  | { type: "file_end"; path: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface TemplateMeta {
  key: string;
  name: string;
  desc: string;
  emoji: string;
}

export const MAX_VERSIONS = 30;
