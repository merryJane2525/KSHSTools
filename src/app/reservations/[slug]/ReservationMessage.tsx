const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "입력값을 확인해 주세요.",
  INVALID_DATETIME: "날짜/시간 형식이 올바르지 않습니다.",
  INVALID_RANGE: "종료 시간이 시작 시간보다 빠릅니다.",
  SLOT_10MIN: "시작·종료 시간은 10분 단위(예: 10:00, 10:10, 10:20)로 선택해 주세요.",
  MIN_10MIN: "예약은 최소 10분 이상이어야 합니다.",
  TOO_LONG: "예약 시간은 최대 8시간까지 가능합니다.",
  PAST_TIME: "과거 시간으로는 예약할 수 없습니다.",
  TOO_FAR: "예약은 현재 시각 기준 30일 이내만 가능합니다.",
  INVALID_STUDENT_NUMBER: "학번은 4자리 숫자로 입력해 주세요.",
  INVALID_EQUIPMENT: "기자재가 올바르지 않습니다.",
  EQUIPMENT_CONFLICT: "해당 시간대에 이미 다른 예약이 있습니다.",
  USER_CONFLICT: "같은 시간대에 내 다른 예약이 이미 있습니다.",
  OPERATOR_CONFLICT: "지정한 오퍼레이터가 해당 시간대에 이미 다른 예약이 있습니다.",
};

export function ReservationMessage({
  success,
  errorCode,
}: {
  success: boolean;
  errorCode?: string;
}) {
  if (success) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
        예약이 신청되었습니다. 오퍼레이터 승인 후 확정됩니다.
      </div>
    );
  }
  if (!errorCode) return null;
  const message = ERROR_MESSAGES[errorCode] ?? "예약 처리 중 오류가 발생했습니다.";
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}
