import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { EquipmentTable } from "./_components/EquipmentTable";
import { FeaturedEquipments } from "./_components/FeaturedEquipments";
import { AnimateOnScroll } from "./_components/AnimateOnScroll";

type EquipmentSlugItem = {
  id: string;
  name: string;
  slug: string;
};

const seoKeywords = [
  "강원과학고", "강원과학고등학교", "강원과학고 심화기자재", "강원과학고등학교 심화기자재",
  "KSHS", "KSHS 심화기자재", "강원과학고 오퍼레이터", "강원과학고 원재인", "KSHS 원재인", "32기 원재인",
  "심화기자재", "기자재", "실험", "SEM", "FT-IR", "NMR", "기자재 사용법", "실험 노하우", "기자재 Q&A",
];

export const metadata: Metadata = {
  title: "KSHS 심화기자재 | 강원과학고등학교 심화기자재",
  description: "강원과학고등학교(KSHS) 심화기자재 사용법, 실험 노하우, 기자재 Q&A를 공유하는 플랫폼. 강원과학고 오퍼레이터·원재인(32기)이 운영하며, SEM, FT-IR, NMR 등 다양한 심화 기자재의 체계적인 사용 정보와 커뮤니티를 제공합니다.",
  keywords: seoKeywords,
};

// 홈 기자재 목록 캐시 (60초) — DB 부하·응답 속도 개선
const getCachedEquipments = unstable_cache(
  async () => {
    return prisma.equipment.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    });
  },
  ["home-equipments"],
  { revalidate: 60, tags: ["equipments"] }
);

export default async function Home() {
  const equipments = (await getCachedEquipments()) as EquipmentSlugItem[];
  const equipmentSlugMap = new Map(
    equipments.map((eq: EquipmentSlugItem) => [eq.name.toLowerCase(), eq.slug])
  );

  const youtubeVideoId = "wZe2uhh0zhY";
  const embedParams = "autoplay=1&mute=1&loop=1&playlist=" + youtubeVideoId + "&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1";

  return (
    <>
      {/* Hero 섹션: 영상 배경 + 제목/About 버튼 (중앙) */}
      <div className="relative w-screen h-screen -mt-28 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] overflow-hidden">
        {/* 영상 레이어 — 뷰포트 전체를 cover */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-[max(100vw,177.78vh)] h-[max(56.25vw,100vh)]"
            aria-hidden
          >
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?${embedParams}`}
              title="배경 영상"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-[max(100vw,177.78vh)] h-[max(56.25vw,100vh)] pointer-events-none"
              style={{ border: 0 }}
            />
          </div>
          <div
            className="absolute inset-0 bg-primary/80 dark:bg-[#15191d]/88"
            aria-hidden
          />
        </div>

        {/* 제목 + About 버튼 — 영상 중앙에 배치 */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center px-6">
          <div className="text-center space-y-4">
            <h1 className="whitespace-nowrap text-4xl font-bold tracking-tight text-white drop-shadow-md home-animate-fade-in-up md:text-5xl">
              KSHS 심화기자재
            </h1>
            <div className="overflow-x-auto overflow-y-hidden px-2">
              <p className="mx-auto inline-block max-w-2xl whitespace-nowrap text-lg text-white/90 drop-shadow-sm home-animate-fade-in-up home-delay-1">
                심화 기자재의 체계적인 사용 정보와 실험 경험을 공유하는 플랫폼
              </p>
            </div>
            <div className="home-animate-fade-in-up home-delay-2">
              <Link
                href="/about"
                className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all shadow-lg"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 일반 배경 섹션: 목록 + 대표 장비 (영상 아래) */}
      <div className="space-y-12 py-12">
        {/* 심화기자재 목록 — 스크롤 시 등장 */}
        <AnimateOnScroll className="space-y-4 flex flex-col items-center">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            심화기자재 목록
          </h2>
          <div className="w-full max-w-2xl rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-5 shadow-sm hover:border-primary/20 hover:shadow-md transition-all dark:border-primary/20">
            <EquipmentTable equipmentSlugMap={equipmentSlugMap} />
          </div>
        </AnimateOnScroll>

        {/* 대표 장비 섹션 — 스크롤 시 등장 */}
        <AnimateOnScroll className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            대표 장비
          </h2>
          <div className="rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-5 shadow-sm hover:border-primary/20 hover:shadow-md transition-all dark:border-primary/20">
            <FeaturedEquipments equipmentSlugMap={equipmentSlugMap} />
          </div>
        </AnimateOnScroll>
      </div>
    </>
  );
}
