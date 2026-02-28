"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

const AssignSchema = z.object({
  postId: z.string().uuid(),
  operatorId: z.string().uuid(),
});

export async function addAssignmentAction(_: unknown, formData: FormData) {
  const me = await requireUser();

  const parsed = AssignSchema.safeParse({
    postId: formData.get("postId"),
    operatorId: formData.get("operatorId"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!post) return { ok: false as const, error: "NOT_FOUND" as const };

  // 작성자 또는 ADMIN만 지정 가능
  if (me.id !== post.authorId && me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const operator = await prisma.user.findUnique({
    where: { id: parsed.data.operatorId },
    select: { id: true, role: true, status: true },
  });
  if (!operator || operator.status !== "ACTIVE" || operator.role !== "OPERATOR") {
    return { ok: false as const, error: "INVALID_OPERATOR" as const };
  }

  const currentCount = await prisma.postAssignment.count({
    where: { postId: post.id },
  });
  if (currentCount >= 3) {
    return { ok: false as const, error: "LIMIT_EXCEEDED" as const }; // 최대 3명
  }

  try {
    await prisma.postAssignment.create({
      data: {
        postId: post.id,
        operatorId: operator.id,
        createdById: me.id,
      },
    });
  } catch (err: unknown) {
    // unique(postId, operatorId) 위반이면 이미 지정된 것 → 무시
    if (!err || typeof err !== "object" || !("code" in err) || (err as { code?: string }).code !== "P2002") {
      throw err;
    }
  }

  // 알림: 오퍼레이터 업무함 + 알림함
  await prisma.notification.create({
    data: {
      userId: operator.id,
      type: "ASSIGNED",
      actorId: me.id,
      postId: post.id,
      title: "담당 게시글이 지정되었습니다",
      body: "새 게시글이 담당자로 지정되었습니다.",
      linkUrl: `/posts/${post.id}`,
      dedupKey: `ASSIGNED:POST:${post.id}:USER:${operator.id}`,
    },
  }).catch(() => {
    // dedup 충돌은 무시
  });
  void sendPushToUser(operator.id, {
    title: "담당 게시글이 지정되었습니다",
    body: "새 게시글이 담당자로 지정되었습니다.",
    linkUrl: `/posts/${post.id}`,
  }).catch(() => {});

  revalidatePath(`/posts/${post.id}`);
  revalidatePath("/operator");
  return { ok: true as const };
}

/** Form 전용: (formData)만 받아서 에러 시 redirect. Client에서 useActionState 대신 사용 */
export async function addAssignmentFormAction(formData: FormData) {
  const result = await addAssignmentAction(null, formData);
  if (!result.ok) {
    const postId = formData.get("postId");
    const path = postId && typeof postId === "string" ? `/posts/${postId}` : "/";
    redirect(`${path}?assignment_error=${encodeURIComponent(result.error)}`);
  }
}

/** Form 전용: (formData)만 받아서 에러 시 redirect. Client에서 useActionState 대신 사용 */
export async function removeAssignmentFormAction(formData: FormData) {
  const result = await removeAssignmentAction(null, formData);
  if (!result.ok) {
    const postId = formData.get("postId");
    const path = postId && typeof postId === "string" ? `/posts/${postId}` : "/";
    redirect(`${path}?assignment_error=${encodeURIComponent(result.error)}`);
  }
}

const UnassignSchema = z.object({
  postId: z.string().uuid(),
  operatorId: z.string().uuid(),
});

export async function removeAssignmentAction(_: unknown, formData: FormData) {
  const me = await requireUser();

  const parsed = UnassignSchema.safeParse({
    postId: formData.get("postId"),
    operatorId: formData.get("operatorId"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!post) return { ok: false as const, error: "NOT_FOUND" as const };

  if (me.id !== post.authorId && me.role !== "ADMIN") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  await prisma.postAssignment.deleteMany({
    where: {
      postId: post.id,
      operatorId: parsed.data.operatorId,
    },
  });

  revalidatePath(`/posts/${post.id}`);
  revalidatePath("/operator");
  return { ok: true as const };
}

