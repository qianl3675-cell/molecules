// 一键游客体验：使用共享 demo 账号登录（数据跨访问保留，便于评审复走流程）
import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { randomId } from "@/lib/utils";

const DEMO_USERNAME = "demo";

export async function POST() {
  let user = await store.getUserByUsername(DEMO_USERNAME);
  if (!user) {
    user = {
      id: randomId(12),
      username: DEMO_USERNAME,
      passHash: hashPassword(randomId(24)),
      createdAt: Date.now(),
    };
    await store.createUser(user);
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.createdAt } });
}
