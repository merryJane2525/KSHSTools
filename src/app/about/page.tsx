import Link from "next/link";
import type { Metadata } from "next";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

/** 오퍼레이터 명단: 00기 학생이름 | 기자재 이름 오퍼레이터 | 이메일 (추후 상세 업데이트) */
const OPERATOR_LIST: { generation: string; studentName: string; equipmentName: string; email: string }[] = [
  { generation: "32", studentName: "원재인", equipmentName: "커뮤니티·리드", email: "zaixiang0001@gmail.com" },
];

type LabOperator = { generation: string; studentName: string; equipmentName: string };

type LabOperatorSection = { labName: string; operators: LabOperator[] };

/** 과학실(장소)별 심화기자재 오퍼레이터 명단 */
const LAB_OPERATOR_SECTIONS: LabOperatorSection[] = [
  {
    labName: "물리실",
    operators: [
      // 레이저커팅기
      { generation: "33", studentName: "김창한", equipmentName: "레이저커팅기" },
      { generation: "33", studentName: "황승원", equipmentName: "레이저커팅기" },
      { generation: "32", studentName: "이지호", equipmentName: "레이저커팅기" },
      { generation: "33", studentName: "최송학", equipmentName: "레이저커팅기" },
      { generation: "32", studentName: "이동률", equipmentName: "레이저커팅기" },
      { generation: "33", studentName: "권도윤", equipmentName: "레이저커팅기" },
      // 열화상 카메라
      { generation: "33", studentName: "김창한", equipmentName: "열화상 카메라" },
      { generation: "33", studentName: "심지후", equipmentName: "열화상 카메라" },
      { generation: "33", studentName: "황승원", equipmentName: "열화상 카메라" },
      { generation: "32", studentName: "정효림", equipmentName: "열화상 카메라" },
      { generation: "32", studentName: "이현우", equipmentName: "열화상 카메라" },
      // 뇌파 측정기
      { generation: "33", studentName: "정은혁", equipmentName: "뇌파 측정기" },
      { generation: "32", studentName: "정효림", equipmentName: "뇌파 측정기" },
      { generation: "32", studentName: "이민찬", equipmentName: "뇌파 측정기" },
      // 초고속 카메라
      { generation: "33", studentName: "박승희", equipmentName: "초고속 카메라" },
      { generation: "33", studentName: "김창한", equipmentName: "초고속 카메라" },
      { generation: "33", studentName: "강동헌", equipmentName: "초고속 카메라" },
      { generation: "33", studentName: "김도윤", equipmentName: "초고속 카메라" },
      { generation: "33", studentName: "정은혁", equipmentName: "초고속 카메라" },
      { generation: "33", studentName: "조서찬", equipmentName: "초고속 카메라" },
    ],
  },
  {
    labName: "화학실",
    operators: [
      // SEM
      { generation: "33", studentName: "성희도", equipmentName: "SEM" },
      { generation: "33", studentName: "신채린", equipmentName: "SEM" },
      { generation: "33", studentName: "추윤지", equipmentName: "SEM" },
      { generation: "32", studentName: "이정호", equipmentName: "SEM" },
      { generation: "32", studentName: "원재인", equipmentName: "SEM" },
      // IR
      { generation: "33", studentName: "정윤", equipmentName: "IR" },
      { generation: "33", studentName: "조수임", equipmentName: "IR" },
      { generation: "33", studentName: "권태선", equipmentName: "IR" },
      { generation: "32", studentName: "김나람", equipmentName: "IR" },
      { generation: "32", studentName: "김창규", equipmentName: "IR" },
      // UV-vis 분광광도계
      { generation: "33", studentName: "김동건", equipmentName: "UV-vis 분광광도계" },
      { generation: "33", studentName: "서예련", equipmentName: "UV-vis 분광광도계" },
      { generation: "32", studentName: "민지현", equipmentName: "UV-vis 분광광도계" },
      { generation: "32", studentName: "박기동", equipmentName: "UV-vis 분광광도계" },
      { generation: "32", studentName: "유승원", equipmentName: "UV-vis 분광광도계" },
      // NMR
      { generation: "33", studentName: "박윤수", equipmentName: "NMR" },
      { generation: "32", studentName: "홍진기", equipmentName: "NMR" },
    ],
  },
  {
    labName: "생명과학실",
    operators: [
      // PCR
      { generation: "33", studentName: "김윤진", equipmentName: "PCR" },
      { generation: "32", studentName: "김승호", equipmentName: "PCR" },
      { generation: "32", studentName: "원하담", equipmentName: "PCR" },
      // 전기영동
      { generation: "33", studentName: "신성호", equipmentName: "전기영동" },
      { generation: "32", studentName: "임승준", equipmentName: "전기영동" },
      { generation: "32", studentName: "천현서", equipmentName: "전기영동" },
      // 회전증발농축기
      { generation: "33", studentName: "박서영", equipmentName: "회전증발농축기" },
      { generation: "33", studentName: "박상현", equipmentName: "회전증발농축기" },
      { generation: "32", studentName: "남규민", equipmentName: "회전증발농축기" },
      // 동결건조기
      { generation: "33", studentName: "정예담", equipmentName: "동결건조기" },
      // 형광현미경
      { generation: "33", studentName: "김슬아", equipmentName: "형광현미경" },
      { generation: "33", studentName: "김엘리", equipmentName: "형광현미경" },
      { generation: "32", studentName: "이주혁", equipmentName: "형광현미경" },
    ],
  },
  {
    labName: "지구과학실",
    operators: [
      { generation: "32", studentName: "김소희", equipmentName: "편광 현미경 및 박편" },
      { generation: "32", studentName: "김한중", equipmentName: "편광 현미경 및 박편" },
    ],
  },
  {
    labName: "천문대",
    operators: [
      // 연구용 망원경
      { generation: "33", studentName: "김혜원", equipmentName: "연구용 망원경" },
      { generation: "33", studentName: "심도원", equipmentName: "연구용 망원경" },
      { generation: "33", studentName: "최명서", equipmentName: "연구용 망원경" },
      { generation: "33", studentName: "유정우", equipmentName: "연구용 망원경" },
      { generation: "32", studentName: "이건희", equipmentName: "연구용 망원경" },
      { generation: "32", studentName: "이아림", equipmentName: "연구용 망원경" },
      { generation: "32", studentName: "서민성", equipmentName: "연구용 망원경" },
      // CPC / 행성캠 / Refracting Telescope 는 추후 업데이트 (운영 방식 정리 후)
    ],
  },
  {
    labName: "코어랩",
    operators: [
      { generation: "33", studentName: "이창민", equipmentName: "서버 컴퓨터" },
      { generation: "32", studentName: "최원섭", equipmentName: "서버 컴퓨터" },
    ],
  },
];

export const revalidate = 3600;

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
            className="text-sm text-primary/60 hover:text-primary hover:underline"
          >
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            강원과학고등학교(KSHS) 심화기자재 소개
          </h1>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="space-y-5 rounded-2xl border border-primary/10 dark:border-primary/20 bg-white dark:bg-[#15191d] p-6 shadow-sm text-sm leading-7 text-primary/70">
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

          {/* 커뮤니티 운영/리드 */}
          <div className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">커뮤니티·플랫폼 운영</div>
          <ul className="mt-2 space-y-1.5">
            {OPERATOR_LIST.map((op) => (
              <li key={`${op.generation}-${op.studentName}-${op.equipmentName}`}>
                <span>{op.generation}기 {op.studentName}</span>
                <span className="mx-1.5 text-zinc-400 dark:text-zinc-500">|</span>
                <span>{op.equipmentName}</span>
                <span className="mx-1.5 text-zinc-400 dark:text-zinc-500">|</span>
                <a
                  href={`mailto:${op.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {op.email}
                </a>
              </li>
            ))}
          </ul>

          {/* 과학실(장소)별 오퍼레이터 명단 */}
          <div className="mt-5 font-medium text-zinc-700 dark:text-zinc-300">과학실별 심화기자재 오퍼레이터</div>
          <div className="mt-3 space-y-3">
            {LAB_OPERATOR_SECTIONS.map((section) => (
              <div key={section.labName}>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {section.labName}
                </div>
                <ul className="mt-1 space-y-1.5">
                  {section.operators.map((op) => (
                    <li key={`${section.labName}-${op.generation}-${op.studentName}-${op.equipmentName}`}>
                      <span>{op.generation}기 {op.studentName}</span>
                      <span className="mx-1.5 text-zinc-400 dark:text-zinc-500">|</span>
                      <span>{op.equipmentName} 오퍼레이터</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="flex justify-center">
          <Link
            href="/"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </AnimateOnScroll>
    </div>
  );
}
