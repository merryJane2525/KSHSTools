"use client";

import { useMemo, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createReservationFormAction } from "@/app/actions/reservations";

const SLOT_MINUTES = 10;
const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += SLOT_MINUTES) {
    timeOptions.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "예약 신청 중..." : "예약 신청하기"}
    </button>
  );
}

type OperatorOption = { id: string; username: string };

export function ReservationForm({
  equipmentId,
  equipmentSlug,
  equipmentName,
  defaultStudentName,
  defaultStudentNumber,
  defaultDate,
  operators = [],
}: {
  equipmentId: string;
  equipmentSlug: string;
  equipmentName: string;
  defaultStudentName: string;
  defaultStudentNumber: string;
  defaultDate: string;
  operators?: OperatorOption[];
}) {
  const { minDate, maxDate } = useMemo(() => {
    const d = new Date();
    const min = d.toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
    const maxD = new Date(d);
    maxD.setDate(maxD.getDate() + 30);
    const max = maxD.toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
    return { minDate: min, maxDate: max };
  }, []);

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement)?.value;
    const startTime = (form.elements.namedItem("startTime") as HTMLSelectElement)?.value;
    const endTime = (form.elements.namedItem("endTime") as HTMLSelectElement)?.value;
    if (!date || !startTime || !endTime) return;
    const startAt = `${date}T${startTime}`;
    const endAt = `${date}T${endTime}`;
    let startInput = form.querySelector<HTMLInputElement>('input[name="startAt"]');
    let endInput = form.querySelector<HTMLInputElement>('input[name="endAt"]');
    if (!startInput) {
      startInput = document.createElement("input");
      startInput.type = "hidden";
      startInput.name = "startAt";
      form.appendChild(startInput);
    }
    if (!endInput) {
      endInput = document.createElement("input");
      endInput.type = "hidden";
      endInput.name = "endAt";
      form.appendChild(endInput);
    }
    startInput.value = startAt;
    endInput.value = endAt;
  };

  return (
    <form ref={formRef} action={createReservationFormAction} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="equipmentId" value={equipmentId} />
      <input type="hidden" name="equipmentSlug" value={equipmentSlug} />
      <input type="hidden" name="redirectBase" value="reservations" />

      <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm dark:bg-[#15191d] dark:border-primary/20">
        <h2 className="text-lg font-bold text-primary">예약 신청: {equipmentName}</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-primary/80">사용자 (학생 이름)</span>
            <input
              type="text"
              defaultValue={defaultStudentName}
              readOnly
              aria-label="사용자 (학생 이름)"
              className="mt-1 w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary/80 focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/10"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-primary/80">학번 (4자리 숫자)</span>
            <input
              type="text"
              name="studentNumber"
              defaultValue={defaultStudentNumber}
              placeholder="예: 1234"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]{4}"
              autoComplete="off"
              title="학번은 4자리 숫자로 입력해 주세요."
              className="mt-1 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-primary/80">예약 제목</span>
          <input
            type="text"
            name="title"
            placeholder="예약 제목을 작성해주세요."
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-primary/80">설명</span>
          <textarea
            name="note"
            placeholder="사용 목적, 인원 등을 작성해주세요."
            maxLength={500}
            rows={3}
            className="mt-1 w-full resize-y rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-bold text-primary/80">날짜</span>
            <input
              type="date"
              name="date"
              defaultValue={defaultDate}
              min={minDate}
              max={maxDate}
              required
              className="mt-1 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-primary/80">시작 시간</span>
            <select
              name="startTime"
              required
              className="mt-1 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
            >
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-primary/80">종료 시간</span>
            <select
              name="endTime"
              required
              className="mt-1 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
            >
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        {operators.length > 0 && (
          <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10">
            <span className="text-sm font-bold text-primary/80">오퍼레이터 지정 (선택)</span>
            <p className="mt-1 text-xs text-primary/60">
              오퍼레이터를 지정하면 해당 오퍼레이터가 승인한 후 예약이 확정됩니다.
            </p>
            <select
              name="operatorId"
              className="mt-2 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
            >
              <option value="">오퍼레이터 없이 예약</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  @{op.username}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="mt-2 text-xs text-primary/60">
          예약 시간은 10분 단위로 선택할 수 있으며, 현재 시각 기준 30일 이내만 예약 가능합니다. 예약 후 오퍼레이터 승인이 필요합니다.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <SubmitButton />
          <a
            href={`/reservations/${equipmentSlug}`}
            className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
          >
            취소
          </a>
        </div>
      </div>
    </form>
  );
}
