"use client";

import Link from "next/link";

// 00:00~24:00, 30분 단위 => 48슬롯 (전체 날짜 예약 표시)
const SLOTS_PER_DAY = 48;
const START_HOUR = 0;
const SLOT_MINUTES = 30;
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type ReservationForCalendar = {
  id: string;
  status: "PENDING" | "APPROVED";
  startAtIso: string;
  endAtIso: string;
  username: string;
};

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00+09:00");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00+09:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function WeekCalendarView({
  equipmentSlug,
  weekStart,
  reservations,
}: {
  equipmentSlug: string;
  weekStart: string;
  reservations: ReservationForCalendar[];
}) {
  // KST 기준 주 시작(월 00:00) 시각
  const weekStartDate = new Date(weekStart + "T00:00:00+09:00");
  const weekStartMs = weekStartDate.getTime();

  // 해당 요일·슬롯의 시작 시각(ms, UTC)
  const slotToMs = (dayIndex: number, slotIndex: number): number =>
    weekStartMs +
    dayIndex * 24 * 60 * 60 * 1000 +
    (START_HOUR * 60 * 60 * 1000 + slotIndex * SLOT_MINUTES * 60 * 1000);

  const getSlotContent = (dayIndex: number, slotIndex: number): { username: string; status: string } | null => {
    const slotStart = slotToMs(dayIndex, slotIndex);
    const slotEnd = slotStart + SLOT_MINUTES * 60 * 1000;
    for (const r of reservations) {
      const rStart = new Date(r.startAtIso).getTime();
      const rEnd = new Date(r.endAtIso).getTime();
      // 예약 구간과 슬롯 구간이 겹치는지
      if (rStart < slotEnd && rEnd > slotStart) return { username: r.username, status: r.status };
    }
    return null;
  };

  const timeLabels: string[] = [];
  const slotsPerHour = 60 / SLOT_MINUTES;
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const h = START_HOUR + Math.floor(i / slotsPerHour);
    const m = (i % slotsPerHour) * SLOT_MINUTES;
    timeLabels.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm overflow-x-auto">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">주간 예약 현황</h3>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href={`/equipments/${equipmentSlug}?week=${prevWeek}`}
            className="rounded-lg border border-zinc-200 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            ← 이전 주
          </Link>
          <span className="min-w-[140px] text-center">{formatWeekLabel(weekStart)}</span>
          <Link
            href={`/equipments/${equipmentSlug}?week=${nextWeek}`}
            className="rounded-lg border border-zinc-200 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            다음 주 →
          </Link>
        </div>
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
        · 30분 단위 (00:00~24:00) · 파란색=승인, 노란색=대기
      </div>
      <div className="max-h-[520px] overflow-y-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-zinc-200 dark:border-zinc-600 p-1 w-12 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-normal">
              시간
            </th>
            {DAY_LABELS.map((label) => (
              <th
                key={label}
                className="border border-zinc-200 dark:border-zinc-600 p-1 min-w-[72px] bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-normal"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeLabels.map((time, slotIndex) => (
            <tr key={time}>
              <td className="border border-zinc-200 dark:border-zinc-600 p-1 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {time}
              </td>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const content = getSlotContent(dayIndex, slotIndex);
                return (
                  <td
                    key={dayIndex}
                    className="min-h-[22px] min-w-[52px] border border-zinc-200 dark:border-zinc-600 p-0.5 align-top"
                  >
                    {content ? (
                      <span
                        className={`inline-block min-h-[18px] w-full rounded px-1 py-0.5 truncate text-[10px] ${
                          content.status === "APPROVED"
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                        }`}
                        title={`@${content.username} ${content.status === "PENDING" ? "(대기)" : "(승인)"}`}
                      >
                        @{content.username}
                      </span>
                    ) : (
                      <span className="inline-block min-h-[18px] w-full" aria-hidden />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
