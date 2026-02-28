import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const SignupSchema = z.object({
  email: z.string().email().max(255),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "username must be alphanumeric/underscore"),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = SignupSchema.parse(json);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "EMAIL_OR_USERNAME_TAKEN" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        role: "USER",
      },
      select: { id: true, email: true, username: true, role: true, status: true },
    });

    await setSessionCookie(user.id, user.role);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

