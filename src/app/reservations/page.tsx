import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { cancelReservationFormAction } from "@/app/actions/reservations";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

type ReservationItem = {
  id: string;
  status: string;
  startAt: Date;
  endAt: Date;
  note: string | null;
  equipment: { name: string; slug: string };
};

export default async function ReservationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const now = new Date();
  const reservations: ReservationItem[] = await prisma.reservation.findMany({
    where: { userId: me.id, cancelledAt: null, endAt: { gte: now } },
    orderBy: { startAt: "asc" },
    take: 200,
    select: {
      id: true,
      status: true,
      startAt: true,
      endAt: true,
      note: true,
      equipment: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">내 예약</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">내가 예약한 시간대를 확인하고 취소할 수 있습니다.</p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        {reservations.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            아직 예약이 없습니다. 기자재 페이지에서 예약을 진행해 주세요.
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(r.startAt)} ~ {formatDateTime(r.endAt)}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Link className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline" href={`/equipments/${r.equipment.slug}`}>
                        {r.equipment.name}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "APPROVED" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200" : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"}`}>
                        {r.status === "APPROVED" ? "승인" : "대기"}
                      </span>
                    </div>
                    {r.note ? (
                      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                        {r.note}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/equipments/${r.equipment.slug}`}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      이동
                    </Link>
                    <form action={cancelReservationFormAction}>
                      <input type="hidden" name="reservationId" value={r.id} />
                      <button className="rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        취소
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimateOnScroll>
    </div>
  );
}

