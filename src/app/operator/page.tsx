import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

type OperatorAssignmentItem = {
  id: string;
  createdAt: Date;
  post: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    equipment: { name: string; slug: string };
    author: { username: string };
  };
};

type OperatorMentionItem = {
  id: string;
  createdAt: Date;
  targetType: "POST" | "COMMENT" | string;
  post: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    equipment: { name: string; slug: string };
    author: { username: string };
  };
};

export default async function OperatorInboxPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "OPERATOR" && me.role !== "ADMIN") {
    redirect("/"); // 일반 유저는 접근 불가
  }

  // 담당 배정된 게시글들
  const assignments: OperatorAssignmentItem[] = await prisma.postAssignment.findMany({
    where: { operatorId: me.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          equipment: { select: { name: true, slug: true } },
          author: { select: { username: true } },
        },
      },
    },
  });

  // 나를 멘션한 최근 포스트들
  const mentions: OperatorMentionItem[] = await prisma.mention.findMany({
    where: { mentionedUserId: me.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      targetType: true,
      post: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          equipment: { select: { name: true, slug: true } },
          author: { select: { username: true } },
        },
      },
    },
  });

  const assignedCount = assignments.length;
  const mentionCount = mentions.length;
  const pendingCount = assignments.filter((a) => a.post.status === "OPEN").length;

  return (
    <div className="flex flex-col gap-6">
      <AnimateOnScroll>
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">오퍼레이터 인박스</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              담당 배정된 게시글과 나를 멘션한 스레드를 한 곳에서 확인합니다.
            </p>
            <div className="mt-2">
              <Link
                href="/operator/reservations"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                예약 관리 →
              </Link>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex flex-col items-end">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Assigned</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{assignedCount}</span>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-600" />
            <div className="flex flex-col items-end">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Mentions</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{mentionCount}</span>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-600" />
            <div className="flex flex-col items-end">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Pending</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{pendingCount}</span>
            </div>
          </div>
        </header>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned to me */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">담당 게시글</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">최신 순 최대 20개</span>
          </div>
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-xs text-zinc-500 dark:text-zinc-400">
                아직 담당으로 지정된 게시글이 없습니다.
              </div>
            ) : null}
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/posts/${a.post.id}`}
                className="block rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-sm shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {a.post.equipment.name} · @{a.post.author.username}
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">{a.post.title}</div>
                  </div>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {a.post.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>배정일 {formatDateTime(a.createdAt)}</span>
                  <span>작성일 {formatDateTime(a.post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Mentions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">나를 멘션한 스레드</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">최신 순 최대 20개</span>
          </div>
          <div className="space-y-3">
            {mentions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-xs text-zinc-500 dark:text-zinc-400">
                아직 멘션 알림이 없습니다.
              </div>
            ) : null}
            {mentions.map((m) => (
              <Link
                key={m.id}
                href={`/posts/${m.post.id}`}
                className="block rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-sm shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{m.post.equipment.name}</span>
                      <span>·</span>
                      <span>@{m.post.author.username}</span>
                      <span>·</span>
                      <span>{m.targetType === "COMMENT" ? "댓글 멘션" : "본문 멘션"}</span>
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">{m.post.title}</div>
                  </div>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {m.post.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>멘션 시각 {formatDateTime(m.createdAt)}</span>
                  <span>작성일 {formatDateTime(m.post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

