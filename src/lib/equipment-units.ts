/**
 * 기자재별 대수·구분(A, B, …) 정의.
 * 예약 시 단위 선택, 관리자 「기자재별 담당 오퍼」일괄 목록 등에서 공통으로 참조합니다.
 */
export type EquipmentUnitConfig = {
  /** 장비 개수 */
  count: number;
  /** 각 장비를 구분하는 라벨 (예: A, B, C ...) */
  labels: string[];
};

/** 기자재 이름(정확한 name 필드) -> 장비 개수 및 라벨 설정 */
export const EQUIPMENT_UNITS: Record<string, EquipmentUnitConfig> = {
  "레이저커팅기": { count: 1, labels: ["A"] },
  "열화상카메라": { count: 1, labels: ["A"] },
  "뇌파측정기": { count: 2, labels: ["A", "B"] },
  "초고속 카메라": { count: 1, labels: ["A"] },
  "SEM": { count: 1, labels: ["A"] },
  // IR 장비가 FT‑IR을 가리키는 것으로 가정
  "FT-IR": { count: 1, labels: ["A"] },
  // UV‑vis 분광광도계 2대
  "UV-vis": { count: 2, labels: ["A", "B"] },
  "NMR": { count: 1, labels: ["A"] },
  "PCR": { count: 2, labels: ["A", "B"] },
  // 전기영동 장치 8대
  "전기영동장치": {
    count: 8,
    labels: ["A", "B", "C", "D", "E", "F", "G", "H"],
  },
  "회전증발농축기": { count: 2, labels: ["A", "B"] },
  "동결건조기": { count: 1, labels: ["A"] },
  "형광현미경": { count: 1, labels: ["A"] },
  // 편광 현미경: PolarizingMicroscope / Polarizing Microscope 두 이름을 모두 허용
  "PolarizingMicroscope": { count: 1, labels: ["A"] },
  "Polarizing Microscope": { count: 1, labels: ["A"] },
  "연구용 망원경": { count: 4, labels: ["A", "B", "C", "D"] },
  "돕소니안": { count: 1, labels: ["A"] },
  "CPC": { count: 2, labels: ["A", "B"] },
  "행성캠": { count: 1, labels: ["A"] },
  "Refracting Telescope": { count: 1, labels: ["A"] },
  "서버컴퓨터": { count: 2, labels: ["A", "B"] },
};

/** DB·표시명이 다를 때 EQUIPMENT_UNITS 키로 연결 */
const EQUIPMENT_UNIT_ALIASES: Record<string, keyof typeof EQUIPMENT_UNITS> = {
  "뇌파 측정기": "뇌파측정기",
  "UV-vis 분광광도계": "UV-vis",
};

function normalizeUnitLookupName(name: string): string {
  return name.replace(/[‐‑‒–—−﹣－]/g, "-").trim();
}

/** 기자재 이름으로 장비 단위 설정을 조회 */
export function getEquipmentUnitConfig(name: string): EquipmentUnitConfig | null {
  const t = normalizeUnitLookupName(name);
  const table = EQUIPMENT_UNITS as Record<string, EquipmentUnitConfig>;
  const direct = table[t];
  if (direct) return direct;
  const alias = EQUIPMENT_UNIT_ALIASES[t];
  if (alias) return EQUIPMENT_UNITS[alias] ?? null;
  return null;
}

/** 장비 이름으로 라벨 목록만 편하게 조회 */
export function getEquipmentUnitLabels(name: string): string[] {
  const cfg = getEquipmentUnitConfig(name);
  return cfg?.labels ?? [];
}

