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
  return toDate(date).toLocaleString(LOCALE, { timeZone: TIMEZONE });
}

export function formatDate(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
}
