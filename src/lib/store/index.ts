// 存储入口：按环境变量选择适配器（Upstash > 本地文件），文件模式内置内存兜底
import { FileStore } from "./file";
import { UpstashStore } from "./upstash";
import type { Store } from "./types";

export type { Store };

export const store: Store =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashStore()
    : new FileStore();
