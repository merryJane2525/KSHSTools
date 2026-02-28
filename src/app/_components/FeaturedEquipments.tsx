import Link from "next/link";
import { FeaturedEquipmentImage } from "./FeaturedEquipmentImage";

type FeaturedEquipmentsProps = {
  equipmentSlugMap: Map<string, string>;
};

/**
 * 대표 장비 이미지: public/equipments/ 폴더에 아래 파일명으로 넣으면 표시됩니다.
 * - sem.jpg  → SEM
 * - ft-ir.jpg → FT-IR
 * - freeze-dryer.jpg → 동결건조기
 * (확장자는 .png, .webp 도 가능하나, 코드에서 .jpg 로 참조합니다. 다른 확장자 사용 시 아래 imagePath 를 수정하세요.)
 */
const FEATURED_EQUIPMENTS = [
  {
    name: "SEM",
    displayName: "SEM",
    description: "주사전자현미경",
    slug: "sem",
    imagePath: "/equipments/sem.jpg",
    detail:
      "전자현미경의 한 종류로, 전자 빔을 이용해 시료 표면의 미세구조를 관찰하는 장비이다. 재료의 표면 형상 분석에 주로 사용된다.",
  },
  {
    name: "FT-IR",
    displayName: "FT-IR",
    description: "적외선 분광기",
    slug: "ft-ir",
    imagePath: "/equipments/ft-ir.jpg",
    detail:
      "적외선 흡수 스펙트럼을 측정하여 물질의 화학 결합과 구조를 분석하는 장비이다. 본인이 합성한 물질이나 미지 시료가 어떤 물질인지 확인할 때 주로 사용된다.",
  },
  {
    name: "동결건조기",
    displayName: "동결건조기",
    description: "동결건조 장치",
    slug: "freeze-dryer",
    imagePath: "/equipments/freeze-dryer.jpg",
    detail:
      "시료를 저온에서 동결시킨 후 진공 상태에서 수분을 승화시켜 제거하는 장비이다. 열에 민감한 물질을 변성 없이 건조하거나 장기 보관용 시료를 준비할 때 사용된다.",
  },
];

export function FeaturedEquipments({ equipmentSlugMap }: FeaturedEquipmentsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {FEATURED_EQUIPMENTS.map((equipment) => {
        // DB에 해당 기자재가 있을 때만 매뉴얼 링크 사용 (slug가 DB와 일치해야 404 방지)
        const slugFromMap = equipmentSlugMap.get(equipment.name.toLowerCase());
        const slug = slugFromMap ?? null;
        const manualLink = slug ? `/equipments/${slug}/manual` : null;

        return (
          <div
            key={equipment.name}
            className="bg-white dark:bg-[#15191d] rounded-2xl border border-primary/10 dark:border-primary/20 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300"
          >
            {/* 이미지 영역: public/equipments/ 에 해당 파일이 있으면 표시, 없으면 플레이스홀더 */}
            <FeaturedEquipmentImage
              src={equipment.imagePath}
              alt={equipment.displayName}
              displayName={equipment.displayName}
            />

            {/* 내용 영역 */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-primary">{equipment.displayName}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/50 mt-1">{equipment.description}</p>
                <p className="text-sm text-primary/70 mt-3 leading-relaxed">
                  {equipment.detail}
                </p>
              </div>

              {manualLink ? (
                <Link
                  href={manualLink}
                  className="block w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white text-center hover:opacity-90 transition-all"
                >
                  매뉴얼 보기 →
                </Link>
              ) : (
                <div className="text-xs text-primary/50 text-center py-2">
                  매뉴얼 준비 중
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
