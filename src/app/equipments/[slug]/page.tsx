import Link from "next/link";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { parseWeekParam } from "@/lib/week";
import { WeekCalendarView } from "./WeekCalendarView";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

type RecentPostItem = {
  id: string;
  title: string;
  createdAt: Date;
};

type CalendarReservationRawItem = {
  id: string;
  status: "PENDING" | "APPROVED";
  startAt: Date;
  endAt: Date;
  user: { username: string };
};

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams?: Promise<{ week?: string }> | { week?: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  if (!slug) return { title: "기자재 | KSHS 심화기자재" };
  const equipment = await prisma.equipment.findUnique({
    where: { slug },
    select: { name: true, isActive: true },
  });
  if (!equipment || !equipment.isActive)
    return { title: "기자재 | KSHS 심화기자재" };
  const title = `${equipment.name} | KSHS 심화기자재`;
  const description = `${equipment.name} 사용 메뉴얼과 커뮤니티 질문·답변. KSHS 심화기자재 플랫폼.`;
  const url = `${baseUrl}/equipments/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

export default async function EquipmentDetailPage({ params, searchParams }: PageProps) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = searchParams ? await Promise.resolve(searchParams) : {};
  const { slug } = resolvedParams;
  const weekStart = parseWeekParam(resolvedSearch.week);

  if (!slug) {
    notFound();
  }

  const equipment = await prisma.equipment.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { posts: true } },
    },
  });
  if (!equipment || !equipment.isActive) notFound();

  // 최근 게시글 5개만 미리보기용으로 가져오기 (전체는 커뮤니티에서 확인)
  const recentPosts: RecentPostItem[] = await prisma.post.findMany({
    where: { equipmentId: equipment.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  const weekStartDate = new Date(weekStart + "T00:00:00+09:00");
  const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const calendarReservations = await prisma.reservation.findMany({
    where: {
      equipmentId: equipment.id,
      cancelledAt: null,
      startAt: { lt: weekEndDate },
      endAt: { gt: weekStartDate },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      status: true,
      startAt: true,
      endAt: true,
      user: { select: { username: true } },
    },
  });
  const calendarItems = (calendarReservations as CalendarReservationRawItem[]).map((r) => ({
    id: r.id,
    status: r.status,
    startAtIso: r.startAt.toISOString(),
    endAtIso: r.endAt.toISOString(),
    username: r.user.username,
  }));

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">기자재 정보</div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{equipment.name}</h1>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">/{equipment.slug}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
              href={`/reservations/${equipment.slug}`}
            >
              예약하기
            </Link>
            <Link
              className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
              href={`/equipments/${equipment.slug}/manual`}
            >
              사용 메뉴얼
            </Link>
            <Link
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              href={`/posts/new?equipmentId=${equipment.id}`}
            >
              질문 작성하기
            </Link>
          </div>
        </div>
      </AnimateOnScroll>

      {/* 기자재 기본 정보 카드 */}
      <AnimateOnScroll>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">기자재 이름</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{equipment.name}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">식별자 (Slug)</div>
            <div className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">/{equipment.slug}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">등록일</div>
              <div className="mt-1 text-sm text-zinc-900">{formatDate(equipment.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">마지막 업데이트</div>
              <div className="mt-1 text-sm text-zinc-900">{formatDate(equipment.updatedAt)}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">관련 질문 수</div>
                <div className="mt-1 text-2xl font-bold text-zinc-900">{equipment._count.posts}개</div>
              </div>
              <Link
                href={`/community?equipmentId=${equipment.id}`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                커뮤니티에서 보기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
      </AnimateOnScroll>

      {/* 예약 현황: 타임테이블만 표시 (예약 신청은 예약 탭에서) */}
      <AnimateOnScroll>
        <WeekCalendarView
          equipmentSlug={equipment.slug}
          weekStart={weekStart}
          reservations={calendarItems}
        />
      </AnimateOnScroll>

      {/* 최근 질문 미리보기 */}
      {recentPosts.length > 0 && (
        <AnimateOnScroll>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">최근 질문</h2>
            <Link
              href={`/community?equipmentId=${equipment.id}`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block rounded-lg border border-zinc-100 dark:border-zinc-700 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{post.title}</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(post.createdAt)}</div>
              </Link>
            ))}
          </div>
        </div>
        </AnimateOnScroll>
      )}
    </div>
  );
}

