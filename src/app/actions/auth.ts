"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { clearSessionCookie, setSessionCookie, requireUser } from "@/lib/auth";

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
    select: { id: true, role: true, status: true, passwordHash: true, email: true },
  });
  if (!user) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };
  if (user.status !== "ACTIVE") return { ok: false as const, error: "SUSPENDED" as const };

  const ok = await verifyPassword(input.data.password, user.passwordHash);
  if (!ok) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };

  await setSessionCookie(user.id, user.role);

  const returnUrl = formData.get("returnUrl");
  const pathFromForm =
    typeof returnUrl === "string" && returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : null;
  if (pathFromForm) {
    redirect(pathFromForm);
  }
  if (!user.email) {
    redirect("/account");
  }
  redirect("/equipments");
}

/** Form 전용: (formData)만 받아서 에러 시 redirect. Client에서 useActionState 대신 사용 */
export async function loginFormAction(formData: FormData) {
  const result = await loginAction(null, formData);
  if (!result.ok) {
    const returnUrl = formData.get("returnUrl");
    const q = typeof returnUrl === "string" && returnUrl.startsWith("/")
      ? `&returnUrl=${encodeURIComponent(returnUrl)}`
      : "";
    redirect(`/login?error=${encodeURIComponent(result.error)}${q}`);
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

const SetAccountEmailSchema = z.object({
  email: z.string().email().max(255),
});

/** 이메일이 비어 있는 계정(CSV 일괄 등록 등)에 한해 최초 1회 등록 */
export async function setAccountEmailAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.email) {
    return { ok: false as const, error: "ALREADY_SET" as const };
  }
  const parsed = SetAccountEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const };
  }

  const taken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: me.id } },
    select: { id: true },
  });
  if (taken) {
    return { ok: false as const, error: "EMAIL_TAKEN" as const };
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { email: parsed.data.email },
  });

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setAccountEmailFormAction(formData: FormData) {
  const result = await setAccountEmailAction(null, formData);
  if (!result.ok) {
    redirect(`/account?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/account?ok=1");
}

