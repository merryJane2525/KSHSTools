"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  clearAction: () => Promise<void>;
};

export function ClearNotificationsButton({ clearAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    if (!confirm("알림 기록을 모두 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      await clearAction();
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-xl border border-zinc-200 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
    >
      {isPending ? "삭제 중..." : "알림 기록 지우기"}
    </button>
  );
}
