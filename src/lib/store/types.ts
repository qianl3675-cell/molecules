import type { Project, User } from "@/lib/types";

/** 存储适配器统一接口：Upstash / 文件 / 内存 三实现共享 */
export interface Store {
  getUser(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  getProject(id: string): Promise<Project | null>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  listProjects(userId: string): Promise<Project[]>;
  /** 生成应用的业务数据（localStorage 持久化桥），按 项目+用户 维度 */
  getAppData(projectId: string, userId: string): Promise<Record<string, string> | null>;
  setAppData(projectId: string, userId: string, data: Record<string, string>): Promise<void>;
}
