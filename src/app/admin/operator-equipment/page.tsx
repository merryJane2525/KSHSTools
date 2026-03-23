import { prisma } from "@/lib/db";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { OperatorEquipmentForm } from "./ui";
import { buildEquipmentBulkGroups } from "@/lib/equipment-bulk-groups";
import { getEquipmentUnitLabels } from "@/lib/equipment-units";

type PageProps = {
  searchParams:
    | Promise<{ equipmentId?: string; saved?: string; error?: string; n?: string }>
    | { equipmentId?: string; saved?: string; error?: string; n?: string };
};

export default async function AdminOperatorEquipmentPage({ searchParams }: PageProps) {
  const resolved = await Promise.resolve(searchParams);
  const selectedId =
    resolved.equipmentId && /^[0-9a-f-]{36}$/i.test(resolved.equipmentId) ? resolved.equipmentId : null;

  const equipments = await prisma.equipment.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const operators = await prisma.user.findMany({
    where: { status: "ACTIVE", role: "OPERATOR" },
    orderBy: { username: "asc" },
    select: { id: true, username: true, studentName: true },
  });

  const equipmentId = selectedId ?? equipments[0]?.id ?? null;
  const linked = equipmentId
    ? await prisma.operatorEquipment.findMany({
        where: { equipmentId },
        select: { operatorId: true },
      })
    : [];
  const linkedIds = new Set<string>(linked.map((r: { operatorId: string }) => r.operatorId));

  const allLinks = await prisma.operatorEquipment.findMany({
    select: { equipmentId: true, operatorId: true },
  });
  const operatorLinksByEquipment: Record<string, string[]> = {};
  for (const row of allLinks) {
    if (!operatorLinksByEquipment[row.equipmentId]) operatorLinksByEquipment[row.equipmentId] = [];
    operatorLinksByEquipment[row.equipmentId].push(row.operatorId);
  }

  const bulkGroups = buildEquipmentBulkGroups(equipments);

  const selectedName = equipments.find((e: { id: string; name: string }) => e.id === equipmentId)?.name ?? "";
  const unitLabelsForSelected = getEquipmentUnitLabels(selectedName);

  const bulkCount = resolved.n && /^\d+$/.test(resolved.n) ? parseInt(resolved.n, 10) : null;

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">기자재별 오퍼레이터</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            기자재마다 담당 오퍼레이터를 지정합니다. 특정 기자재에 아무도 체크하지 않으면(목록 비우기) 해당 장비는{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">모든 오퍼레이터</strong>가 커뮤니티·예약에서
            선택 가능합니다.
          </p>
        </div>
      </AnimateOnScroll>

      {resolved.saved === "1" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          저장되었습니다.
        </p>
      )}
      {resolved.saved === "bulk" && bulkCount !== null && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          동일 묶음 기준으로 <strong className="font-medium">{bulkCount}건</strong>의 기자재에 동일하게 저장되었습니다.
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
            key={equipmentId ?? "none"}
            equipments={equipments}
            operators={operators}
            selectedEquipmentId={equipmentId}
            linkedOperatorIds={linkedIds}
            bulkGroups={bulkGroups}
            operatorLinksByEquipment={operatorLinksByEquipment}
            unitLabelsForSelected={unitLabelsForSelected}
          />
        </AnimateOnScroll>
      )}
    </div>
  );
}
