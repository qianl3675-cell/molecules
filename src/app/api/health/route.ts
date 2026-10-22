import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: process.env.UPSTASH_REDIS_REST_URL ? "upstash" : "file",
    ts: Date.now(),
  });
}
