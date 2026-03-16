"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

type ReservationForCalendar = {
  id: string;
  status: "PENDING" | "APPROVED";
  startAtIso: string;
  endAtIso: string;
  username: string;
  title: string | null;
  unitLabel?: string | null;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatKstDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getMonthYearKst(date: Date): { year: number; month: number } {
  const s = date.toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 7);
  const [y, m] = s.split("-").map(Number);
  return { year: y, month: m };
}

function getDaysInMonthKst(year: number, month: number): Date[] {
  const first = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`);
  const last = new Date(year, month, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00+09:00`));
  }
  return days;
}

function toYMD(d: Date): string {
  return d.toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

export function EquipmentReservationDetail({
  equipmentSlug,
  equipmentName,
  equipmentDescription,
  reservations,
  imagePath,
}: {
  equipmentSlug: string;
  equipmentName: string;
  equipmentDescription: string | null;
  reservations: ReservationForCalendar[];
  imagePath: string | null;
}) {
  const todayKst = useMemo(() => toYMD(new Date()), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const { year, month } = getMonthYearKst(viewDate);
  const daysInMonth = useMemo(() => getDaysInMonthKst(year, month), [year, month]);

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstDayOfMonth.getDay();

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationForCalendar[]>();
    for (const r of reservations) {
      const start = new Date(r.startAtIso);
      const end = new Date(r.endAtIso);
      const startYmd = toYMD(start);
      const endYmd = toYMD(end);
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      while (cur.getTime() <= endDay.getTime()) {
        const ymd = toYMD(cur);
        if (!map.has(ymd)) map.set(ymd, []);
        map.get(ymd)!.push(r);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [reservations]);

  const prevMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);
  const nextMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const selectedReservations = useMemo(() => {
    if (!selectedDate) return [];
    return reservations.filter((r) => {
      const startYmd = toYMD(new Date(r.startAtIso));
      const endYmd = toYMD(new Date(r.endAtIso));
      return selectedDate >= startYmd && selectedDate <= endYmd;
    });
  }, [reservations, selectedDate]);

  const monthLabel = `${year}년 ${month}월`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* 왼쪽: 기자재 사진 + 설명 + 버튼 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] overflow-hidden dark:border-primary/20">
          {(imagePath && !imageError) ? (
            <div className="relative aspect-video w-full bg-primary/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={equipmentName}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-primary/5 text-primary/40">
              <span className="text-4xl">🔬</span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">{equipmentName}</h1>
          {equipmentDescription ? (
            <p className="mt-1 text-sm leading-relaxed text-primary/70">{equipmentDescription}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/reservations/${equipmentSlug}/new?date=${selectedDate ?? todayKst}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            예약 신청하기
          </Link>
          <Link
            href="/reservations/my"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
          >
            내 예약 목록
          </Link>
        </div>
      </div>

      {/* 오른쪽: 달력 + 선택 날짜 예약 목록 */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm dark:bg-[#15191d] dark:border-primary/20">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-primary">예약 현황</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg border border-primary/20 p-2 text-primary/70 hover:bg-primary/5 dark:border-primary/20 dark:hover:bg-primary/20"
                aria-label="이전 달"
              >
                ←
              </button>
              <span className="min-w-[120px] text-center text-sm font-bold text-primary">{monthLabel}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg border border-primary/20 p-2 text-primary/70 hover:bg-primary/5 dark:border-primary/20 dark:hover:bg-primary/20"
                aria-label="다음 달"
              >
                →
              </button>
            </div>
          </div>
          <p className="text-xs text-primary/50 mb-2">
            날짜를 고르면, 예약 현황을 확인할 수 있습니다. 해당 날짜에 예약이 있으면 ●로 표시됩니다.
          </p>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
            {DAY_LABELS.map((label) => (
              <div key={label} className="py-1 font-bold text-primary/60">
                {label}
              </div>
            ))}
            {Array.from({ length: startWeekday }, (_, i) => (
              <div key={`pad-${i}`} className="min-h-[36px]" />
            ))}
            {daysInMonth.map((d) => {
              const ymd = toYMD(d);
              const dayReservations = reservationsByDate.get(ymd) ?? [];
              const hasPending = dayReservations.some((r) => r.status === "PENDING");
              const hasApproved = dayReservations.some((r) => r.status === "APPROVED");
              const isSelected = selectedDate === ymd;
              const isToday = ymd === todayKst;
              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => setSelectedDate(ymd)}
                  className={`min-h-[36px] rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-primary text-white"
                      : isToday
                        ? "bg-primary/20 font-bold text-primary"
                        : "text-primary/80 hover:bg-primary/10"
                  }`}
                >
                  <span>{d.getDate()}</span>
                  {(hasPending || hasApproved) && (
                    <span className="mt-0.5 block text-[10px]">
                      {hasPending && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />}
                      {hasApproved && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm dark:bg-[#15191d] dark:border-primary/20">
          <h3 className="text-sm font-bold text-primary">
            {selectedDate ? `${selectedDate} 예약 목록` : "날짜를 선택하면 해당 날의 예약 목록이 표시됩니다."}
          </h3>
          {selectedDate && (
            <div className="mt-3 overflow-x-auto">
              {selectedReservations.length === 0 ? (
                <p className="text-sm text-primary/60">해당 날짜에 예약이 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary/10">
                      <th className="py-2 text-left font-bold text-primary/70">사용자</th>
                      <th className="py-2 text-left font-bold text-primary/70">예약 제목</th>
                      <th className="py-2 text-left font-bold text-primary/70">예약 기간</th>
                      <th className="py-2 text-left font-bold text-primary/70">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReservations.map((r) => (
                      <tr key={r.id} className="border-b border-primary/5">
                        <td className="py-2 text-primary/80">
                          @{r.username}
                          {r.unitLabel ? (
                            <span className="ml-1 text-xs text-primary/60">({r.unitLabel})</span>
                          ) : null}
                        </td>
                        <td className="py-2 text-primary/80">
                          {r.title || (r.unitLabel ? `${equipmentName} ${r.unitLabel}` : "—")}
                        </td>
                        <td className="py-2 text-primary/80">
                          {formatKstDate(r.startAtIso)} ~ {formatKstDate(r.endAtIso)}
                        </td>
                        <td className="py-2">
                          <span
                            className={
                              r.status === "APPROVED"
                                ? "inline-block h-2 w-2 rounded-full bg-emerald-500"
                                : "inline-block h-2 w-2 rounded-full bg-amber-400"
                            }
                            title={r.status === "APPROVED" ? "승인" : "대기"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
