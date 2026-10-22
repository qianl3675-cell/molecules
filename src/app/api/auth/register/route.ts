import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { bad, USERNAME_RE } from "@/lib/http";
import { randomId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const name = (username ?? "").trim();
  if (!USERNAME_RE.test(name)) return bad("用户名需 2-16 位（中英文/数字/_/-）");
  if (typeof password !== "string" || password.length < 6 || password.length > 64) {
    return bad("密码长度需 6-64 位");
  }
  if (await store.getUserByUsername(name)) return bad("该用户名已被注册", 409);
  const user = { id: randomId(12), username: name, passHash: hashPassword(password), createdAt: Date.now() };
  await store.createUser(user);
  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.createdAt } });
}
