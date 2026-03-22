"use client";

import { useActionState } from "react";
import {
  promoteOperatorFormAction,
  revokeOperatorFormAction,
  promoteToAdminFormAction,
  updateUserStatusFormAction,
  deleteUserFormAction,
  importStudentsCsvAction,
  type ImportStudentsCsvResult,
} from "@/app/actions/admin";
import { formatDate } from "@/lib/date";
import { LoadingSpinner } from "@/app/_components/LoadingSpinner";
import { MAX_STUDENT_CSV_ROWS } from "@/lib/student-csv-import";

type UserListItem = {
  id: string;
  email: string | null;
  username: string;
  studentNumber: string | null;
  studentName: string | null;
  role: string;
  status: string;
  createdAt: Date;
};

function importErrorLabel(code: string): string {
  switch (code) {
    case "FORBIDDEN":
      return "권한이 없습니다.";
    case "NO_FILE":
      return "CSV 파일을 선택해 주세요.";
    case "EMPTY_FILE":
      return "파일이 비어 있습니다.";
    case "FILE_TOO_LARGE":
      return "파일이 너무 큽니다 (최대 2MB).";
    case "READ_FAILED":
      return "파일을 읽을 수 없습니다.";
    case "TOO_MANY_ROWS":
      return `한 번에 처리할 수 있는 행 수를 초과했습니다 (최대 ${MAX_STUDENT_CSV_ROWS}명).`;
    default:
      return "처리 중 오류가 발생했습니다.";
  }
}

export function StudentCsvImport() {
  const [state, formAction, pending] = useActionState(importStudentsCsvAction, null as ImportStudentsCsvResult | null);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">학생 CSV 일괄 등록</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          첫 열은 학번, 둘째 열은 이름입니다. 첫 줄에{" "}
          <span className="font-mono text-zinc-700 dark:text-zinc-300">학번,이름</span> 헤더가 있어도 됩니다.
          로그인 ID(username)는 <span className="font-mono">학번+이름</span>(공백 없음, 동일 조합이 이미 있으면{" "}
          <span className="font-mono">_2</span>, <span className="font-mono">_3</span>…), 초기 비밀번호는 항상{" "}
          <span className="font-mono">학번+이름+!</span> 입니다. 이메일은 비어 있으며, 학생이 로그인 후 상단「이메일 등록」에서
          입력합니다.
        </p>
      </div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">CSV 파일</span>
          <input
            name="csv"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={pending}
            className="mt-1 block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending && <LoadingSpinner size={14} aria-label="업로드 중" />}
          {pending ? "처리 중..." : "업로드하여 계정 생성"}
        </button>
      </form>

      {state && !state.ok ? (
        <p className="text-sm text-red-600 dark:text-red-400">{importErrorLabel(state.error)}</p>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 space-y-1">
          <p>
            생성 <span className="font-semibold">{state.created}</span>건, 건너뜀{" "}
            <span className="font-semibold">{state.skipped}</span>건
            {state.parseErrors.length > 0 ? (
              <span className="text-zinc-600 dark:text-zinc-400">
                {" "}
                · 형식 오류 {state.parseErrors.length}건
              </span>
            ) : null}
            .
          </p>
          {state.parseErrors.length > 0 ? (
            <ul className="text-xs text-amber-800 dark:text-amber-200 max-h-24 overflow-y-auto list-disc pl-4 space-y-0.5">
              {state.parseErrors.slice(0, 20).map((e) => (
                <li key={`p-${e.line}`}>
                  {e.line}행: {e.message}
                </li>
              ))}
              {state.parseErrors.length > 20 ? <li>… 외 {state.parseErrors.length - 20}건</li> : null}
            </ul>
          ) : null}
          {state.skippedDetails.length > 0 ? (
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 max-h-24 overflow-y-auto list-disc pl-4 space-y-0.5">
              {state.skippedDetails.slice(0, 15).map((e, idx) => (
                <li key={`skip-${e.line}-${idx}`}>
                  {e.line}행: {e.reason}
                </li>
              ))}
              {state.skippedDetails.length > 15 ? <li>… 외 {state.skippedDetails.length - 15}건</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function UserManagementTable({
  users,
  currentUserId,
}: {
  users: UserListItem[];
  currentUserId: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">이메일</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">학번</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">이름</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">역할</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">상태</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">가입일</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow key={user.id} user={user} currentUserId={currentUserId} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user, currentUserId }: { user: UserListItem; currentUserId: string }) {
  const isOperator = user.role === "OPERATOR";
  const isAdmin = user.role === "ADMIN";
  const isActive = user.status === "ACTIVE";
  const isSelf = user.id === currentUserId;
  const canManage = !isSelf && !isAdmin; // 자기 자신과 다른 ADMIN은 삭제 불가
  // 다른 ADMIN 상태 변경 불가. 본인은 정지 불가이므로 해제만 표시(본인·정지 시에만 폼 표시)
  const showStatusChange = (!isAdmin || isSelf) && (isSelf ? !isActive : true);

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{user.email ?? "—"}</td>
      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">@{user.username}</td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
        {user.studentNumber ?? "—"}
      </td>
      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{user.studentName ?? "—"}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            isAdmin
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
              : isOperator
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            isActive ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
          }`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 상태 변경: 정지 / 해제 (다른 ADMIN 불가, 본인은 해제만) */}
          {showStatusChange && (
            <form action={updateUserStatusFormAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="status"
                value={isActive ? "SUSPENDED" : "ACTIVE"}
              />
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-60"
              >
                {isActive ? "정지" : "해제"}
              </button>
            </form>
          )}

          {/* 관리자 승격 (ADMIN만, 대상은 USER/OPERATOR, 본인 제외) */}
          {!isAdmin && !isSelf && (
            <form action={promoteToAdminFormAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                disabled={!isActive}
                className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 disabled:opacity-60"
              >
                관리자 승격
              </button>
            </form>
          )}

          {/* 오퍼레이터 승격/해제 */}
          {isAdmin ? (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">관리자</span>
          ) : isOperator ? (
            <form action={revokeOperatorFormAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-60"
              >
                오퍼레이터 해제
              </button>
            </form>
          ) : (
            <form action={promoteOperatorFormAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                disabled={!isActive}
                className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-60"
              >
                오퍼레이터 승격
              </button>
            </form>
          )}

          {/* 삭제 (소프트 삭제 = 정지) */}
          {canManage && (
            <form
              action={deleteUserFormAction}
              onSubmit={(e) => {
                if (!confirm("해당 사용자를 삭제(정지)하시겠습니까? 로그인이 불가능해집니다.")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                disabled={!isActive}
                className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-60"
              >
                삭제
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
