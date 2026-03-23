"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveOperatorEquipmentBulkAction, saveOperatorEquipmentLinksAction } from "@/app/actions/operator-equipment";
import type { EquipmentBulkGroup } from "@/lib/equipment-bulk-groups";

type EquipmentOption = { id: string; name: string; slug: string };
type OperatorOption = { id: string; username: string; studentName: string | null };

function intersectionOperatorIds(
  equipmentIds: string[],
  operatorLinksByEquipment: Record<string, string[]>,
): Set<string> {
  if (equipmentIds.length === 0) return new Set();
  const sets = equipmentIds.map((id) => new Set(operatorLinksByEquipment[id] ?? []));
  return new Set([...sets[0]].filter((opId) => sets.every((s) => s.has(opId))));
}

export function OperatorEquipmentForm(props: {
  equipments: EquipmentOption[];
  operators: OperatorOption[];
  selectedEquipmentId: string | null;
  linkedOperatorIds: Set<string>;
  bulkGroups: EquipmentBulkGroup[];
  operatorLinksByEquipment: Record<string, string[]>;
  unitLabelsForSelected: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const equipmentId = props.selectedEquipmentId ?? props.equipments[0]?.id ?? "";

  const initialChecked = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const op of props.operators) {
      m.set(op.id, props.linkedOperatorIds.has(op.id));
    }
    return m;
  }, [props.operators, props.linkedOperatorIds]);

  const [bulkGroupKey, setBulkGroupKey] = useState(() => props.bulkGroups[0]?.groupKey ?? "");

  const activeBulkGroup = props.bulkGroups.find((g) => g.groupKey === bulkGroupKey) ?? props.bulkGroups[0] ?? null;

  const bulkDefaultChecked = useMemo(() => {
    if (!activeBulkGroup) return new Map<string, boolean>();
    const inter = intersectionOperatorIds(activeBulkGroup.equipmentIds, props.operatorLinksByEquipment);
    const m = new Map<string, boolean>();
    for (const op of props.operators) {
      m.set(op.id, inter.has(op.id));
    }
    return m;
  }, [activeBulkGroup, props.operatorLinksByEquipment, props.operators]);

  const selectedEquipmentName = props.equipments.find((e) => e.id === equipmentId)?.name ?? "";

  return (
    <div className="space-y-8">
      {props.bulkGroups.length > 0 && activeBulkGroup && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30">
          <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100">알파벳·단위로 나뉜 동일 장비 (일괄 지정)</h2>
          <p className="mt-1 text-xs text-blue-800/90 dark:text-blue-200/90">
            이름 끝이 <code className="rounded bg-blue-100/80 px-1 dark:bg-blue-900/50"> A</code>,{" "}
            <code className="rounded bg-blue-100/80 px-1 dark:bg-blue-900/50"> (B)</code> 처럼 구분된 기자재 행을 한 묶음으로
            보고, 같은 오퍼레이터 구성을 한 번에 저장합니다.
          </p>

          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium text-blue-950 dark:text-blue-50">
              묶음 선택
              <select
                className="mt-1 w-full max-w-xl rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-400 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-50 dark:focus:border-blue-600"
                value={bulkGroupKey}
                disabled={pending}
                onChange={(e) => setBulkGroupKey(e.target.value)}
              >
                {props.bulkGroups.map((g) => (
                  <option key={g.groupKey} value={g.groupKey}>
                    {g.displayLabel} ({g.unitTags.join(", ")}) · {g.equipmentIds.length}건
                  </option>
                ))}
              </select>
            </label>

            <form
              key={activeBulkGroup.groupKey}
              action={saveOperatorEquipmentBulkAction}
              className="space-y-3 rounded-xl border border-blue-100 bg-white/90 p-3 dark:border-blue-900/40 dark:bg-zinc-900/80"
            >
              {activeBulkGroup.equipmentIds.map((id) => (
                <input key={id} type="hidden" name="equipmentIds" value={id} />
              ))}
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">묶음에 포함된 기자재</div>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400">
                {activeBulkGroup.equipmentIds.map((id, i) => (
                  <li key={id}>
                    · {props.equipments.find((e) => e.id === id)?.name ?? id}
                    {activeBulkGroup.unitTags[i] ? (
                      <span className="text-zinc-500"> (단위: {activeBulkGroup.unitTags[i]})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">담당 오퍼레이터 (묶음 전체에 동일 적용)</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                묶음을 바꾸면, 각 묶음에 대해 <strong className="font-medium text-zinc-700 dark:text-zinc-300">모든 행에 공통으로</strong>{" "}
                체크된 오퍼만 기본 선택됩니다.
              </p>
              <ul className="max-h-[min(50vh,22rem)] space-y-2 overflow-auto rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                {props.operators.length === 0 ? (
                  <li className="text-sm text-zinc-500">ACTIVE 오퍼레이터 역할 사용자가 없습니다.</li>
                ) : (
                  props.operators.map((op) => (
                    <li key={op.id} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="operatorIds"
                        value={op.id}
                        defaultChecked={bulkDefaultChecked.get(op.id) ?? false}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <label className="cursor-pointer leading-snug">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">@{op.username}</span>
                        {op.studentName ? (
                          <span className="text-zinc-600 dark:text-zinc-400"> · {op.studentName}</span>
                        ) : null}
                      </label>
                    </li>
                  ))
                )}
              </ul>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-blue-200 dark:text-blue-950"
              >
                {pending ? "저장 중…" : "묶음 전체에 저장"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">기자재별 오퍼레이터 (개별)</h2>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          기자재 선택
          <select
            className="mt-1 w-full max-w-xl rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            value={equipmentId}
            disabled={pending}
            onChange={(e) => {
              const id = e.target.value;
              startTransition(() => {
                router.push(`/admin/operator-equipment?equipmentId=${encodeURIComponent(id)}`);
              });
            }}
          >
            {props.equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </label>

        {props.unitLabelsForSelected.length > 1 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            <strong className="font-medium">{selectedEquipmentName}</strong>는 예약 시{" "}
            {props.unitLabelsForSelected.join(", ")} 등으로 구분됩니다. 오퍼레이터 지정은{" "}
            <strong className="font-medium">이 기자재 한 번</strong>으로 모든 단위에 공통 적용됩니다.
          </p>
        )}

        <form action={saveOperatorEquipmentLinksAction} className="space-y-3">
          <input type="hidden" name="equipmentId" value={equipmentId} />
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">이 기자재를 담당하는 오퍼레이터</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            체크한 사용자만 커뮤니티 담당 지정·예약 시 선택 목록에 나타납니다. 아무것도 체크하지 않고 저장하면 전체 오퍼레이터 규칙으로 돌아갑니다.
          </p>
          <ul className="max-h-[min(60vh,28rem)] space-y-2 overflow-auto rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
            {props.operators.length === 0 ? (
              <li className="text-sm text-zinc-500">ACTIVE 오퍼레이터 역할 사용자가 없습니다.</li>
            ) : (
              props.operators.map((op) => (
                <li key={op.id} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="operatorIds"
                    value={op.id}
                    defaultChecked={initialChecked.get(op.id) ?? false}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                  />
                  <label className="cursor-pointer leading-snug">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">@{op.username}</span>
                    {op.studentName ? (
                      <span className="text-zinc-600 dark:text-zinc-400"> · {op.studentName}</span>
                    ) : null}
                  </label>
                </li>
              ))
            )}
          </ul>
          <button
            type="submit"
            disabled={pending || !equipmentId}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
