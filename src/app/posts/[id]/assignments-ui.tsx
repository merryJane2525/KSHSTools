"use client";

import { addAssignmentFormAction, removeAssignmentFormAction } from "@/app/actions/assignments";
import { OperatorSearchPicker, type OperatorPickerOption } from "@/app/_components/OperatorSearchPicker";

type UserRole = "USER" | "OPERATOR" | "ADMIN";

type Assignment = {
  operatorId: string;
  operator: { username: string };
};

export function PostAssignmentsManager(props: {
  postId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  postAuthorId: string;
  assignments: Assignment[];
  operators: OperatorPickerOption[];
  operatorHint?: string;
}) {
  const canEdit =
    props.currentUserRole === "ADMIN" || props.currentUserId === props.postAuthorId;

  if (!canEdit && props.assignments.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">담당 오퍼레이터</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            최대 3명까지 지정할 수 있습니다.
          </div>
          {props.operatorHint ? (
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {props.operatorHint}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {props.assignments.map((a) => (
          <form
            key={a.operatorId}
            action={removeAssignmentFormAction}
            className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs"
          >
            <input type="hidden" name="postId" value={props.postId} />
            <input type="hidden" name="operatorId" value={a.operatorId} />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">@{a.operator.username}</span>
            {canEdit && (
              <button
                type="submit"
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="담당자 해제"
              >
                ×
              </button>
            )}
          </form>
        ))}
        {props.assignments.length === 0 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">아직 담당자가 지정되지 않았습니다.</span>
        )}
      </div>

      {canEdit && props.assignments.length < 3 && props.operators.length > 0 && (
        <form
          action={addAssignmentFormAction}
          onSubmit={(e) => {
            const fd = new FormData(e.currentTarget);
            const oid = fd.get("operatorId");
            if (!oid || typeof oid !== "string" || oid.trim() === "") {
              e.preventDefault();
            }
          }}
          className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700"
        >
          <input type="hidden" name="postId" value={props.postId} />
          <OperatorSearchPicker
            operators={props.operators}
            name="operatorId"
            label="오퍼레이터 검색"
            searchPlaceholder="username 또는 이름으로 검색…"
          />
          <button
            type="submit"
            className="self-start rounded-xl bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            담당 지정
          </button>
        </form>
      )}

      {canEdit && props.assignments.length < 3 && props.operators.length === 0 && (
        <p className="pt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-700">
          이 기자재에 지정할 수 있는 오퍼레이터가 없습니다. 관리자에게 기자재–오퍼레이터 담당을 등록해 달라고 요청해 주세요.
        </p>
      )}
    </section>
  );
}
