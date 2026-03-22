import Link from "next/link";
import { lookupEquipmentSlug } from "@/lib/home-equipment-resolve";

type EquipmentTableProps = {
  equipmentSlugMap: Map<string, string>;
  equipments: Array<{ name: string; slug: string }>;
};

/** 홈 심화기자재 목록 표 (표시 순서 고정). slug는 DB 이름과 매칭·별칭으로 연결 */
const EQUIPMENT_LIST = [
  "레이저커팅기",
  "열화상 카메라",
  "뇌파 측정기",
  "초고속 카메라",
  "SEM",
  "IR",
  "UV-vis 분광광도계",
  "NMR",
  "PCR",
  "전기영동",
  "회전증발농축기",
  "동결건조기",
  "형광현미경",
  "편광 현미경 및 박편",
  "연구용 망원경",
  "돕소니안",
  "CPC",
  "행성캠",
  "Refracting Telescope",
  "서버 컴퓨터",
] as const;

/** 3열 그리드를 맞추기 위한 빈 칸 개수 (20개 → 21칸) */
const PAD_CELLS = (3 - (EQUIPMENT_LIST.length % 3)) % 3;

export function EquipmentTable({ equipmentSlugMap, equipments }: EquipmentTableProps) {
  return (
    <div className="bg-white dark:bg-[#15191d] rounded-2xl border border-primary/10 dark:border-primary/20 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-primary/10 dark:bg-primary/20">
        {EQUIPMENT_LIST.map((equipment, index) => {
          const slug = lookupEquipmentSlug(equipment, equipmentSlugMap, equipments);
          const cellContent = slug ? (
            <Link
              href={`/equipments/${slug}`}
              className="flex min-h-[3rem] items-center justify-center px-4 py-3 text-sm text-center text-primary/70 hover:bg-primary/5 hover:text-primary transition-colors dark:text-primary/80 dark:hover:bg-primary/20"
            >
              {equipment}
            </Link>
          ) : (
            <div className="flex min-h-[3rem] items-center justify-center px-4 py-3 text-sm text-center text-primary/50 dark:text-primary/60">
              {equipment}
            </div>
          );

          return (
            <div key={index} className="bg-white dark:bg-[#15191d]">
              {cellContent}
            </div>
          );
        })}
        {Array.from({ length: PAD_CELLS }, (_, i) => (
          <div
            key={`pad-${i}`}
            className="min-h-[3rem] bg-zinc-100/80 dark:bg-zinc-800/50"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
