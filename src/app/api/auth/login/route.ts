import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { bad } from "@/lib/http";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const user = await store.getUserByUsername((username ?? "").trim());
  if (!user || typeof password !== "string" || !verifyPassword(password, user.passHash)) {
    return bad("用户名或密码错误", 401);
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.createdAt } });
}
