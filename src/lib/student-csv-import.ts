import { Buffer } from "node:buffer";

/** CSV 한 줄 파싱 (쉼표·따옴표 처리) */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

const HEADER_HINTS = /학번|이름|student|name|번호|성명/i;

function looksLikeHeader(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const joined = cells.join(" ");
  return HEADER_HINTS.test(joined);
}

export type ParsedStudentRow = {
  line: number;
  studentNumber: string;
  name: string;
};

/** 일괄 등록 상한 (admin 액션과 동일) */
export const MAX_STUDENT_CSV_ROWS = 2000;

/** UTF-8 BOM 제거 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * 첫 열: 학번, 둘째 열: 이름.
 * 첫 줄이 헤더로 보이면 건너뜀.
 */
export function parseStudentCsv(text: string): {
  rows: ParsedStudentRow[];
  parseErrors: { line: number; message: string }[];
} {
  const raw = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = raw.split("\n");
  const rows: ParsedStudentRow[] = [];
  const parseErrors: { line: number; message: string }[] = [];

  let startIndex = 0;
  if (lines.length > 0) {
    const firstCells = parseCsvLine(lines[0] ?? "");
    if (looksLikeHeader(firstCells)) startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i]?.trim() ?? "";
    if (!line) continue;

    const cells = parseCsvLine(line);
    if (cells.length < 2) {
      parseErrors.push({ line: lineNum, message: "열이 부족합니다 (학번, 이름 두 열 필요)." });
      continue;
    }

    const studentNumber = cells[0]?.trim() ?? "";
    const name = cells[1]?.trim() ?? "";

    if (!studentNumber) {
      parseErrors.push({ line: lineNum, message: "학번이 비어 있습니다." });
      continue;
    }
    if (!name) {
      parseErrors.push({ line: lineNum, message: "이름이 비어 있습니다." });
      continue;
    }
    if (studentNumber.length > 64) {
      parseErrors.push({ line: lineNum, message: "학번이 너무 깁니다." });
      continue;
    }
    if (name.length > 100) {
      parseErrors.push({ line: lineNum, message: "이름이 너무 깁니다." });
      continue;
    }

    rows.push({ line: lineNum, studentNumber, name });
  }

  return { rows, parseErrors };
}

/** username: 학번 + 이름 (공백 없이 이어 붙임) */
export function usernameFromStudentAndName(studentNumber: string, name: string): string {
  return `${studentNumber.trim()}${name.trim()}`;
}

/** 초기 비밀번호: 학번 + 이름 + ! (bcrypt는 UTF-8 기준 72바이트까지) */
export function initialPasswordFromStudentAndName(studentNumber: string, name: string): string {
  return `${studentNumber.trim()}${name.trim()}!`;
}

export function utf8ByteLength(s: string): number {
  return Buffer.byteLength(s, "utf8");
}
