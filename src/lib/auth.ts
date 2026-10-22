// 服务端认证：Cookie 会话（签名逻辑见 lib/session.ts）
import { cookies } from "next/headers";
import type { User } from "./types";
import { store } from "./store";
import { signSession, verifySession } from "./session";

const COOKIE_NAME = "mol_session";
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 天

export { signSession, verifySession, hashPassword, verifyPassword } from "./session";

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const uid = verifySession(jar.get(COOKIE_NAME)?.value);
  if (!uid) return null;
  return store.getUser(uid);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
