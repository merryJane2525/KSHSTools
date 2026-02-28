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
  title: string | null;
  equipment: { name: string; slug: string };
};

export default async function MyReservationsPage() {
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
      title: true,
      equipment: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/reservations" className="text-sm text-primary/60 hover:text-primary hover:underline">
              ← 기자재 예약 목록
            </Link>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-primary">내 예약</h1>
            <p className="mt-1 text-sm text-primary/70">내가 예약한 시간대를 확인하고 취소할 수 있습니다.</p>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        {reservations.length === 0 ? (
          <div className="rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-6 text-sm text-primary/70 dark:border-primary/20">
            아직 예약이 없습니다. 기자재를 선택한 뒤 예약을 진행해 주세요.
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-4 shadow-sm hover:border-primary/20 dark:border-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-primary/50">
                      {formatDateTime(r.startAt)} ~ {formatDateTime(r.endAt)}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Link
                        className="font-bold text-primary hover:underline"
                        href={`/reservations/${r.equipment.slug}`}
                      >
                        {r.equipment.name}
                      </Link>
                      {r.title ? (
                        <span className="text-sm text-primary/70">· {r.title}</span>
                      ) : null}
                      <span
                        className={
                          r.status === "APPROVED"
                            ? "rounded-md border border-primary/10 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary/70"
                            : "rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                        }
                      >
                        {r.status === "APPROVED" ? "승인" : "대기"}
                      </span>
                    </div>
                    {r.note ? (
                      <div className="mt-2 text-sm text-primary/70 whitespace-pre-wrap break-words">{r.note}</div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/reservations/${r.equipment.slug}`}
                      className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
                    >
                      이동
                    </Link>
                    <form action={cancelReservationFormAction}>
                      <input type="hidden" name="reservationId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:border-primary/20 dark:hover:bg-primary/20"
                      >
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
