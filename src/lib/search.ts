/**
 * 통합 검색: 검색어 정규화, 스니펫, 동의어 확장
 */

const MAX_SNIPPET = 120;
const MAX_TITLE_SNIPPET = 70;

/** HTML 태그 제거 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** 검색어 토큰화: 소문자, 특수문자 제거 (하이픈/슬래시 유지) */
export function tokenizeQuery(q: string): string[] {
  const normalized = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

/** 동의어 확장 (쿼리 확장용) */
const SYNONYMS: Record<string, string[]> = {
  ftir: ["ft-ir", "적외선", "infrared"],
  "ft-ir": ["ftir", "적외선", "infrared"],
  적외선: ["ftir", "ft-ir", "infrared"],
  infrared: ["ftir", "ft-ir", "적외선"],
  sem: ["전자현미경"],
  전자현미경: ["sem"],
  charging: ["차징", "대전"],
  차징: ["charging", "대전"],
  대전: ["charging", "차징"],
  noise: ["노이즈"],
  노이즈: ["noise"],
};

export function expandWithSynonyms(tokens: string[]): string[] {
  const set = new Set<string>(tokens);
  for (const t of tokens) {
    const group = SYNONYMS[t] ?? SYNONYMS[t.toLowerCase()];
    if (group) group.forEach((s) => set.add(s));
  }
  return Array.from(set);
}

/** 스니펫 생성: content에서 토큰 주변 60~120자 */
export function buildSnippet(content: string, tokens: string[], maxLen: number = MAX_SNIPPET): string {
  const plain = stripHtml(content);
  if (!plain) return "";
  if (plain.length <= maxLen) return plain;
  const lower = plain.toLowerCase();
  for (const token of tokens) {
    const idx = lower.indexOf(token.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(plain.length, start + maxLen);
      const snippet = (start > 0 ? "…" : "") + plain.slice(start, end) + (end < plain.length ? "…" : "");
      return snippet.trim();
    }
  }
  return plain.slice(0, maxLen) + "…";
}

/** 제목/스니펫 말줄임 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + "…";
}

/** 문제형 키워드: 트러블슈팅/QA 부스트용 */
const PROBLEM_KEYWORDS = new Set(
  "안됨 안돼 안 나옴 오류 error 노이즈 noise 충전 charging 깨짐 흐림 blurry".split(" ")
);

export function isProblemQuery(tokens: string[]): boolean {
  return tokens.some((t) => PROBLEM_KEYWORDS.has(t.toLowerCase()));
}
