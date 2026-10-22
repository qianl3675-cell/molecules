import { describe, expect, it } from "vitest";
import { hashPassword, signSession, verifyPassword, verifySession } from "./session";

describe("session", () => {
  it("签名-验签往返", () => {
    const token = signSession("user_abc");
    expect(verifySession(token)).toBe("user_abc");
  });

  it("篡改 payload 或签名均失败", () => {
    const token = signSession("user_abc");
    const [payload, mac] = token.split(".");
    expect(verifySession(`${payload}.${mac.slice(0, -2)}xx`)).toBeNull();
    expect(verifySession(`${payload}x.${mac}`)).toBeNull();
    expect(verifySession("garbage")).toBeNull();
    expect(verifySession(null)).toBeNull();
    expect(verifySession("")).toBeNull();
  });

  it("伪造 uid 的 payload 无法通过验签", () => {
    const forged = Buffer.from(JSON.stringify({ uid: "admin" })).toString("base64url");
    const token = signSession("user_abc");
    expect(verifySession(`${forged}.${token.split(".")[1]}`)).toBeNull();
  });

  it("口令哈希与校验", () => {
    const hash = hashPassword("s3cret!密码");
    expect(verifyPassword("s3cret!密码", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});
