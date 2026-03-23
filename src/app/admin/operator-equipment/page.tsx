import { prisma } from "@/lib/db";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { OperatorEquipmentForm } from "./ui";
import {
  buildEquipmentBulkGroups,
  buildUnifiedAssignmentTargets,
  intersectionOperatorIds,
  resolveAssignmentSelectionKey,
} from "@/lib/equipment-bulk-groups";

type PageProps = {
  searchParams:
    | Promise<{ selection?: string; equipmentId?: string; saved?: string; error?: string; n?: string }>
    | { selection?: string; equipmentId?: string; saved?: string; error?: string; n?: string };
};

export default async function AdminOperatorEquipmentPage({ searchParams }: PageProps) {
  const resolved = await Promise.resolve(searchParams);

  const equipments = await prisma.equipment.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const operators = await prisma.user.findMany({
    where: { status: "ACTIVE", role: "OPERATOR" },
    orderBy: { username: "asc" },
    select: { id: true, username: true, studentName: true },
  });

  const allLinks = await prisma.operatorEquipment.findMany({
    select: { equipmentId: true, operatorId: true },
  });
  const operatorLinksByEquipment: Record<string, string[]> = {};
  for (const row of allLinks) {
    if (!operatorLinksByEquipment[row.equipmentId]) operatorLinksByEquipment[row.equipmentId] = [];
    operatorLinksByEquipment[row.equipmentId].push(row.operatorId);
  }

  const bulkGroups = buildEquipmentBulkGroups(equipments);
  const targets = buildUnifiedAssignmentTargets(equipments, bulkGroups);

  const selectedKey = resolveAssignmentSelectionKey(
    typeof resolved.selection === "string" ? resolved.selection : undefined,
    typeof resolved.equipmentId === "string" ? resolved.equipmentId : undefined,
    targets,
  );

  const activeTarget = targets.find((t) => t.key === selectedKey) ?? null;
  const linkedIds = new Set<string>(
    activeTarget ? intersectionOperatorIds(activeTarget.equipmentIds, operatorLinksByEquipment) : [],
  );

  const saveCount = resolved.n && /^\d+$/.test(resolved.n) ? parseInt(resolved.n, 10) : null;

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">기자재별 담당 오퍼레이터</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            기자재마다 <strong className="font-medium text-zinc-800 dark:text-zinc-200">담당으로 둘 오퍼레이터</strong>를
            연결합니다. 동일 이름으로 DB에 여러 행이 있거나, A·B 등 여러 대로 구분되는 기종은{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">일괄 선택</strong>에서 한 번에 지정합니다. 한
            대만 해당하는 기자재는 이름만 표시됩니다. 아무에게도 연결하지 않고 저장하면 해당 기자재는 전체 오퍼레이터 허용
            규칙으로 돌아갑니다.
          </p>
        </div>
      </AnimateOnScroll>

      {resolved.saved === "1" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          {saveCount !== null && saveCount > 1 ? (
            <>
              <strong className="font-medium">{saveCount}건</strong>의 기자재에 저장되었습니다.
            </>
          ) : (
            "저장되었습니다."
          )}
        </p>
      )}
      {resolved.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          요청을 처리하지 못했습니다. 다시 시도해 주세요.
        </p>
      )}

      {equipments.length === 0 ? (
        <p className="text-sm text-zinc-600">등록된 기자재가 없습니다.</p>
      ) : (
        <AnimateOnScroll>
          <OperatorEquipmentForm
            key={selectedKey ?? "none"}
            targets={targets}
            selectedKey={selectedKey}
            operators={operators}
            linkedOperatorIds={linkedIds}
            operatorLinksByEquipment={operatorLinksByEquipment}
          />
        </AnimateOnScroll>
      )}
    </div>
  );
}
