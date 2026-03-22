"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  parseStudentCsv,
  usernameFromStudentAndName,
  initialPasswordFromStudentAndName,
  utf8ByteLength,
  MAX_STUDENT_CSV_ROWS,
} from "@/lib/student-csv-import";

export type ImportStudentsCsvResult =
  | {
      ok: true;
      created: number;
      skipped: number;
      skippedDetails: { line: number; reason: string }[];
      parseErrors: { line: number; message: string }[];
    }
  | { ok: false; error: string };

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

/** ADMIN: 사용자 삭제 — DB에서 행 제거 (게시글·댓글·예약 등 종속 데이터도 정리) */
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

  const userId = parsed.data.userId;

  await prisma.$transaction(async (tx) => {
    const reservationIds = (
      await tx.reservation.findMany({ where: { userId }, select: { id: true } })
    ).map((r) => r.id);
    if (reservationIds.length) {
      await tx.notification.deleteMany({ where: { reservationId: { in: reservationIds } } });
    }

    const postIds = (await tx.post.findMany({ where: { authorId: userId }, select: { id: true } })).map(
      (p) => p.id,
    );

    const commentIdsOnUserPosts = postIds.length
      ? (await tx.comment.findMany({ where: { postId: { in: postIds } }, select: { id: true } })).map(
          (c) => c.id,
        )
      : [];

    const commentIdsByUser = (await tx.comment.findMany({ where: { authorId: userId }, select: { id: true } })).map(
      (c) => c.id,
    );

    const allCommentIds = [...new Set([...commentIdsOnUserPosts, ...commentIdsByUser])];

    await tx.notification.deleteMany({
      where: {
        OR: [
          { userId },
          { actorId: userId },
          ...(postIds.length ? [{ postId: { in: postIds } }] : []),
          ...(allCommentIds.length ? [{ commentId: { in: allCommentIds } }] : []),
        ],
      },
    });

    await tx.mention.deleteMany({
      where: {
        OR: [
          { mentionedUserId: userId },
          { mentionedById: userId },
          ...(postIds.length ? [{ postId: { in: postIds } }] : []),
        ],
      },
    });

    await tx.postAssignment.deleteMany({
      where: {
        OR: [
          { operatorId: userId },
          { createdById: userId },
          ...(postIds.length ? [{ postId: { in: postIds } }] : []),
        ],
      },
    });

    if (postIds.length) {
      await tx.searchDocument.deleteMany({ where: { type: "qa", sourceId: { in: postIds } } });
    }

    if (postIds.length) {
      await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
      await tx.post.deleteMany({ where: { id: { in: postIds } } });
    }

    await tx.comment.deleteMany({ where: { authorId: userId } });

    await tx.report.deleteMany({ where: { reporterId: userId } });

    await tx.auditLog.updateMany({ where: { actorId: userId }, data: { actorId: null } });

    await tx.user.delete({ where: { id: userId } });
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "DELETE_USER",
        targetType: "User",
        targetId: userId,
        meta: { previousStatus: targetUser.status, hardDelete: true },
      },
    });
  } catch {
    // ignore
  }

  revalidatePath("/admin/users");
  revalidatePath("/community");
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

/**
 * ADMIN: CSV(학번, 이름)로 학생 계정 일괄 생성.
 * username은 학번+이름, 비밀번호는 학번+이름+!, 이메일은 null(로그인 후 계정에서 설정).
 */
export async function importStudentsCsvAction(
  _prev: ImportStudentsCsvResult | null,
  formData: FormData,
): Promise<ImportStudentsCsvResult> {
  const me = await requireUser();
  if (me.role !== "ADMIN") {
    return { ok: false, error: "FORBIDDEN" };
  }

  const file = formData.get("csv");
  if (!(file instanceof File)) {
    return { ok: false, error: "NO_FILE" };
  }
  if (file.size === 0) {
    return { ok: false, error: "EMPTY_FILE" };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "READ_FAILED" };
  }

  const { rows, parseErrors } = parseStudentCsv(text);
  if (rows.length > MAX_STUDENT_CSV_ROWS) {
    return { ok: false, error: "TOO_MANY_ROWS" };
  }

  const seenInFile = new Set<string>();
  const skippedDetails: { line: number; reason: string }[] = [];
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (seenInFile.has(row.studentNumber)) {
      skipped++;
      skippedDetails.push({ line: row.line, reason: "파일 내 중복 학번" });
      continue;
    }
    seenInFile.add(row.studentNumber);

    const existingByNumber = await prisma.user.findFirst({
      where: { studentNumber: row.studentNumber },
      select: { id: true },
    });
    if (existingByNumber) {
      skipped++;
      skippedDetails.push({ line: row.line, reason: "이미 등록된 학번" });
      continue;
    }

    const password = initialPasswordFromStudentAndName(row.studentNumber, row.name);
    if (utf8ByteLength(password) > 72) {
      skipped++;
      skippedDetails.push({
        line: row.line,
        reason: "비밀번호(학번+이름+!)이 bcrypt 최대 길이(72바이트)를 초과합니다",
      });
      continue;
    }

    const baseUsername = usernameFromStudentAndName(row.studentNumber, row.name);
    let username = baseUsername;
    let suffix = 0;
    while (true) {
      const exists = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (!exists) break;
      suffix++;
      username = `${baseUsername}_${suffix}`;
    }

    const passwordHash = await hashPassword(password);

    try {
      await prisma.user.create({
        data: {
          email: null,
          username,
          passwordHash,
          studentNumber: row.studentNumber,
          studentName: row.name,
          role: "USER",
        },
      });
      created++;
    } catch {
      skipped++;
      skippedDetails.push({ line: row.line, reason: "저장 실패(중복 등)" });
    }
  }

  if (created > 0) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: me.id,
          action: "BULK_IMPORT_STUDENTS",
          targetType: "User",
          meta: { created, skipped, parseErrorCount: parseErrors.length },
        },
      });
    } catch {
      // ignore
    }
  }

  revalidatePath("/admin/users");
  return {
    ok: true,
    created,
    skipped,
    skippedDetails,
    parseErrors,
  };
}
