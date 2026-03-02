import { EquipmentTable } from "./EquipmentTable";
import { FeaturedEquipments } from "./FeaturedEquipments";
import { AnimateOnScroll } from "./AnimateOnScroll";

type HomeBelowFoldProps = {
  equipmentSlugMap: Map<string, string>;
};

export function HomeBelowFold({ equipmentSlugMap }: HomeBelowFoldProps) {
  return (
    <div className="space-y-12 py-12">
      <AnimateOnScroll className="space-y-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          심화기자재 목록
        </h2>
        <div className="w-full max-w-2xl rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-5 shadow-sm hover:border-primary/20 hover:shadow-md transition-all dark:border-primary/20">
          <EquipmentTable equipmentSlugMap={equipmentSlugMap} />
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          대표 장비
        </h2>
        <div className="rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-5 shadow-sm hover:border-primary/20 hover:shadow-md transition-all dark:border-primary/20">
          <FeaturedEquipments equipmentSlugMap={equipmentSlugMap} />
        </div>
      </AnimateOnScroll>
    </div>
  );
}
