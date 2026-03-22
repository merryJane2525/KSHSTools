import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountEmailPanel } from "./ui";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/account");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">계정</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">@{user.username}</p>
      </div>
      <Suspense
        fallback={
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">로딩 중...</p>
          </div>
        }
      >
        <AccountEmailPanel hasEmail={user.email != null && user.email !== ""} />
      </Suspense>
    </div>
  );
}
