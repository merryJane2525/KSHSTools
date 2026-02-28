import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PostAdminTable } from "./ui";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import type { Prisma } from "@prisma/client";

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

type AdminPostsSearchParams = {
  q?: string;
  equipmentId?: string;
  status?: string;
  includeDeleted?: string;
};

type EquipmentListItem = {
  id: string;
  name: string;
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: AdminPostsSearchParams;
}) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") {
    redirect("/");
  }

  const q = (searchParams.q ?? "").trim();
  const equipmentId = searchParams.equipmentId ?? "";
  const status = searchParams.status ?? "";
  const includeDeleted = searchParams.includeDeleted === "true";

  const where: Prisma.PostWhereInput = {};

  if (!includeDeleted) {
    where.deletedAt = null;
  }

  if (equipmentId) {
    where.equipmentId = equipmentId;
  }

  if (status === "OPEN" || status === "RESOLVED") {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { author: { username: { contains: q, mode: "insensitive" } } },
      { author: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [posts, equipments] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        equipment: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, username: true, email: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const postsTyped = posts as AdminPostItem[];
  const equipmentsTyped = equipments as EquipmentListItem[];

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">게시글 관리</h1>
          <p className="mt-1 text-sm text-zinc-600">
            모든 게시글을 조회하고 관리할 수 있습니다.
          </p>
        </div>
      </AnimateOnScroll>

      {/* 검색 및 필터 */}
      <AnimateOnScroll>
        <form
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm"
          method="get"
        >
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="제목, 본문, 작성자 검색..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 pl-9 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          />
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            🔍
          </span>
        </div>

        <select
          name="equipmentId"
          defaultValue={equipmentId}
          className="min-w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
        >
          <option value="">전체 기자재</option>
          {equipmentsTyped.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status}
          className="min-w-[120px] rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
        >
          <option value="">전체 상태</option>
          <option value="OPEN">OPEN</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="includeDeleted"
            value="true"
            defaultChecked={includeDeleted}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          삭제된 게시글 포함
        </label>

        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          필터 적용
        </button>
      </form>
      </AnimateOnScroll>

      {/* 게시글 목록 */}
      <AnimateOnScroll>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <PostAdminTable posts={postsTyped} />
        </div>

        {postsTyped.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400 text-center">
            조건에 맞는 게시글이 없습니다.
          </div>
        )}
      </AnimateOnScroll>
    </div>
  );
}
