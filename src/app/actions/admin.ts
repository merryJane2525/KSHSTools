"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const PromoteOperatorSchema = z.object({
  userId: z.string().uuid(),
});

export async function promoteOperatorAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const parsed = PromoteOperatorSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, status: true },
  });

  if (!targetUser || targetUser.status !== "ACTIVE") {
    return { ok: false as const, error: "USER_NOT_FOUND" as const };
  }

  if (targetUser.role === "OPERATOR") {
    return { ok: false as const, error: "ALREADY_OPERATOR" as const };
  }

  if (targetUser.role === "ADMIN") {
    return { ok: false as const, error: "CANNOT_DEMOTE_ADMIN" as const };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: "OPERATOR" },
  });

  // AuditLog 기록 (선택)
  try {
    await prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "PROMOTE_OPERATOR",
        targetType: "User",
        targetId: parsed.data.userId,
        meta: { previousRole: targetUser.role },
      },
    });
  } catch {
    // AuditLog 실패해도 계속 진행
  }

  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function revokeOperatorAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const parsed = PromoteOperatorSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, status: true },
  });

  if (!targetUser || targetUser.status !== "ACTIVE") {
    return { ok: false as const, error: "USER_NOT_FOUND" as const };
  }

  if (targetUser.role !== "OPERATOR") {
    return { ok: false as const, error: "NOT_OPERATOR" as const };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: "USER" },
  });

  // AuditLog 기록
  try {
    await prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "REVOKE_OPERATOR",
        targetType: "User",
        targetId: parsed.data.userId,
        meta: { previousRole: "OPERATOR" },
      },
    });
  } catch {
    // AuditLog 실패해도 계속 진행
  }

  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** ADMIN 전용: 사용자를 관리자(ADMIN)로 승격 */
export async function promoteToAdminAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const parsed = PromoteOperatorSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, status: true },
  });

  if (!targetUser || targetUser.status !== "ACTIVE") {
    return { ok: false as const, error: "USER_NOT_FOUND" as const };
  }
  if (targetUser.role === "ADMIN") {
    return { ok: false as const, error: "ALREADY_ADMIN" as const };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: "ADMIN" },
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "PROMOTE_ADMIN",
        targetType: "User",
        targetId: parsed.data.userId,
        meta: { previousRole: targetUser.role },
      },
    });
  } catch {
    // ignore
  }

  revalidatePath("/admin/users");
  return { ok: true as const };
}

const UpdateUserStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

/** ADMIN: 사용자 상태 변경 (정지/해제) */
export async function updateUserStatusAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const parsed = UpdateUserStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, status: true },
  });

  if (!targetUser) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }
  if (targetUser.role === "ADMIN" && targetUser.id !== me.id) {
    return { ok: false as const, error: "CANNOT_CHANGE_ADMIN" as const };
  }
  if (targetUser.id === me.id && parsed.data.status === "SUSPENDED") {
    return { ok: false as const, error: "CANNOT_SUSPEND_SELF" as const };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "UPDATE_USER_STATUS",
        targetType: "User",
        targetId: parsed.data.userId,
        meta: { status: parsed.data.status, previousStatus: targetUser.status },
      },
    });
  } catch {
    // ignore
  }

  revalidatePath("/admin/users");
  return { ok: true as const };
}

const DeleteUserSchema = z.object({
  userId: z.string().uuid(),
});

/** ADMIN: 사용자 삭제 (소프트 삭제 = 계정 정지, 로그인 불가) */
export async function deleteUserAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const parsed = DeleteUserSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_ERROR" as const };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, status: true },
  });

  if (!targetUser) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }
  if (targetUser.role === "ADMIN") {
    return { ok: false as const, error: "CANNOT_DELETE_ADMIN" as const };
  }
  if (targetUser.id === me.id) {
    return { ok: false as const, error: "CANNOT_DELETE_SELF" as const };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: "SUSPENDED" },
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "DELETE_USER",
        targetType: "User",
        targetId: parsed.data.userId,
        meta: { previousStatus: targetUser.status },
      },
    });
  } catch {
    // ignore
  }

  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Form 전용: (formData)만 받아서 에러 시 redirect */
export async function updateUserStatusFormAction(formData: FormData) {
  const result = await updateUserStatusAction(null, formData);
  if (!result.ok) redirect(`/admin/users?user_error=${encodeURIComponent(result.error)}`);
}

/** Form 전용 */
export async function promoteToAdminFormAction(formData: FormData) {
  const result = await promoteToAdminAction(null, formData);
  if (!result.ok) redirect(`/admin/users?user_error=${encodeURIComponent(result.error)}`);
}

/** Form 전용 */
export async function promoteOperatorFormAction(formData: FormData) {
  const result = await promoteOperatorAction(null, formData);
  if (!result.ok) redirect(`/admin/users?user_error=${encodeURIComponent(result.error)}`);
}

/** Form 전용 */
export async function revokeOperatorFormAction(formData: FormData) {
  const result = await revokeOperatorAction(null, formData);
  if (!result.ok) redirect(`/admin/users?user_error=${encodeURIComponent(result.error)}`);
}

/** Form 전용 */
export async function deleteUserFormAction(formData: FormData) {
  const result = await deleteUserAction(null, formData);
  if (!result.ok) redirect(`/admin/users?user_error=${encodeURIComponent(result.error)}`);
}
