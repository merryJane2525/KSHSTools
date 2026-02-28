/**
 * 주간 캘린더용 주차(월요일 기준) 계산.
 * KST(Asia/Seoul) 기준으로 통일해 주간 예약 현황이 올바른 주에 표시되도록 함.
 */

/** 주어진 날짜(YYYY-MM-DD 또는 Date)가 속한 주의 월요일 날짜를 KST 기준 YYYY-MM-DD로 반환 */
function getMondayKst(dateOrIso: Date | string): string {
  const d =
    typeof dateOrIso === "string"
      ? new Date(dateOrIso + "T00:00:00+09:00")
      : new Date(dateOrIso);
  if (Number.isNaN(d.getTime())) return getDefaultWeekStart();
  // KST 기준 요일: 00:00 KST = 전날 15:00 UTC → (getUTCDay() + 1) % 7 → 0=일, 1=월, ..., 6=토
  const kstWeekday = (d.getUTCDay() + 1) % 7;
  const mondayOffset = (kstWeekday + 6) % 7; // 월요일까지 며칠 전인지
  const mondayMs = d.getTime() - mondayOffset * 24 * 60 * 60 * 1000;
  return new Date(mondayMs).toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

/** 오늘(KST 기준)이 속한 주의 월요일 YYYY-MM-DD */
export function getDefaultWeekStart(): string {
  const todayKst = new Date().toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
  return getMondayKst(todayKst);
}

export function parseWeekParam(week?: string | null): string {
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) return getDefaultWeekStart();
  return getMondayKst(week);
}
