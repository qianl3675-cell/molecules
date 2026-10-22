import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? { id: user.id, username: user.username, createdAt: user.createdAt } : null });
}
