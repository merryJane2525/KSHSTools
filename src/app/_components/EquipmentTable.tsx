import Link from "next/link";

type EquipmentTableProps = {
  equipmentSlugMap: Map<string, string>;
};

const EQUIPMENT_LIST = [
  "연구용 망원경",
  "초고속 카메라",
  "UV-vis",
  "FT-IR",
  "돕소니안",
  "전기영동장치",
  "GEL documentation",
  "PCR",
  "NMR",
  "PolarizingMicroscope",
  "SEM",
  "레이저커팅기",
  "배양기",
  "오토클레이브",
  "Refracting Telescope",
  "CPC",
  "클린벤치",
  "동결건조기",
  "행성캠",
  "열화상카메라",
  "회전증발농축기",
  "뇌파측정기",
  "서버컴퓨터",
];

export function EquipmentTable({ equipmentSlugMap }: EquipmentTableProps) {
  return (
    <div className="bg-white dark:bg-[#15191d] rounded-2xl border border-primary/10 dark:border-primary/20 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-primary/10 dark:bg-primary/20">
        {EQUIPMENT_LIST.map((equipment, index) => {
          const slug = equipmentSlugMap.get(equipment.toLowerCase());
          const cellContent = slug ? (
            <Link
              href={`/equipments/${slug}`}
              className="block px-4 py-3 text-sm text-center text-primary/70 hover:bg-primary/5 hover:text-primary transition-colors dark:text-primary/80 dark:hover:bg-primary/20"
            >
              {equipment}
            </Link>
          ) : (
            <div className="px-4 py-3 text-sm text-center text-primary/50 dark:text-primary/60">{equipment}</div>
          );

          return (
            <div key={index} className="bg-white dark:bg-[#15191d]">
              {cellContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
