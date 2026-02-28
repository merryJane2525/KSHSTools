"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";

const SignupSchema = z.object({
  email: z.string().email().max(255),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "username must be alphanumeric/underscore"),
  password: z.string().min(8).max(72),
});

export async function signupAction(_: unknown, formData: FormData) {
  const input = SignupSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!input.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const, issues: input.error.issues };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.data.email }, { username: input.data.username }] },
    select: { id: true },
  });
  if (existing) return { ok: false as const, error: "EMAIL_OR_USERNAME_TAKEN" as const };

  const passwordHash = await hashPassword(input.data.password);

  const user = await prisma.user.create({
    data: { email: input.data.email, username: input.data.username, passwordHash, role: "USER" },
    select: { id: true, role: true },
  });

  await setSessionCookie(user.id, user.role);
  redirect("/equipments");
}


const LoginSchema = z.object({
  identifier: z.string().min(1).max(255),
  password: z.string().min(1).max(72),
});

export async function loginAction(_: unknown, formData: FormData) {
  const input = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!input.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: input.data.identifier }, { username: input.data.identifier }] },
    select: { id: true, role: true, status: true, passwordHash: true },
  });
  if (!user) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };
  if (user.status !== "ACTIVE") return { ok: false as const, error: "SUSPENDED" as const };

  const ok = await verifyPassword(input.data.password, user.passwordHash);
  if (!ok) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };

  await setSessionCookie(user.id, user.role);
  redirect("/equipments");
}

/** Form 전용: (formData)만 받아서 에러 시 redirect. Client에서 useActionState 대신 사용 */
export async function loginFormAction(formData: FormData) {
  const result = await loginAction(null, formData);
  if (!result.ok) redirect(`/login?error=${encodeURIComponent(result.error)}`);
}

/** Form 전용: (formData)만 받아서 에러 시 redirect. Client에서 useActionState 대신 사용 */
export async function signupFormAction(formData: FormData) {
  const result = await signupAction(null, formData);
  if (!result.ok) redirect(`/signup?error=${encodeURIComponent(result.error)}`);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

