/**
 * 관리자 「기자재별 오퍼레이터」에서 담당 오퍼를 묶어 지정할 때 씁니다.
 * (예약 기능 자체가 아니라, OperatorEquipment 링크를 어떤 기자재 행에 걸지 관리하는 UI)
 */

import { getEquipmentUnitLabels } from "@/lib/equipment-units";
import { compactEquipmentLabel, normalizeEquipmentLabel } from "@/lib/home-equipment-resolve";

/** 이름 표기가 달라도 같은 기종으로 묶어 담당 오퍼를 일괄 지정 (뇌파·UV-vis·PCR 등) */
const SHARED_BULK_FAMILIES: ReadonlyArray<{
  key: string;
  displayLabel: string;
  matchNames: readonly string[];
}> = [
  { key: "eeg", displayLabel: "뇌파측정기", matchNames: ["뇌파측정기", "뇌파 측정기"] },
  { key: "uvvis", displayLabel: "UV-vis 분광광도계", matchNames: ["UV-vis", "UV-vis 분광광도계"] },
  { key: "pcr", displayLabel: "PCR", matchNames: ["PCR"] },
  { key: "server", displayLabel: "서버 컴퓨터", matchNames: ["서버컴퓨터", "서버 컴퓨터"] },
];

/** 전각 괄호·대시 등으로 접미 패턴이 안 잡히는 경우 방지 */
function normalizeNameForUnitParsing(name: string): string {
  return name
    .replace(/\uFF08/g, "(")
    .replace(/\uFF09/g, ")")
    .replace(/[‐‑‒–—−﹣－]/g, "-")
    .trim()
    .normalize("NFKC")
    .replace(/([Ａ-Ｚ])$/u, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, " ");
}

/**
 * 정확히 등록된 표기와 일치할 때
 * + 표기가 조금 달라도(공백·붙여쓰기 등) 같은 기종이면 묶음 (뇌파·UV-vis·PCR)
 */
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
  return resolveBulkFamilyGroupKeyLoose(strippedOrFullName);
}

function resolveBulkFamilyGroupKeyLoose(strippedOrFullName: string): string | null {
  const c = compactEquipmentLabel(strippedOrFullName);
  if (c.includes("뇌파") && c.includes("측정")) return "fam:eeg";
  if (c.includes("uvvis") || (c.includes("uv") && c.includes("vis"))) return "fam:uvvis";
  if (c === "pcr") return "fam:pcr";
  if (c.includes("서버") && c.includes("컴퓨터")) return "fam:server";
  return null;
}

function bulkFamilyDisplayLabel(groupKey: string): string | null {
  if (!groupKey.startsWith("fam:")) return null;
  const short = groupKey.slice(4);
  const fam = SHARED_BULK_FAMILIES.find((f) => f.key === short);
  return fam?.displayLabel ?? null;
}

/** 등록된 패밀리(뇌파·UV-vis·PCR 등)에 속하면 관리 UI용 표시명 */
function familyDisplayLabelForEquipmentName(eqName: string): string | null {
  const pre = normalizeNameForUnitParsing(eqName);
  const stripped = stripTrailingUnitSuffix(pre);
  const key = resolveBulkFamilyGroupKey(stripped) ?? resolveBulkFamilyGroupKey(pre);
  if (!key) return null;
  return bulkFamilyDisplayLabel(key);
}

/** 접미 ` A` 제거 후, 알려진 기종 패밀리면 동일 키로 묶음 */
function groupingKeyForEquipment(eqName: string): string {
  const pre = normalizeNameForUnitParsing(eqName);
  const stripped = stripTrailingUnitSuffix(pre);
  const fromStripped = resolveBulkFamilyGroupKey(stripped);
  if (fromStripped) return fromStripped;
  const fromFull = resolveBulkFamilyGroupKey(pre);
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

/**
 * 이름 끝의 단위 접미를 제거해 묶음 기준 키로 씁니다.
 * ` A`, `(B)`, `-A`, `A`(붙여쓰기) 등. 붙여쓰기는 SEM 등 짧은 약어 오탐을 막기 위해 본문 4자 이상일 때만 제거합니다.
 */
export function stripTrailingUnitSuffix(name: string): string {
  const t = normalizeNameForUnitParsing(name);
  const paren = t.match(/^(.+?)\s*\(([A-Z])\)\s*$/);
  if (paren) return paren[1].trim();
  const spaced = t.match(/^(.+?)\s+([A-Z])$/);
  if (spaced) return spaced[1].trim();
  const hyphen = t.match(/^(.+)-([A-Z])$/);
  if (hyphen && hyphen[1].length >= 4) return hyphen[1].trim();
  const glued = t.match(/^(.+)([A-Z])$/);
  if (glued && glued[1].length >= 4) return glued[1].trim();
  return t;
}

function extractUnitTag(name: string): string {
  const t = normalizeNameForUnitParsing(name);
  const paren = t.match(/^(.+?)\s*\(([A-Z])\)\s*$/);
  if (paren) return paren[2];
  const spaced = t.match(/^(.+?)\s+([A-Z])$/);
  if (spaced) return spaced[2];
  const hyphen = t.match(/^(.+)-([A-Z])$/);
  if (hyphen && hyphen[1].length >= 4) return hyphen[2];
  const glued = t.match(/^(.+)([A-Z])$/);
  if (glued && glued[1].length >= 4) return glued[2];
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
   * `group`: DB 행이 여러 개인 묶음, 또는 한 행이지만 A·B 등 여러 대로 구분되는 기자재(담당 오퍼 일괄 UI).
   * `single`: 한 행·한 대만 해당하는 일반 기자재.
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
      description: `포함 기자재 행: ${names}. 묶음 전체에 동일한 담당 오퍼레이터가 연결됩니다.`,
      equipmentIds: g.equipmentIds,
    });
  }

  for (const eq of equipments) {
    if (inGroup.has(eq.id)) continue;
    const labels = getEquipmentUnitLabels(eq.name);
    /** DB 1행이지만 A·B 등 여러 대로 구분되는 기종 → 담당 오퍼도 일괄 항목으로만 표시 */
    if (labels.length > 1) {
      const famLabel = familyDisplayLabelForEquipmentName(eq.name);
      const sortLabel = famLabel ?? eq.name;
      const optionLabel = famLabel
        ? `${famLabel} (일괄)`
        : `${eq.name} (구분 ${labels.join(", ")} · 일괄)`;
      const description = famLabel
        ? `${famLabel}는 여러 대로 구분되는 기종입니다. 담당 오퍼레이터 지정은 이 항목 한 번으로 모든 대에 동일하게 적용됩니다.`
        : `이 기자재는 ${labels.join(", ")} 등 여러 대로 구분됩니다. 담당 오퍼레이터 지정은 이 항목 한 번으로 모든 구분에 동일하게 적용됩니다.`;
      targets.push({
        key: `e:${eq.id}`,
        kind: "group",
        sortLabel,
        optionLabel,
        description,
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
