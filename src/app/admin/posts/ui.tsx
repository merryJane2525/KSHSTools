"use client";

import Link from "next/link";
import { deletePostFormAction, updatePostStatusFormAction } from "@/app/actions/posts";
import { formatDate } from "@/lib/date";

type AdminPostItem = {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: Date;
  deletedAt: Date | null;
  equipment: { id: string; name: string; slug: string };
  author: { id: string; username: string; email: string };
  _count: { comments: number };
};

export function PostAdminTable({ posts }: { posts: AdminPostItem[] }) {
  // router는 PostAdminRow에서 사용됨
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              제목
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              작성자
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              기자재
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              상태
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              댓글
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              작성일
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {posts.map((post) => (
            <PostAdminRow key={post.id} post={post} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostAdminRow({ post }: { post: AdminPostItem }) {
  return (
    <tr className={post.deletedAt ? "bg-red-50 dark:bg-red-950/50 opacity-60" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}>
      <td className="px-4 py-3">
        <Link
          href={`/posts/${post.id}`}
          className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline"
        >
          <div className="max-w-md truncate">{post.title}</div>
          {post.deletedAt && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">삭제됨</div>
          )}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="text-zinc-900 dark:text-zinc-100">{post.author.username}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{post.author.email}</div>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/equipments/${post.equipment.slug}`}
          className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
        >
          {post.equipment.name}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            post.status === "OPEN"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
          }`}
        >
          {post.status}
        </span>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{post._count.comments}</td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {formatDate(post.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!post.deletedAt && (
            <>
              {/* 상태 변경 */}
              <form action={updatePostStatusFormAction}>
                <input type="hidden" name="postId" value={post.id} />
                <input
                  type="hidden"
                  name="status"
                  value={post.status === "OPEN" ? "RESOLVED" : "OPEN"}
                />
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-60"
                  title={post.status === "OPEN" ? "RESOLVED로 변경" : "OPEN으로 변경"}
                >
                  {post.status === "OPEN" ? "✓ 완료" : "↩ 열기"}
                </button>
              </form>

              {/* 삭제 */}
              <form
                action={deletePostFormAction}
                onSubmit={(e) => {
                  if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60"
                  title="게시글 삭제"
                >
                  삭제
                </button>
              </form>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
