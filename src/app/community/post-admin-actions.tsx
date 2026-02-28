"use client";

import { deletePostFormAction, updatePostStatusFormAction } from "@/app/actions/posts";

export function PostAdminQuickActions({
  postId,
  currentStatus,
}: {
  postId: string;
  currentStatus: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* 상태 변경 */}
      <form action={updatePostStatusFormAction}>
        <input type="hidden" name="postId" value={postId} />
        <input
          type="hidden"
          name="status"
          value={currentStatus === "OPEN" ? "RESOLVED" : "OPEN"}
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-60"
          title={currentStatus === "OPEN" ? "RESOLVED로 변경" : "OPEN으로 변경"}
        >
          {currentStatus === "OPEN" ? "✓ 완료" : "↩ 열기"}
        </button>
      </form>

      {/* 삭제 */}
      <form
        action={deletePostFormAction}
        onSubmit={(e) => {
          if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="postId" value={postId} />
        <button
          type="submit"
          className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60"
          title="게시글 삭제"
        >
          삭제
        </button>
      </form>
    </div>
  );
}
