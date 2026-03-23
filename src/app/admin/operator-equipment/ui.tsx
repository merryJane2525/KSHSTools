"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { saveOperatorEquipmentLinksAction } from "@/app/actions/operator-equipment";

type EquipmentOption = { id: string; name: string; slug: string };
type OperatorOption = { id: string; username: string; studentName: string | null };

export function OperatorEquipmentForm(props: {
  equipments: EquipmentOption[];
  operators: OperatorOption[];
  selectedEquipmentId: string | null;
  linkedOperatorIds: Set<string>;
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

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-4">
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
  );
}
