/**
 * 서버에서 날짜/시간을 표시할 때 사용.
 * DB는 UTC로 저장되므로, 한국 사용자 기준으로 Asia/Seoul로 통일해 표시합니다.
 * date는 Date 또는 ISO 문자열(클라이언트 직렬화 시) 모두 허용합니다.
 */
const TIMEZONE = "Asia/Seoul";
const LOCALE = "ko-KR";

function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

export function formatDateTime(date: Date | string): string {
  return toDate(date).toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** 시간만 오전/오후 구분하여 표시 (예: 오전 9:00, 오후 12:30) */
export function formatTime12h(date: Date | string): string {
  return toDate(date).toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
}
