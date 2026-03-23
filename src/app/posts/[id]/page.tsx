import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { equipmentHasOperatorScope, getOperatorsForPostEquipment } from "@/lib/operator-equipment";
import { formatDateTime } from "@/lib/date";
import { CommentForm } from "./ui";
import { PostAssignmentsManager } from "./assignments-ui";
import { PostAdminActions } from "./admin-ui";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

// 추가: Post 타입 정의
type PostDetail = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[] | null;
  status: string;
  createdAt: Date;
  equipment: { id: string; name: string; slug: string };
  author: { id: string; username: string };
  assignments: {
    operatorId: string;
    operator: { username: string };
  }[];
  comments: {
    id: string;
    body: string;
    createdAt: Date;
    author: { username: string; role: string };
  }[];
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const me = await getCurrentUser();

  // Next.js 15+ 호환: params가 Promise일 수 있음
  const resolvedParams = await Promise.resolve(params);
  const postId = resolvedParams.id;

  if (!postId) {
    notFound();
  }

  // 여기에도 타입 지정
  const postRaw = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: {
      id: true,
      title: true,
      body: true,
      imageUrls: true,
      status: true,
      createdAt: true,
      equipment: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, username: true } },
      assignments: {
        select: {
          operatorId: true,
          operator: { select: { username: true } },
        },
      },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { username: true, role: true } },
        },
      },
    },
  });
  if (!postRaw) notFound();

  // imageUrls를 배열로 변환 (JSON 필드)
  // Prisma의 Json 타입은 unknown으로 반환되므로 안전하게 처리
  let imageUrlsArray: string[] | null = null;
  if (postRaw.imageUrls != null) {
    try {
      if (Array.isArray(postRaw.imageUrls)) {
        // unknown[] 타입을 명시적으로 처리
        const arr = postRaw.imageUrls as unknown[];
        imageUrlsArray = arr
          .filter((item: unknown): item is string => typeof item === "string")
          .slice(0, 10); // 최대 10개로 제한
      } else if (typeof postRaw.imageUrls === "string") {
        // 문자열로 저장된 경우 JSON 파싱 시도
        const parsed = JSON.parse(postRaw.imageUrls);
        if (Array.isArray(parsed)) {
          const arr = parsed as unknown[];
          imageUrlsArray = arr
            .filter((item: unknown): item is string => typeof item === "string")
            .slice(0, 10);
        }
      }
    } catch {
      // 파싱 실패 시 null 유지
      imageUrlsArray = null;
    }
  }

  const post: PostDetail = {
    ...postRaw,
    imageUrls: imageUrlsArray,
  };

  const operators = me ? await getOperatorsForPostEquipment(post.equipment.id) : [];
  const assignmentOperatorHint = me
    ? (await equipmentHasOperatorScope(post.equipment.id))
      ? "이 기자재에 담당으로 등록된 오퍼레이터만 선택할 수 있습니다."
      : "등록된 담당 구분이 없으면 모든 오퍼레이터를 지정할 수 있습니다."
    : undefined;

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="space-y-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <Link className="hover:underline" href={`/equipments/${post.equipment.slug}`}>
              {post.equipment.name}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>@{post.author.username}</span>
            <span>·</span>
            <span>{formatDateTime(post.createdAt)}</span>
            <span>·</span>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">{post.status}</span>
          </div>
        </div>
      </AnimateOnScroll>

      {/* 본문 + 담당 오퍼레이터 박스 */}
      <AnimateOnScroll>
        <div className={`grid gap-4 ${me ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-900 dark:text-zinc-100">{post.body}</div>

          {/* 첨부 이미지 표시 */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-700">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">첨부 이미지 ({post.imageUrls.length})</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {post.imageUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`첨부 이미지 ${index + 1}`}
                      className="w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {me ? (
          <div className="space-y-4">
            <PostAssignmentsManager
              postId={post.id}
              currentUserId={me.id}
              currentUserRole={me.role}
              postAuthorId={post.author.id}
              assignments={post.assignments}
              operators={operators}
              operatorHint={assignmentOperatorHint}
            />

            {me.role === "ADMIN" && (
              <PostAdminActions postId={post.id} currentStatus={post.status} />
            )}
          </div>
        ) : null}
      </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">댓글 ({post.comments.length})</div>

          <CommentForm postId={post.id} canComment={!!me} />

          <div className="space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">@{c.author.username}</span>
                  {c.author.role === "OPERATOR" && (
                    <span className="rounded-full bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                      OPERATOR
                    </span>
                  )}
                </div>
                <span>{formatDateTime(c.createdAt)}</span>
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-800 dark:text-zinc-200">{c.body}</div>
            </div>
          ))}
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

