import { afterEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../types";

// 通过环境变量启用 Upstash 适配器（模块在导入时读取 env）
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

const calls: Array<{ url: string; body: unknown }> = [];
const responses: Array<{ result: unknown; error?: string }[]> = [];
globalThis.fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
  calls.push({ url: String(_url), body: JSON.parse(String(init?.body)) });
  return new Response(JSON.stringify(responses.shift() ?? []), { status: 200 });
}) as unknown as typeof fetch;

const { UpstashStore } = await import("./upstash");
const store = new UpstashStore();

afterEach(() => {
  calls.length = 0;
});

describe("UpstashStore（REST 管道协议）", () => {
  it("请求必须走 ?pipeline=true 且命令为嵌套数组", async () => {
    responses.push([{ result: "OK" }]);
    await store.createUser({ id: "u1", username: "alice", passHash: "h", createdAt: 1 });
    expect(calls[0].url).toContain("/pipeline");
    expect(calls[0].body).toEqual([
      ["SET", "u:u1", JSON.stringify({ id: "u1", username: "alice", passHash: "h", createdAt: 1 })],
      ["SET", "un:alice", "u1"],
    ]);
  });

  it("getUserByUsername：先查索引再查用户", async () => {
    responses.push([{ result: "u1" }], [
      { result: JSON.stringify({ id: "u1", username: "alice", passHash: "h", createdAt: 1 }) },
    ]);
    const u = await store.getUserByUsername("alice");
    expect(u?.id).toBe("u1");
    expect(calls[1].body).toEqual([["GET", "u:u1"]]);
  });

  it("saveProject 维护属主索引与 slug 索引", async () => {
    responses.push([{ result: "OK" }, { result: 1 }, { result: "OK" }]);
    const p = {
      id: "p1", ownerId: "u1", title: "t", slug: "s1", isPublic: true,
      files: {}, messages: [], versions: [], createdAt: 1, updatedAt: 1,
    } as Project;
    await store.saveProject(p);
    expect(calls[0].body).toEqual([
      ["SET", "p:p1", JSON.stringify(p)],
      ["SADD", "own:u1", "p1"],
      ["SET", "slug:s1", "p1"],
    ]);
  });

  it("命令级错误会抛出（如 401/语法错不会静默）", async () => {
    responses.push([{ result: null, error: "ERR something" }]);
    await expect(store.getProject("x")).rejects.toThrow("Upstash: ERR something");
  });
});
