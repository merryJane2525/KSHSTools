import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountEmailPanel, AccountPasswordPanel } from "./ui";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/account");
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { studentName: true, studentNumber: true },
  });

  const panelFallback = (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">로딩 중...</p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">마이페이지</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">@{user.username}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">내 정보</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">사용자 이름</dt>
            <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">@{user.username}</dd>
          </div>
          {user.email ? (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">이메일</dt>
              <dd className="break-all text-right text-zinc-800 dark:text-zinc-200">{user.email}</dd>
            </div>
          ) : (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">이메일</dt>
              <dd className="text-right text-zinc-500 dark:text-zinc-400">미등록 · 아래에서 등록할 수 있습니다</dd>
            </div>
          )}
          {profile?.studentName ? (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">이름</dt>
              <dd className="text-right text-zinc-800 dark:text-zinc-200">{profile.studentName}</dd>
            </div>
          ) : null}
          {profile?.studentNumber ? (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">학번</dt>
              <dd className="text-right text-zinc-800 dark:text-zinc-200">{profile.studentNumber}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          이름·학번은 관리자가 등록한 값입니다. 변경이 필요하면 관리자에게 문의해 주세요.
        </p>
      </div>

      <Suspense fallback={panelFallback}>
        <AccountEmailPanel hasEmail={user.email != null && user.email !== ""} />
      </Suspense>

      <Suspense fallback={panelFallback}>
        <AccountPasswordPanel />
      </Suspense>
    </div>
  );
}
