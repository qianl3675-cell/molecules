// Upstash Redis（REST）存储：纯 fetch 实现，不引 SDK；Serverless 部署的真实持久化
import type { Project, User } from "@/lib/types";
import type { Store } from "./types";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

type Command = (string | number)[];

async function redis<T = unknown>(commands: Command[]): Promise<T[]> {
  // 管道模式：POST {url}/pipeline，body 为命令数组的数组（实测该实例不识别 ?pipeline=true 查询参数）
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const arr = (await res.json()) as { result: T; error?: string }[];
  const firstErr = arr.find((r) => r.error);
  if (firstErr) throw new Error(`Upstash: ${firstErr.error}`);
  return arr.map((r) => r.result);
}

const get = async <T>(key: string) => (await redis<T>([["GET", key]]))[0];

export class UpstashStore implements Store {
  async getUser(id: string): Promise<User | null> {
    const raw = await get<string>(`u:${id}`);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const id = await get<string>(`un:${username}`);
    return id ? this.getUser(id) : null;
  }

  async createUser(user: User): Promise<void> {
    await redis([
      ["SET", `u:${user.id}`, JSON.stringify(user)],
      ["SET", `un:${user.username}`, user.id],
    ]);
  }

  async getProject(id: string): Promise<Project | null> {
    const raw = await get<string>(`p:${id}`);
    return raw ? (JSON.parse(raw) as Project) : null;
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const id = await get<string>(`slug:${slug}`);
    return id ? this.getProject(id) : null;
  }

  async saveProject(project: Project): Promise<void> {
    const cmds: Command[] = [
      ["SET", `p:${project.id}`, JSON.stringify(project)],
      ["SADD", `own:${project.ownerId}`, project.id],
    ];
    if (project.isPublic && project.slug) cmds.push(["SET", `slug:${project.slug}`, project.id]);
    await redis(cmds);
  }

  async deleteProject(id: string): Promise<void> {
    const p = await this.getProject(id);
    if (!p) return;
    const cmds: Command[] = [
      ["DEL", `p:${id}`],
      ["SREM", `own:${p.ownerId}`, id],
    ];
    if (p.slug) cmds.push(["DEL", `slug:${p.slug}`]);
    await redis(cmds);
  }

  async listProjects(userId: string): Promise<Project[]> {
    const ids = (await redis<string[]>([["SMEMBERS", `own:${userId}`]]))[0] ?? [];
    if (!ids.length) return [];
    const raws = await redis<string | null>(ids.map((id) => ["GET", `p:${id}`] as Command));
    return raws
      .filter((r): r is string => !!r)
      .map((r) => JSON.parse(r) as Project)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getAppData(projectId: string, userId: string): Promise<Record<string, string> | null> {
    const raw = await get<string>(`pd:${projectId}:${userId}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  }

  async setAppData(projectId: string, userId: string, data: Record<string, string>): Promise<void> {
    await redis([["SET", `pd:${projectId}:${userId}`, JSON.stringify(data)]]);
  }
}
