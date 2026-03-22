import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { PostAdminQuickActions } from "./post-admin-actions";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import type { Prisma } from "@prisma/client";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

export const metadata: Metadata = {
  title: "커뮤니티 | KSHS 심화기자재 | 강원과학고등학교 심화기자재",
  description: "강원과학고등학교(KSHS) 심화기자재 커뮤니티. 강원과학고 오퍼레이터, 원재인이 운영하며, 기자재별 질문·답변, 사용 노하우, 실험 팁을 공유합니다.",
  keywords: ["강원과학고", "강원과학고등학교", "KSHS 심화기자재", "강원과학고 원재인", "KSHS 원재인", "32기 원재인", "심화기자재 커뮤니티"],
  alternates: { canonical: `${baseUrl}/community` },
  openGraph: {
    title: "커뮤니티 | KSHS 심화기자재 | 강원과학고등학교 심화기자재",
    description: "강원과학고 심화기자재 커뮤니티. 기자재별 질문·답변, 사용 노하우, 실험 팁 공유",
    url: `${baseUrl}/community`,
  },
};

type CommunityPostItem = {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: Date;
  equipment: { id: string; name: string; slug: string };
  author: { username: string };
  _count: { comments: number };
};

type EquipmentListItem = {
  id: string;
  name: string;
};

type CommunitySearchParams = {
  q?: string;
  equipmentId?: string;
  status?: string;
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: CommunitySearchParams;
}) {
  const me = await getCurrentUser();

  const q = (searchParams.q ?? "").trim();
  const equipmentId = searchParams.equipmentId ?? "";
  const status = searchParams.status ?? "";

  const where: Prisma.PostWhereInput = {
    deletedAt: null,
  };

  if (equipmentId) {
    where.equipmentId = equipmentId;
  }

  if (status === "OPEN" || status === "RESOLVED") {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  const [posts, equipments] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        createdAt: true,
        equipment: { select: { id: true, name: true, slug: true } },
        author: { select: { username: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const postsTyped = posts as CommunityPostItem[];
  const equipmentsTyped = equipments as EquipmentListItem[];

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">커뮤니티 Q&amp;A</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              기자재별 기술 질문과 답변을 한 곳에서 모아보고 검색할 수 있습니다.
            </p>
          </div>
          <Link
            href={me ? "/posts/new" : `/login?returnUrl=${encodeURIComponent("/posts/new")}`}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            질문 작성하기
          </Link>
        </div>

        <form
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm"
          method="get"
        >
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="질문 제목이나 본문으로 검색..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 pl-9 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
              {/* simple magnifier icon replacement */}
              🔍
            </span>
          </div>

          <select
            name="equipmentId"
            defaultValue={equipmentId}
            className="min-w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          >
            <option value="">전체 기자재</option>
            {equipmentsTyped.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="min-w-[120px] rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          >
            <option value="">전체 상태</option>
            <option value="OPEN">OPEN</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            필터 적용
          </button>
        </form>
      </header>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            총{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {postsTyped.length}
            </span>{" "}
            개의 질문
          </span>
        </div>

        {postsTyped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            조건에 맞는 게시글이 없습니다. 검색어 또는 필터를 조정해 보세요.
          </div>
        ) : null}

        <div className="space-y-3">
          {postsTyped.map((p) => {
            const preview =
              p.body.length > 160 ? `${p.body.slice(0, 157)}...` : p.body;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Link href={`/posts/${p.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium">
                          {p.equipment.name}
                        </span>
                        <span>@{p.author.username}</span>
                        <span>·</span>
                        <span>{formatDateTime(p.createdAt)}</span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {p.title}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {preview}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {p.status}
                      </span>
                      <span>{p._count.comments} 댓글</span>
                    </div>
                  </div>
                </Link>
                {/* ADMIN 전용 빠른 관리 기능 */}
                {me?.role === "ADMIN" && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                    <PostAdminQuickActions postId={p.id} currentStatus={p.status} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      </AnimateOnScroll>
    </div>
  );
}

