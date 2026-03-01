import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

type UserRole = "USER" | "OPERATOR" | "ADMIN";

const SESSION_COOKIE = "session";

export type SessionPayload = {
  sub: string; // userId
  role: UserRole;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  const sub = payload.sub;
  const role = payload.role;

  if (!sub || typeof sub !== "string") throw new Error("Invalid session: sub");
  if (!role || (role !== "USER" && role !== "OPERATOR" && role !== "ADMIN"))
    throw new Error("Invalid session: role");

  return { sub, role };
}

export async function setSessionCookie(userId: string, role: UserRole) {
  const token = await signSession({ sub: userId, role });
  const jar = await cookies();

  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}

/** 동일 요청 내에서 한 번만 DB 조회하도록 캐시 (Header·페이지 등 다중 호출 시 속도 개선) */
export const getCurrentUser = cache(async () => {
  try {
    const session = await getSessionFromCookies();
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, username: true, role: true, status: true, createdAt: true },
    });
    if (!user) return null;
    if (user.status !== "ACTIVE") return null;
    return user;
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

