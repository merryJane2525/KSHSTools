"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { saveOperatorEquipmentAssignmentAction } from "@/app/actions/operator-equipment";
import { intersectionOperatorIds, type UnifiedAssignmentTarget } from "@/lib/equipment-bulk-groups";

type OperatorOption = { id: string; username: string; studentName: string | null };

export function OperatorEquipmentForm(props: {
  targets: UnifiedAssignmentTarget[];
  selectedKey: string | null;
  operators: OperatorOption[];
  linkedOperatorIds: Set<string>;
  operatorLinksByEquipment: Record<string, string[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const active = props.targets.find((t) => t.key === props.selectedKey) ?? props.targets[0] ?? null;

  const defaultChecked = useMemo(() => {
    const m = new Map<string, boolean>();
    if (!active) return m;
    const ids =
      active.equipmentIds.length > 1
        ? new Set(intersectionOperatorIds(active.equipmentIds, props.operatorLinksByEquipment))
        : props.linkedOperatorIds;
    for (const op of props.operators) {
      m.set(op.id, ids.has(op.id));
    }
    return m;
  }, [active, props.linkedOperatorIds, props.operatorLinksByEquipment, props.operators]);

  if (props.targets.length === 0) {
    return null;
  }

  const selectValue = props.selectedKey ?? props.targets[0].key;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-4">
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        기자재 / 묶음 선택
        <select
          className="mt-1 w-full max-w-2xl rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          value={selectValue}
          disabled={pending}
          onChange={(e) => {
            const key = e.target.value;
            startTransition(() => {
              router.push(`/admin/operator-equipment?selection=${encodeURIComponent(key)}`);
            });
          }}
        >
          {props.targets.map((t) => (
            <option key={t.key} value={t.key}>
              {t.optionLabel}
            </option>
          ))}
        </select>
      </label>

      {active?.description ? (
        <p
          className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
            active.kind === "group"
              ? "border border-blue-200 bg-blue-50/90 text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/35 dark:text-blue-100"
              : "border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
          }`}
        >
          {active.description}
        </p>
      ) : null}

      {active && active.kind === "group" && (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
          동일 이름 묶음: 한 번 저장하면 위에 나열된 <strong className="font-medium text-zinc-800 dark:text-zinc-200">모든 행</strong>
          에 같은 오퍼 구성이 적용됩니다.
        </div>
      )}

      <form
        key={active?.key ?? "form"}
        action={saveOperatorEquipmentAssignmentAction}
        className="space-y-3"
      >
        <input type="hidden" name="selection" value={active?.key ?? ""} />
        {active?.equipmentIds.map((id) => (
          <input key={id} type="hidden" name="equipmentIds" value={id} />
        ))}

        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">담당 오퍼레이터</div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          체크한 사용자만 커뮤니티 담당 지정·예약 시 선택 목록에 나타납니다. 묶음을 바꾸면, 묶음 안 모든 행에 공통으로 지정된
          오퍼만 기본으로 체크됩니다.
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
                  defaultChecked={defaultChecked.get(op.id) ?? false}
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
          disabled={pending || !active}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </form>
    </div>
  );
}
