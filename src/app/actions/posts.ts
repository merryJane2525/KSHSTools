"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { extractMentionUsernames } from "@/lib/mentions";
import { sendPushToUser } from "@/lib/push";
import { syncPostSearchDocumentById } from "@/lib/search-index";

type MentionTargetType = "POST" | "COMMENT";
type NotificationType = "ASSIGNED" | "MENTIONED" | "COMMENTED" | "SYSTEM";

async function handleMentions(opts: {
  actorId: string;
  postId: string;
  targetType: MentionTargetType;
  targetId: string;
  text: string;
}) {
  const usernames = extractMentionUsernames(opts.text, 6);
  if (usernames.length === 0) return { ok: true as const };
  if (usernames.length > 5) return { ok: false as const, error: "TOO_MANY_MENTIONS" as const };

  const users = await prisma.user.findMany({
    where: { username: { in: usernames }, status: "ACTIVE" },
    select: { id: true, username: true },
  });

  if (users.length === 0) return { ok: true as const };

  const linkUrl = `/posts/${opts.postId}`;
  const title = "멘션됨";
  const body = users.length === 1 ? `@${users[0].username}님이 멘션되었습니다.` : `${users.length}명이 멘션되었습니다.`;

  for (const u of users) {
    try {
      await prisma.mention.create({
        data: {
          targetType: opts.targetType,
          targetId: opts.targetId,
          postId: opts.postId,
          mentionedUserId: u.id,
          mentionedById: opts.actorId,
        },
      });
    } catch (err: unknown) {
      // Unique violation (duplicate mention) is safe to ignore
      if (!err || typeof err !== "object" || !("code" in err) || (err as { code?: string }).code !== "P2002") {
        throw err;
      }
    }

    try {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: "MENTIONED" as NotificationType,
          actorId: opts.actorId,
          postId: opts.postId,
          commentId: opts.targetType === "COMMENT" ? opts.targetId : null,
          title,
          body,
          linkUrl,
          dedupKey: `MENTIONED:${opts.targetType}:${opts.targetId}:USER:${u.id}`,
        },
      });
      void sendPushToUser(u.id, { title, body, linkUrl }).catch(() => {});
    } catch (err: unknown) {
      // Unique violation (duplicate notification by dedupKey) is safe to ignore
      if (!err || typeof err !== "object" || !("code" in err) || (err as { code?: string }).code !== "P2002") {
        throw err;
      }
    }
  }

  return { ok: true as const };
}

const CreatePostSchema = z.object({
  equipmentId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(20_000),
  imageUrls: z.string().optional(), // JSON 문자열로 전달된 이미지 URL 배열
});

export async function createPostAction(_: unknown, formData: FormData) {
  const me = await requireUser();

  const parsed = CreatePostSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    title: formData.get("title"),
    body: formData.get("body"),
    imageUrls: formData.get("imageUrls") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const mentionCheck = extractMentionUsernames(parsed.data.body, 6);
  if (mentionCheck.length > 5) return { ok: false as const, error: "TOO_MANY_MENTIONS" as const };

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
    select: { id: true, isActive: true },
  });
  if (!equipment || !equipment.isActive) return { ok: false as const, error: "INVALID_EQUIPMENT" as const };

  // 이미지 URL 배열 파싱 (JSON 문자열)
  let imageUrlsArray: string[] | null = null;
  if (parsed.data.imageUrls) {
    try {
      const parsedUrls = JSON.parse(parsed.data.imageUrls);
      if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
        imageUrlsArray = parsedUrls.slice(0, 5); // 최대 5개로 제한 (Base64 크기 고려)
      }
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  const post = await prisma.post.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      imageUrls: imageUrlsArray ? (imageUrlsArray as unknown) : null,
      authorId: me.id,
      equipmentId: parsed.data.equipmentId,
    },
    select: { id: true },
  });

  const mentionResult = await handleMentions({
    actorId: me.id,
    postId: post.id,
    targetType: "POST",
    targetId: post.id,
    text: parsed.data.body,
  });
  if (!mentionResult.ok) return mentionResult;

  await syncPostSearchDocumentById(post.id).catch(() => {});
  redirect(`/posts/${post.id}`);
}

const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(10_000),
});

export async function createCommentAction(_: unknown, formData: FormData) {
  const me = await requireUser();

  const parsed = CreateCommentSchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const mentionCheck = extractMentionUsernames(parsed.data.body, 6);
  if (mentionCheck.length > 5) return { ok: false as const, error: "TOO_MANY_MENTIONS" as const };

  const post = await prisma.post.findFirst({
    where: { id: parsed.data.postId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!post) return { ok: false as const, error: "NOT_FOUND" as const };

  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: me.id, body: parsed.data.body },
    select: { id: true },
  });

  // Notify post author about comment (basic MVP behavior)
  if (post.authorId !== me.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENTED",
        actorId: me.id,
        postId: post.id,
        commentId: comment.id,
        title: "댓글이 달렸습니다",
        body: "게시글에 새 댓글이 달렸습니다.",
        linkUrl: `/posts/${post.id}`,
        dedupKey: `COMMENTED:COMMENT:${comment.id}:USER:${post.authorId}`,
      },
    });
    void sendPushToUser(post.authorId, {
      title: "댓글이 달렸습니다",
      body: "게시글에 새 댓글이 달렸습니다.",
      linkUrl: `/posts/${post.id}`,
    }).catch(() => {});
  }

  const mentionResult = await handleMentions({
    actorId: me.id,
    postId: post.id,
    targetType: "COMMENT",
    targetId: comment.id,
    text: parsed.data.body,
  });
  if (!mentionResult.ok) return mentionResult;

  revalidatePath(`/posts/${post.id}`);
  return { ok: true as const };
}

/** Form 전용: Client에서 useActionState 대신 사용 */
export async function createCommentFormAction(formData: FormData) {
  const result = await createCommentAction(null, formData);
  if (!result.ok) {
    const postId = formData.get("postId");
    const path = postId && typeof postId === "string" ? `/posts/${postId}` : "/";
    redirect(`${path}?comment_error=${encodeURIComponent(result.error)}`);
  }
}

/** Form 전용: Client에서 useActionState 대신 사용 */
export async function createPostFormAction(formData: FormData) {
  const result = await createPostAction(null, formData);
  if (!result.ok) redirect(`/posts/new?post_error=${encodeURIComponent(result.error)}`);
}

// ADMIN 전용: 게시글 삭제 (soft delete)
const DeletePostSchema = z.object({
  postId: z.string().uuid(),
});

export async function deletePostAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const };

  const parsed = DeletePostSchema.safeParse({
    postId: formData.get("postId"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const post = await prisma.post.findFirst({
    where: { id: parsed.data.postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) return { ok: false as const, error: "NOT_FOUND" as const };

  await prisma.post.update({
    where: { id: parsed.data.postId },
    data: { deletedAt: new Date() },
  });

  await syncPostSearchDocumentById(parsed.data.postId).catch(() => {});
  revalidatePath("/community");
  revalidatePath(`/posts/${parsed.data.postId}`);
  return { ok: true as const };
}

// ADMIN 전용: 게시글 상태 변경 (OPEN <-> RESOLVED)
const UpdatePostStatusSchema = z.object({
  postId: z.string().uuid(),
  status: z.enum(["OPEN", "RESOLVED"]),
});

export async function updatePostStatusAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const };

  const parsed = UpdatePostStatusSchema.safeParse({
    postId: formData.get("postId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const post = await prisma.post.findFirst({
    where: { id: parsed.data.postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) return { ok: false as const, error: "NOT_FOUND" as const };

  await prisma.post.update({
    where: { id: parsed.data.postId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/community");
  revalidatePath(`/posts/${parsed.data.postId}`);
  return { ok: true as const };
}

/** Form 전용: (formData)만 받아서 에러 시 redirect */
export async function updatePostStatusFormAction(formData: FormData) {
  const result = await updatePostStatusAction(null, formData);
  if (!result.ok) {
    const postId = formData.get("postId");
    const path = postId && typeof postId === "string" ? `/posts/${postId}` : "/admin/posts";
    redirect(`${path}?post_error=${encodeURIComponent(result.error)}`);
  }
}

/** Form 전용: (formData)만 받아서 에러 시 redirect */
export async function deletePostFormAction(formData: FormData) {
  const result = await deletePostAction(null, formData);
  if (!result.ok) {
    const postId = formData.get("postId");
    const path = postId && typeof postId === "string" ? `/posts/${postId}` : "/admin/posts";
    redirect(`${path}?post_error=${encodeURIComponent(result.error)}`);
  }
}
