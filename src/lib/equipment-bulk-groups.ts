/**
 * 관리자 화면에서 "동일 장비인데 알파벳/단위로 DB 행이 나뉜 경우"를 묶어 일괄 오퍼 지정에 사용합니다.
 * 예: "뇌파측정기 A", "뇌파측정기 B" → 같은 접두 이름으로 그룹 (2건 이상일 때만 묶음으로 노출)
 */

export type EquipmentBulkGroup = {
  /** 그룹 식별용 (정렬·키) */
  groupKey: string;
  /** UI에 보여 줄 이름 (접두) */
  displayLabel: string;
  equipmentIds: string[];
  /** 각 행에서 뽑은 단위 표기 (예: A, B) */
  unitTags: string[];
};

/** 이름 끝의 ` A`, ` (B)` 형태 단위 접미사를 제거해 묶음 기준 키로 씁니다. */
export function stripTrailingUnitSuffix(name: string): string {
  const t = name.trim();
  const paren = t.match(/^(.+?)\s*\(([A-Z])\)\s*$/);
  if (paren) return paren[1].trim();
  const spaced = t.match(/^(.+?)\s+([A-Z])$/);
  if (spaced) return spaced[1].trim();
  return t;
}

function extractUnitTag(name: string): string {
  const t = name.trim();
  const paren = t.match(/^(.+?)\s*\(([A-Z])\)\s*$/);
  if (paren) return paren[2];
  const spaced = t.match(/^(.+?)\s+([A-Z])$/);
  if (spaced) return spaced[2];
  return "—";
}

/**
 * DB에 2건 이상 존재하고, 접미사 제거 시 동일한 기준 이름을 갖는 기자재만 묶음으로 반환합니다.
 */
export function buildEquipmentBulkGroups(equipments: { id: string; name: string }[]): EquipmentBulkGroup[] {
  const byBase = new Map<string, { id: string; name: string }[]>();

  for (const eq of equipments) {
    const base = stripTrailingUnitSuffix(eq.name);
    const key = base.toLowerCase();
    const list = byBase.get(key);
    if (list) list.push(eq);
    else byBase.set(key, [eq]);
  }

  const out: EquipmentBulkGroup[] = [];
  for (const [groupKey, members] of byBase) {
    if (members.length < 2) continue;
    const displayLabel = stripTrailingUnitSuffix(members[0].name);
    const unitTags = members.map((m) => extractUnitTag(m.name));
    out.push({
      groupKey,
      displayLabel,
      equipmentIds: members.map((m) => m.id),
      unitTags,
    });
  }

  out.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, "ko"));
  return out;
}
