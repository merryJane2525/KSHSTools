/**
 * 관리자 화면에서 "동일 장비인데 알파벳/단위로 DB 행이 나뉜 경우"를 묶어 일괄 오퍼 지정에 사용합니다.
 * 예: "뇌파측정기 A", "뇌파측정기 B" → 같은 접두 이름으로 그룹 (2건 이상일 때만 묶음으로 노출)
 */

import { getEquipmentUnitLabels } from "@/lib/equipment-units";
import { compactEquipmentLabel, normalizeEquipmentLabel } from "@/lib/home-equipment-resolve";

/**
 * 이름 표기가 달라도 같은 기종으로 묶어 일괄 오퍼 지정 (관리자 화면).
 * 뇌파측정기 / 뇌파 측정기, UV-vis / UV-vis 분광광도계, PCR 등
 */
const SHARED_BULK_FAMILIES: ReadonlyArray<{
  key: string;
  displayLabel: string;
  matchNames: readonly string[];
}> = [
  { key: "eeg", displayLabel: "뇌파측정기", matchNames: ["뇌파측정기", "뇌파 측정기"] },
  { key: "uvvis", displayLabel: "UV-vis 분광광도계", matchNames: ["UV-vis", "UV-vis 분광광도계"] },
  { key: "pcr", displayLabel: "PCR", matchNames: ["PCR"] },
];

function resolveBulkFamilyGroupKey(strippedOrFullName: string): string | null {
  const n = normalizeEquipmentLabel(strippedOrFullName);
  const c = compactEquipmentLabel(strippedOrFullName);
  for (const fam of SHARED_BULK_FAMILIES) {
    for (const m of fam.matchNames) {
      if (normalizeEquipmentLabel(m) === n || compactEquipmentLabel(m) === c) {
        return `fam:${fam.key}`;
      }
    }
  }
  return null;
}

function bulkFamilyDisplayLabel(groupKey: string): string | null {
  if (!groupKey.startsWith("fam:")) return null;
  const short = groupKey.slice(4);
  const fam = SHARED_BULK_FAMILIES.find((f) => f.key === short);
  return fam?.displayLabel ?? null;
}

/** 접미 ` A` 제거 후, 알려진 기종 패밀리면 동일 키로 묶음 */
function groupingKeyForEquipment(eqName: string): string {
  const stripped = stripTrailingUnitSuffix(eqName);
  const fromStripped = resolveBulkFamilyGroupKey(stripped);
  if (fromStripped) return fromStripped;
  const fromFull = resolveBulkFamilyGroupKey(eqName);
  if (fromFull) return fromFull;
  return stripped.toLowerCase();
}

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
    const key = groupingKeyForEquipment(eq.name);
    const list = byBase.get(key);
    if (list) list.push(eq);
    else byBase.set(key, [eq]);
  }

  const out: EquipmentBulkGroup[] = [];
  for (const [groupKey, members] of byBase) {
    if (members.length < 2) continue;
    const displayLabel =
      bulkFamilyDisplayLabel(groupKey) ?? stripTrailingUnitSuffix(members[0].name);
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

/** 여러 equipmentId에 대해 공통으로 지정된 operatorId (교집합) */
export function intersectionOperatorIds(
  equipmentIds: string[],
  operatorLinksByEquipment: Record<string, string[]>,
): string[] {
  if (equipmentIds.length === 0) return [];
  const sets = equipmentIds.map((id) => new Set(operatorLinksByEquipment[id] ?? []));
  return [...sets[0]].filter((opId) => sets.every((s) => s.has(opId)));
}

export type UnifiedAssignmentTarget = {
  /** `g:groupKey` 또는 `e:equipmentUuid` */
  key: string;
  /**
   * `group`: DB 행이 여러 개인 묶음, 또는 예약 단위만 여러 개인 1행 기자재(일괄 지정 UI).
   * `single`: 단일 행·단일(또는 무단위) 예약인 일반 기자재만.
   */
  kind: "group" | "single";
  sortLabel: string;
  optionLabel: string;
  /** 선택 시 표시할 보조 설명 */
  description: string | null;
  equipmentIds: string[];
};

/**
 * 묶음(동일 접두 2건 이상) + 묶음에 속하지 않은 개별 기자재를 한 목록으로 합칩니다.
 */
export function buildUnifiedAssignmentTargets(
  equipments: { id: string; name: string; slug: string }[],
  bulkGroups: EquipmentBulkGroup[],
): UnifiedAssignmentTarget[] {
  const inGroup = new Set<string>();
  for (const g of bulkGroups) {
    for (const id of g.equipmentIds) inGroup.add(id);
  }

  const nameById = new Map(equipments.map((e) => [e.id, e.name] as const));

  const targets: UnifiedAssignmentTarget[] = [];

  for (const g of bulkGroups) {
    const names = g.equipmentIds.map((id) => nameById.get(id) ?? id).join(", ");
    targets.push({
      key: `g:${g.groupKey}`,
      kind: "group",
      sortLabel: g.displayLabel,
      optionLabel: `${g.displayLabel} (동일 이름 · ${g.equipmentIds.length}건 묶음)`,
      description: `포함 행: ${names}. 묶음 전체에 동일한 오퍼 구성이 적용됩니다.`,
      equipmentIds: g.equipmentIds,
    });
  }

  for (const eq of equipments) {
    if (inGroup.has(eq.id)) continue;
    const labels = getEquipmentUnitLabels(eq.name);
    /** 예약만 A·B·… 로 나뉘고 DB는 1행인 경우 → 개별(노란 안내)로 두지 않고 묶음(일괄) UI만 사용 */
    if (labels.length > 1) {
      targets.push({
        key: `e:${eq.id}`,
        kind: "group",
        sortLabel: eq.name,
        optionLabel: `${eq.name} (예약 단위 ${labels.join(", ")} · 일괄)`,
        description: `예약 시 ${labels.join(", ")} 등 단위로 구분됩니다. 오퍼레이터 지정은 이 항목 한 번으로 모든 단위에 적용됩니다.`,
        equipmentIds: [eq.id],
      });
      continue;
    }
    targets.push({
      key: `e:${eq.id}`,
      kind: "single",
      sortLabel: eq.name,
      optionLabel: eq.name,
      description: null,
      equipmentIds: [eq.id],
    });
  }

  targets.sort((a, b) => a.sortLabel.localeCompare(b.sortLabel, "ko"));
  return targets;
}

export function resolveAssignmentSelectionKey(
  selection: string | undefined,
  legacyEquipmentId: string | undefined,
  targets: UnifiedAssignmentTarget[],
): string | null {
  if (targets.length === 0) return null;
  if (selection && targets.some((t) => t.key === selection)) {
    return selection;
  }
  if (legacyEquipmentId && /^[0-9a-f-]{36}$/i.test(legacyEquipmentId)) {
    const k = `e:${legacyEquipmentId}`;
    if (targets.some((t) => t.key === k)) return k;
  }
  return targets[0]?.key ?? null;
}
