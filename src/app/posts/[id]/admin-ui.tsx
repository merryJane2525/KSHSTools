"use client";

import { deletePostFormAction, updatePostStatusFormAction } from "@/app/actions/posts";

export function PostAdminActions({
  postId,
  currentStatus,
}: {
  postId: string;
  currentStatus: string;
}) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-red-900 dark:text-red-200">관리자 기능</div>

      {/* 상태 변경 */}
      <form action={updatePostStatusFormAction} className="mb-3">
        <input type="hidden" name="postId" value={postId} />
        <input
          type="hidden"
          name="status"
          value={currentStatus === "OPEN" ? "RESOLVED" : "OPEN"}
        />
        <button
          type="submit"
          className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 disabled:opacity-60"
        >
          {currentStatus === "OPEN" ? "상태를 RESOLVED로 변경" : "상태를 OPEN으로 변경"}
        </button>
      </form>

      {/* 삭제 */}
      <form
        action={deletePostFormAction}
        onSubmit={(e) => {
          if (!confirm("정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="postId" value={postId} />
        <button
          type="submit"
          className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 dark:bg-red-700 dark:hover:bg-red-800"
        >
          게시글 삭제
        </button>
      </form>
    </div>
  );
}
