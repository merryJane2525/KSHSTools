import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CreateEquipmentForm } from "./ui";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

export const metadata: Metadata = {
  title: "기자재 목록 | KSHS 심화기자재 | 강원과학고등학교 심화기자재",
  description: "강원과학고등학교(KSHS) 심화기자재 목록. SEM, FT-IR, NMR 등 강원과학고 심화기자재 사용 메뉴얼과 커뮤니티 게시글을 확인하세요.",
  keywords: ["강원과학고", "강원과학고등학교", "강원과학고 심화기자재", "KSHS 심화기자재", "심화기자재 목록", "SEM", "FT-IR", "NMR"],
  alternates: { canonical: `${baseUrl}/equipments` },
  openGraph: {
    title: "기자재 목록 | KSHS 심화기자재 | 강원과학고등학교 심화기자재",
    description: "강원과학고등학교 심화기자재 목록·사용 메뉴얼·커뮤니티",
    url: `${baseUrl}/equipments`,
  },
};

type EquipmentListItem = {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
};

export default async function EquipmentsPage() {
  let me: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    me = await getCurrentUser();
  } catch {
    me = null;
  }

  let equipments: EquipmentListItem[] = [];
  let loadError: string | null = null;
  try {
    equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
    });
  } catch {
    loadError = "목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">기자재</h1>
          <p className="mt-2 text-base text-red-600 dark:text-red-400">{loadError}</p>
          <Link
            href="/equipments"
            className="mt-4 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            새로고침
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">기자재</h1>
            <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
              등록된 기자재 목록입니다. 각 기자재의 상세 정보를 확인하고, 해당 기자재 관련 질문은 커뮤니티에서 확인할 수
              있습니다.
            </p>
          </div>
          {me?.role === "ADMIN" ? <CreateEquipmentForm /> : null}
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {equipments.map((eq) => (
          <div
            key={eq.id}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Link href={`/equipments/${eq.slug}/manual`} className="block">
              <div className="flex items-center justify-between gap-4">
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{eq.name}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{eq._count.posts}개 질문</div>
              </div>
              <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">/{eq.slug}</div>
            </Link>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between gap-2">
              <Link
                href={`/equipments/${eq.slug}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 transition-colors"
              >
                기자재 정보
              </Link>
              <Link
                href={`/community?equipmentId=${eq.id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                관련 질문 보기 →
              </Link>
            </div>
          </div>
        ))}
      </AnimateOnScroll>
    </div>
  );
}