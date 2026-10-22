// 会话令牌与口令哈希（纯函数，无 next/headers 依赖，便于单测）
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

function secret(): string {
  return process.env.AUTH_SECRET || "molecules-dev-secret";
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function signSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, ts: Date.now() })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function verifySession(token?: string | null): string | null {
  if (!token) return null;
  try {
    const i = token.lastIndexOf(".");
    if (i < 0) return null;
    const payload = token.slice(0, i);
    const mac = token.slice(i + 1);
    const a = Buffer.from(mac);
    const b = Buffer.from(hmac(payload));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data?.uid === "string" ? data.uid : null;
  } catch {
    return null;
  }
}

export const hashPassword = (pw: string): string => bcrypt.hashSync(pw, 10);
export const verifyPassword = (pw: string, hash: string): boolean => bcrypt.compareSync(pw, hash);
