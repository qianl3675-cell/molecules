import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { FileStore } from "./file";
import type { Project, User } from "../types";

function tmpStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mol-test-"));
  return { dir, store: new FileStore(dir) };
}

const user = (id: string): User => ({ id, username: "u" + id, passHash: "h", createdAt: 1 });
const project = (id: string, ownerId: string): Project => ({
  id,
  ownerId,
  title: "P" + id,
  slug: null,
  isPublic: false,
  files: { "index.html": "<p>ok</p>" },
  messages: [],
  versions: [],
  createdAt: 1,
  updatedAt: Date.now(),
});

describe("FileStore", () => {
  it("用户 CRUD：创建 / 按名查找 / 不存在返回 null", async () => {
    const { store } = tmpStore();
    await store.createUser(user("u1"));
    expect((await store.getUserByUsername("uu1"))?.id).toBe("u1");
    expect(await store.getUserByUsername("nobody")).toBeNull();
    expect((await store.getUser("u1"))?.username).toBe("uu1");
    expect(await store.getUser("missing")).toBeNull();
  });

  it("项目 CRUD + 按属主过滤与排序", async () => {
    const { store } = tmpStore();
    const p1 = project("p1", "u1");
    p1.updatedAt = 1000;
    const p2 = project("p2", "u1");
    p2.updatedAt = 2000;
    const p3 = project("p3", "u2");
    await store.saveProject(p1);
    await store.saveProject(p2);
    await store.saveProject(p3);
    const mine = await store.listProjects("u1");
    expect(mine.map((p) => p.id)).toEqual(["p2", "p1"]); // 按 updatedAt 倒序
    await store.deleteProject("p1");
    expect(await store.getProject("p1")).toBeNull();
    expect((await store.listProjects("u1")).map((p) => p.id)).toEqual(["p2"]);
  });

  it("公开 slug 索引：开启公开后可按 slug 查找", async () => {
    const { store } = tmpStore();
    const p = project("p1", "u1");
    p.isPublic = true;
    p.slug = "abc12345";
    await store.saveProject(p);
    expect((await store.getProjectBySlug("abc12345"))?.id).toBe("p1");
    expect(await store.getProjectBySlug("nope")).toBeNull();
  });

  it("数据落盘：重新实例化后数据仍在（原子写生效）", async () => {
    const { dir, store } = tmpStore();
    await store.createUser(user("u9"));
    await store.saveProject(project("px", "u9"));
    const again = new FileStore(dir);
    expect(await again.getUserByUsername("uu9")).not.toBeNull();
    expect(await again.getProject("px")).not.toBeNull();
  });
});
