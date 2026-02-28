"use client";

import { useMemo } from "react";
import { useFormStatus } from "react-dom";
import {
  approveReservationFormAction,
  cancelReservationFormAction,
  createReservationFormAction,
  rejectReservationFormAction,
} from "@/app/actions/reservations";

export type ReservationListItem = {
  id: string;
  status: "PENDING" | "APPROVED";
  startAtIso: string;
  endAtIso: string;
  note: string | null;
  username: string;
  isMine: boolean;
};

function formatKst(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "예약 중..." : "예약하기"}
    </button>
  );
}

export function ReservationsPanel({
  equipmentId,
  equipmentSlug,
  reservations,
  reservationError,
  weekParam,
  canManageReservations = false,
}: {
  equipmentId: string;
  equipmentSlug: string;
  reservations: ReservationListItem[];
  reservationError?: string | null;
  weekParam?: string | null;
  /** ADMIN 또는 OPERATOR일 때 true, 대기 예약 승인/거절 버튼 표시 */
  canManageReservations?: boolean;
}) {

  // 예약 가능 최소 시각: 현재 시각을 "다음 10분 단위"로 올린 값 (00, 10, 20, 30, 40, 50분만 유효)
  const minStartIsoLocal = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const m = d.getMinutes();
    const roundedMin = Math.ceil(m / 10) * 10; // 0,10,20,30,40,50 또는 60
    if (roundedMin >= 60) {
      d.setHours(d.getHours() + 1);
      d.setMinutes(0);
    } else {
      d.setMinutes(roundedMin);
    }
    d.setSeconds(0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  const myReservations = reservations.filter((r) => r.isMine);
  const hasAny = reservations.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">예약</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              시각은 10분 단위(00, 10, 20, 30, 40, 50분)로만 선택할 수 있습니다. 예약 후 오퍼레이터 승인을 거쳐 확정됩니다.
            </p>
          </div>
        </div>

        {reservationError ? (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {reservationError === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
            {reservationError === "INVALID_DATETIME" && "날짜/시간 형식이 올바르지 않습니다."}
            {reservationError === "INVALID_RANGE" && "종료 시간이 시작 시간보다 빠릅니다."}
            {reservationError === "SLOT_10MIN" && "시작·종료 시간은 10분 단위(예: 10:00, 10:10, 10:20)로 선택해 주세요."}
            {reservationError === "MIN_10MIN" && "예약은 최소 10분 이상이어야 합니다."}
            {reservationError === "TOO_LONG" && "예약 시간은 최대 8시간까지 가능합니다."}
            {reservationError === "PAST_TIME" && "과거 시간으로는 예약할 수 없습니다."}
            {reservationError === "INVALID_EQUIPMENT" && "기자재가 올바르지 않습니다."}
            {reservationError === "EQUIPMENT_CONFLICT" && "해당 시간대에 이미 다른 예약이 있습니다."}
            {reservationError === "USER_CONFLICT" && "같은 시간대에 내 다른 예약이 이미 있습니다."}
          </div>
        ) : null}

        <form action={createReservationFormAction} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" name="equipmentId" value={equipmentId} />
          <input type="hidden" name="equipmentSlug" value={equipmentSlug} />
          {weekParam ? <input type="hidden" name="week" value={weekParam} /> : null}

          <label className="block">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">시작</div>
            <input
              type="datetime-local"
              name="startAt"
              min={minStartIsoLocal}
              step="600"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              required
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">종료</div>
            <input
              type="datetime-local"
              name="endAt"
              min={minStartIsoLocal}
              step="600"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">메모 (옵션)</div>
            <input
              name="note"
              maxLength={200}
              placeholder="예: 2학년 화학 실험 / 시료 3개"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </label>

          <div className="sm:col-span-2">
            <SubmitButton />
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">전체 예약 현황</div>
          {!hasAny ? (
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">아직 예약이 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-zinc-100 dark:border-zinc-700 px-4 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatKst(r.startAtIso)} ~ {formatKst(r.endAtIso)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        예약자: @{r.username} {r.isMine ? "(나)" : ""} · {r.status === "PENDING" ? "대기" : "승인"}
                      </div>
                      {r.note ? (
                        <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                          {r.note}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {r.isMine ? (
                        <form action={cancelReservationFormAction} className="shrink-0">
                          <input type="hidden" name="reservationId" value={r.id} />
                          <button className="rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                            취소
                          </button>
                        </form>
                      ) : null}
                      {canManageReservations && r.status === "PENDING" ? (
                        <>
                          <form action={approveReservationFormAction} className="shrink-0">
                            <input type="hidden" name="reservationId" value={r.id} />
                            <button
                              type="submit"
                              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              승인
                            </button>
                          </form>
                          <form action={rejectReservationFormAction} className="shrink-0">
                            <input type="hidden" name="reservationId" value={r.id} />
                            <button
                              type="submit"
                              className="rounded-xl border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                            >
                              거절
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">내 예약</div>
          {myReservations.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">이 기자재에 대한 내 예약이 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {myReservations.map((r) => (
                <div key={r.id} className="rounded-xl border border-zinc-100 dark:border-zinc-700 px-4 py-3 text-sm">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatKst(r.startAtIso)} ~ {formatKst(r.endAtIso)}
                  </div>
                  {r.note ? (
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                      {r.note}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

