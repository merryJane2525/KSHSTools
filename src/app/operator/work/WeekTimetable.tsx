"use client";

import Link from "next/link";

const HOUR_START = 6;
const HOUR_END = 22;
const HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 28;
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type WeekLogItem = {
  id: string;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  equipment: { name: string; slug: string };
  user: { username: string };
  status: string;
  workedMinutes: number;
};

type WeekTimetableProps = {
  weekStart: string;
  weekLogs: WeekLogItem[];
  statusLabel: Record<string, string>;
};

export function WeekTimetable({ weekStart, weekLogs, statusLabel }: WeekTimetableProps) {
  const weekStartDate = new Date(weekStart + "T00:00:00+09:00");
  const minutesStart = HOUR_START * 60;
  const minutesEnd = HOUR_END * 60;
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const columnHeight = HOURS * PX_PER_HOUR;

  const blocks: Array<{
    dayIndex: number;
    topPx: number;
    heightPx: number;
    log: WeekLogItem;
  }> = [];

  for (const log of weekLogs) {
    const { dayIndex, startMinutes, endMinutes } = log;
    if (dayIndex < 0 || dayIndex > 6) continue;

    const clampedStart = Math.max(minutesStart, Math.min(minutesEnd, startMinutes));
    const clampedEnd = Math.max(minutesStart, Math.min(minutesEnd, endMinutes));
    if (clampedStart >= clampedEnd) continue;

    const topPx = ((clampedStart - minutesStart) / totalMinutes) * columnHeight;
    const heightPx = ((clampedEnd - clampedStart) / totalMinutes) * columnHeight;

    blocks.push({ dayIndex, topPx, heightPx, log });
  }

  const timeLabels: number[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    timeLabels.push(h);
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="grid grid-cols-8 gap-0 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
          <div className="col-span-1 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800 font-medium text-zinc-600 dark:text-zinc-400 text-xs py-2 flex flex-col">
            <div className="pl-2 h-8 shrink-0 flex items-center border-b border-zinc-200 dark:border-zinc-700">
              시간
            </div>
            {timeLabels.map((h) => (
              <div
                key={h}
                className="pl-2 border-b border-zinc-100 dark:border-zinc-700/80 flex items-start pt-0.5"
                style={{ height: PX_PER_HOUR }}
              >
                {h.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="col-span-7 grid grid-cols-7 gap-0">
            {DAY_LABELS.map((label, dayIndex) => {
              const dayDate = new Date(weekStartDate);
              dayDate.setDate(weekStartDate.getDate() + dayIndex);
              const dayBlocks = blocks.filter((b) => b.dayIndex === dayIndex);
              return (
                <div
                  key={dayIndex}
                  className="border-r last:border-r-0 border-zinc-200 dark:border-zinc-700 flex flex-col bg-white dark:bg-zinc-900"
                >
                  <div
                    className="h-8 shrink-0 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800"
                    style={{ minHeight: 32 }}
                  >
                    {label}
                    <span className="ml-1 text-zinc-500 dark:text-zinc-500 font-normal">
                      {dayDate.getMonth() + 1}/{dayDate.getDate()}
                    </span>
                  </div>
                  <div
                    className="relative flex-1 min-h-0"
                    style={{ height: columnHeight }}
                  >
                    {dayBlocks.map(({ topPx, heightPx, log }) => (
                      <Link
                        key={log.id}
                        href={`/reservations/${log.equipment.slug}`}
                        className="absolute left-0.5 right-0.5 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center px-1.5 py-0.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900/80"
                        style={{
                          top: topPx,
                          height: Math.max(heightPx - 2, 24),
                          minHeight: 20,
                        }}
                        title={`${log.equipment.name} · @${log.user.username} · ${log.workedMinutes}분`}
                      >
                        <span className="text-[10px] font-semibold text-blue-900 dark:text-blue-100 truncate leading-tight">
                          {log.equipment.name}
                        </span>
                        <span className="text-[9px] text-blue-700 dark:text-blue-300 truncate leading-tight">
                          @{log.user.username}
                        </span>
                        {heightPx >= 36 && (
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 mt-0.5">
                            {statusLabel[log.status] ?? log.status} · {log.workedMinutes}분
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        블록을 클릭하면 해당 장비 예약 페이지로 이동합니다. 표시 구간: {HOUR_START}:00 ~ {HOUR_END}:00
      </p>
    </div>
  );
}
