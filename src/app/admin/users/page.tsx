import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserManagementTable } from "./ui";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import type { Prisma } from "@prisma/client";

type UserListItem = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") {
    redirect("/");
  }

  const q = (searchParams.q ?? "").trim();

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  const users: UserListItem[] = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">사용자 관리</h1>
          <p className="mt-1 text-sm text-zinc-600">
            오퍼레이터 승격/해제, 사용자 상태(정지/해제), 삭제를 관리합니다.
          </p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <form
          method="get"
          className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="이메일 또는 username으로 검색..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          />
        </form>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <UserManagementTable users={users} currentUserId={me.id} />
      </AnimateOnScroll>
    </div>
  );
}
