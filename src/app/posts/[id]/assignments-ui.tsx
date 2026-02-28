"use client";

import { addAssignmentFormAction, removeAssignmentFormAction } from "@/app/actions/assignments";

type UserRole = "USER" | "OPERATOR" | "ADMIN";
type Operator = {
  id: string;
  username: string;
};

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
  operators: Operator[];
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

      {canEdit && props.assignments.length < 3 && (
        <form action={addAssignmentFormAction} className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
          <input type="hidden" name="postId" value={props.postId} />
          <select
            name="operatorId"
            className="h-8 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-zinc-100 px-2 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            defaultValue=""
            required
          >
            <option value="" disabled>
              오퍼레이터 선택
            </option>
            {props.operators.map((op) => (
              <option key={op.id} value={op.id}>
                @{op.username}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            담당 지정
          </button>
        </form>
      )}
    </section>
  );
}

