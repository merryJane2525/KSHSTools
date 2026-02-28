import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { approveReservationFormAction, rejectReservationFormAction } from "@/app/actions/reservations";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

type PendingItem = {
  id: string;
  startAt: Date;
  endAt: Date;
  note: string | null;
  createdAt: Date;
  equipment: { id: string; name: string; slug: string };
  user: { username: string };
};

type ApprovedItem = {
  id: string;
  startAt: Date;
  endAt: Date;
  note: string | null;
  equipment: { name: string; slug: string };
  user: { username: string };
};

export default async function OperatorReservationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "OPERATOR" && me.role !== "ADMIN") redirect("/");

  const now = new Date();

  const pending: PendingItem[] = await prisma.reservation.findMany({
    where: { status: "PENDING", cancelledAt: null, endAt: { gte: now } },
    orderBy: { startAt: "asc" },
    take: 100,
    select: {
      id: true,
      startAt: true,
      endAt: true,
      note: true,
      createdAt: true,
      equipment: { select: { id: true, name: true, slug: true } },
      user: { select: { username: true } },
    },
  });

  const approved: ApprovedItem[] = await prisma.reservation.findMany({
    where: { status: "APPROVED", cancelledAt: null, endAt: { gte: now } },
    orderBy: { startAt: "asc" },
    take: 50,
    select: {
      id: true,
      startAt: true,
      endAt: true,
      note: true,
      equipment: { select: { name: true, slug: true } },
      user: { select: { username: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/operator"
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
            >
              ← 오퍼레이터
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              예약 관리
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              대기 중인 예약을 승인하거나 거절하고, 확정된 예약을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">승인 대기 ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">대기 중인 예약이 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pending.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-100 dark:border-zinc-700 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {r.equipment.name} · @{r.user.username}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(r.startAt)} ~ {formatDateTime(r.endAt)}
                    </div>
                    {r.note ? (
                      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{r.note}</div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={approveReservationFormAction}>
                      <input type="hidden" name="reservationId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        승인
                      </button>
                    </form>
                    <form action={rejectReservationFormAction}>
                      <input type="hidden" name="reservationId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        거절
                      </button>
                    </form>
                    <Link
                      href={`/equipments/${r.equipment.slug}`}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      기자재 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">확정된 예약 (최근)</h2>
          {approved.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">확정된 예약이 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {approved.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 dark:border-zinc-700 px-4 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.equipment.name}</span>
                    <span className="text-zinc-500 dark:text-zinc-400"> · @{r.user.username}</span>
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(r.startAt)} ~ {formatDateTime(r.endAt)}
                    </span>
                  </div>
                  <Link
                    href={`/equipments/${r.equipment.slug}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    보기
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AnimateOnScroll>
    </div>
  );
}
