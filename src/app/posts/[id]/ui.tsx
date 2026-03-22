"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createCommentFormAction } from "@/app/actions/posts";

function CommentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "등록 중..." : "댓글 등록"}
    </button>
  );
}

export function CommentForm({ postId, canComment }: { postId: string; canComment: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("comment_error");

  if (!canComment) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          댓글을 작성하려면{" "}
          <Link
            href={`/login?returnUrl=${encodeURIComponent(pathname)}`}
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            로그인
          </Link>
          이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      {error ? (
        <div className="mb-2 text-xs text-red-700 dark:text-red-400">
          {error === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
          {error === "TOO_MANY_MENTIONS" && "멘션은 최대 5명까지 가능합니다."}
          {error === "NOT_FOUND" && "게시글을 찾을 수 없습니다."}
        </div>
      ) : null}

      <form action={createCommentFormAction} className="space-y-2">
        <input type="hidden" name="postId" value={postId} />
        <textarea
          name="body"
          rows={4}
          placeholder="댓글을 입력하세요. @username 멘션 가능 (최대 5명)"
          className="w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          required
        />
        <div className="flex items-center justify-end">
          <CommentSubmitButton />
        </div>
      </form>
    </div>
  );
}

