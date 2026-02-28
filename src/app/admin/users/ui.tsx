"use client";

import {
  promoteOperatorFormAction,
  revokeOperatorFormAction,
  promoteToAdminFormAction,
  updateUserStatusFormAction,
  deleteUserFormAction,
} from "@/app/actions/admin";
import { formatDate } from "@/lib/date";

type UserListItem = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
};

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
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">역할</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">상태</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">가입일</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
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
      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{user.email}</td>
      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">@{user.username}</td>
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
