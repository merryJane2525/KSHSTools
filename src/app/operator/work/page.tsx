import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/date";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function OperatorWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }> | { from?: string; to?: string; status?: string };
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "OPERATOR" && me.role !== "ADMIN") redirect("/");

  const now = new Date();
  const resolved = await Promise.resolve(searchParams);

  const week = getWeekRange(now);
  const month = getMonthRange(now);

  const [weekMinutes, monthMinutes, totalMinutes, workLogs] = await Promise.all([
    prisma.operatorWorkLog.aggregate({
      where: {
        operatorId: me.id,
        status: { in: ["SCHEDULED", "COMPLETED"] },
        startAt: { gte: week.start },
        endAt: { lte: week.end },
      },
      _sum: { workedMinutes: true },
    }),
    prisma.operatorWorkLog.aggregate({
      where: {
        operatorId: me.id,
        status: { in: ["SCHEDULED", "COMPLETED"] },
        startAt: { gte: month.start },
        endAt: { lte: month.end },
      },
      _sum: { workedMinutes: true },
    }),
    prisma.operatorWorkLog.aggregate({
      where: {
        operatorId: me.id,
        status: { in: ["SCHEDULED", "COMPLETED"] },
      },
      _sum: { workedMinutes: true },
    }),
    prisma.operatorWorkLog.findMany({
      where: { operatorId: me.id },
      orderBy: { startAt: "desc" },
      take: 80,
      select: {
        id: true,
        startAt: true,
        endAt: true,
        workedMinutes: true,
        status: true,
        equipment: { select: { name: true, slug: true } },
        user: { select: { username: true } },
        reservationId: true,
      },
    }),
  ]);

  const weekTotal = weekMinutes._sum.workedMinutes ?? 0;
  const monthTotal = monthMinutes._sum.workedMinutes ?? 0;
  const allTotal = totalMinutes._sum.workedMinutes ?? 0;

  const statusLabel: Record<string, string> = {
    SCHEDULED: "예정",
    COMPLETED: "완료",
    CANCELED: "취소",
    ADJUSTED: "조정",
  };

  const weekLogs = workLogs.filter(
    (w) =>
      w.startAt >= week.start &&
      w.endAt <= week.end &&
      (w.status === "SCHEDULED" || w.status === "COMPLETED")
  );

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/operator" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">
              ← 오퍼레이터
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              근무 기록
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              총 근무 시간과 타임테이블을 확인합니다.
            </p>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">총 근무 시간</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">이번 주</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {Math.floor(weekTotal / 60)}시간 {weekTotal % 60}분
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">이번 달</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {Math.floor(monthTotal / 60)}시간 {monthTotal % 60}분
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">전체 누적</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {Math.floor(allTotal / 60)}시간 {allTotal % 60}분
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            이번 주 타임테이블 ({formatDate(week.start)} ~ {formatDate(week.end)})
          </h2>
          {weekLogs.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">이번 주 예정된 근무가 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {weekLogs.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 dark:border-zinc-700 px-4 py-3 text-sm"
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{w.equipment.name}</div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(w.startAt)} ~ {formatDateTime(w.endAt)}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400">@{w.user.username}</div>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {statusLabel[w.status] ?? w.status}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{w.workedMinutes}분</span>
                  <Link
                    href={`/reservations/${w.equipment.slug}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    예약 보기
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">근무 기록 리스트</h2>
          {workLogs.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">근무 기록이 없습니다.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left text-zinc-500 dark:text-zinc-400">
                    <th className="pb-2 pr-4 font-medium">날짜</th>
                    <th className="pb-2 pr-4 font-medium">시작 ~ 종료</th>
                    <th className="pb-2 pr-4 font-medium">장비</th>
                    <th className="pb-2 pr-4 font-medium">예약자</th>
                    <th className="pb-2 pr-4 font-medium">상태</th>
                    <th className="pb-2 font-medium">근무시간</th>
                  </tr>
                </thead>
                <tbody>
                  {workLogs.map((w) => (
                    <tr key={w.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-100">{formatDate(w.startAt)}</td>
                      <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                        {formatDateTime(w.startAt)} ~ {formatDateTime(w.endAt)}
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/reservations/${w.equipment.slug}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {w.equipment.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">@{w.user.username}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {statusLabel[w.status] ?? w.status}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-700 dark:text-zinc-300">{w.workedMinutes}분</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AnimateOnScroll>
    </div>
  );
}
