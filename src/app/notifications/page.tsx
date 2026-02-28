import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { markNotificationReadAction } from "@/app/actions/notifications";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { PushEnable } from "./PushEnable";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: Date;
  actor: { username: string } | null;
};

export default async function NotificationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const notifications: NotificationItem[] = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      linkUrl: true,
      isRead: true,
      createdAt: true,
      actor: { select: { username: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">알림</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">멘션/댓글 등의 이벤트가 알림으로 쌓입니다.</p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <PushEnable />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            아직 알림이 없습니다.
          </div>
        ) : null}

        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border bg-white dark:bg-zinc-900 p-4 shadow-sm ${
              n.isRead ? "border-zinc-200 dark:border-zinc-700" : "border-zinc-900 dark:border-zinc-500"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">{n.type}</span>
                  {n.actor?.username ? <span>@{n.actor.username}</span> : null}
                  <span>·</span>
                  <span>{formatDateTime(n.createdAt)}</span>
                </div>
                <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{n.title}</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{n.body}</div>
                <div className="mt-3">
                  <Link className="text-sm font-medium text-zinc-900 dark:text-zinc-100 underline" href={n.linkUrl}>
                    열기
                  </Link>
                </div>
              </div>

              {!n.isRead ? (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                    읽음
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
        </div>
      </AnimateOnScroll>
    </div>
  );
}

