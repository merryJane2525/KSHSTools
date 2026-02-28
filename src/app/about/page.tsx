import Link from "next/link";
import type { Metadata } from "next";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

const seoKeywords = [
  "강원과학고", "강원과학고등학교", "강원과학고 심화기자재", "강원과학고등학교 심화기자재",
  "KSHS", "KSHS 심화기자재", "강원과학고 오퍼레이터", "강원과학고 원재인", "KSHS 원재인", "32기 원재인",
];

export const metadata: Metadata = {
  title: "소개 | KSHS 심화기자재 | 강원과학고등학교 심화기자재",
  description: "강원과학고등학교(KSHS) 심화기자재 플랫폼 소개. 강원과학고 오퍼레이터·원재인(32기)이 운영하며, 심화 기자재 사용법과 실험 노하우를 체계적으로 기록·공유합니다.",
  keywords: seoKeywords,
  alternates: { canonical: `${baseUrl}/about` },
  openGraph: {
    title: "소개 | KSHS 심화기자재 | 강원과학고등학교 심화기자재",
    description: "강원과학고 오퍼레이터·원재인(32기)이 운영하는 강원과학고등학교 심화기자재 플랫폼 소개",
    url: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <AnimateOnScroll>
        <div className="space-y-2">
          <Link
            href="/"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
          >
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            강원과학고등학교(KSHS) 심화기자재 소개
          </h1>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="space-y-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          <p>
            강원과학고등학교(KSHS) 심화 기자재는 단순한 이론 학습만으로는 익히기 어렵고, 실제 사용 경험을 통해 비로소 제대로 이해할 수 있습니다. 그러나 하나의 연구에 오랜 시간 집중하는 환경에서는 다양한 기기를 접할 기회가 제한되고, 같은 공간에 있으면서도 동기·선후배 간의 노하우가 충분히 공유되지 못하는 경우가 많습니다. 그 결과, 기자재를 올바르게 사용하지 못해 장비가 손상되거나, 안전사고로 이어질 위험도 존재합니다.
          </p>
          <p>
            이 웹사이트는 이러한 문제의식에서 출발했습니다. 강원과학고 심화기자재의 사용법과 실험 노하우를 체계적으로 기록하고 공유함으로써, 누구나 보다 안전하고 효율적으로 장비를 다룰 수 있도록 돕고자 합니다. 또한 단순한 매뉴얼 아카이브를 넘어, 경험과 질문, 팁을 자유롭게 나눌 수 있는 커뮤니티를 통해 학생들 사이의 지식과 경험이 자연스럽게 이어지는 환경을 만들고자 합니다.
          </p>
          <p>
            이곳이 실험실의 경험을 확장하고, 서로의 시행착오를 줄이며, 더 나은 연구로 나아가는 출발점이 되기를 바랍니다.
          </p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-5 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">KSHS 심화기자재 운영</div>
          <div className="mt-2">
            32기 원재인 | 커뮤니티 관리자, 리드 엔지니어 |{" "}
            <a
              href="mailto:zaixiang0001@gmail.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              zaixiang0001@gmail.com
            </a>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="flex justify-center">
          <Link
            href="/"
            className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </AnimateOnScroll>
    </div>
  );
}
