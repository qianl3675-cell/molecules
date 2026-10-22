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
}
