import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const LoginSchema = z.object({
  identifier: z.string().min(1).max(255), // email or username
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = LoginSchema.parse(json);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.identifier }, { username: input.identifier }],
      },
      select: { id: true, email: true, username: true, role: true, status: true, passwordHash: true },
    });

    if (!user) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    if (user.status !== "ACTIVE") return NextResponse.json({ error: "SUSPENDED" }, { status: 403 });

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

    await setSessionCookie(user.id, user.role);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, username: user.username, role: user.role, status: user.status } },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

