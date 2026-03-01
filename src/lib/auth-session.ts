/**
 * 세션(JWT) 검증만 수행. Prisma를 사용하지 않아 Edge(미들웨어)에서 사용 가능.
 */
import { jwtVerify } from "jose";

export const SESSION_COOKIE = "session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    return { sub };
  } catch {
    return null;
  }
}
