// 本地 JSON 文件存储：原子写（tmp+rename），写入失败自动退化为内存模式
import fs from "node:fs";
import path from "node:path";
import type { Project, User } from "@/lib/types";
import type { Store } from "./types";

interface DB {
  users: Record<string, User>;
  usernames: Record<string, string>;
  projects: Record<string, Project>;
  slugs: Record<string, string>;
  appData: Record<string, Record<string, string>>;
}

const emptyDB = (): DB => ({ users: {}, usernames: {}, projects: {}, slugs: {}, appData: {} });

export class FileStore implements Store {
  private file: string;
  private db: DB = emptyDB();
  private persistent = true;

  constructor(dir?: string) {
    const dataDir = dir ?? process.env.DATA_DIR ?? "./data";
    this.file = path.join(dataDir, "db.json");
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      this.db = JSON.parse(fs.readFileSync(this.file, "utf8")) as DB;
    } catch {
      this.db = emptyDB(); // 首次运行或文件损坏，从空库开始
    }
    // 探测可写性（Serverless 只读文件系统等场景）
    try {
      fs.accessSync(dataDir, fs.constants.W_OK);
    } catch {
      this.persistent = false;
      console.warn("[store] 数据目录不可写，退化为内存模式（重启丢失）。生产部署请配置 Upstash。");
    }
  }

  private save() {
    if (!this.persistent) return;
    try {
      const tmp = this.file + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(this.db));
      fs.renameSync(tmp, this.file);
    } catch (e) {
      this.persistent = false;
      console.warn("[store] 写入失败，退化为内存模式:", (e as Error).message);
    }
  }

  async getUser(id: string) {
    return this.db.users[id] ?? null;
  }

  async getUserByUsername(username: string) {
    const id = this.db.usernames[username];
    return id ? this.db.users[id] ?? null : null;
  }

  async createUser(user: User) {
    this.db.users[user.id] = user;
    this.db.usernames[user.username] = user.id;
    this.save();
  }

  async getProject(id: string) {
    return this.db.projects[id] ?? null;
  }

  async getProjectBySlug(slug: string) {
    const id = this.db.slugs[slug];
    return id ? this.db.projects[id] ?? null : null;
  }

  async saveProject(project: Project) {
    this.db.projects[project.id] = project;
    if (project.isPublic && project.slug) this.db.slugs[project.slug] = project.id;
    this.save();
  }

  async deleteProject(id: string) {
    const p = this.db.projects[id];
    if (!p) return;
    delete this.db.projects[id];
    if (p.slug) delete this.db.slugs[p.slug];
    this.save();
  }

  async listProjects(userId: string) {
    return Object.values(this.db.projects)
      .filter((p) => p.ownerId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getAppData(projectId: string, userId: string) {
    return this.db.appData[`${projectId}:${userId}`] ?? null;
  }

  async setAppData(projectId: string, userId: string, data: Record<string, string>) {
    this.db.appData[`${projectId}:${userId}`] = data;
    this.save();
  }
}
