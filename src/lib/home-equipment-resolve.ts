/** 홈 심화기자재 목록·대표 장비에서 라벨과 DB name/slug를 맞추기 위한 정규화 */

import { EQUIPMENT_UNITS } from "@/lib/equipment-units";

const UNICODE_DASHES = /[‐‑‒–—−﹣－]/g;

/** equipment-units.ts 기준 표준 기자재명 — 여러 DB 행이 있을 때 이 이름과 일치하는 행을 A(대표)로 간주 */
const CANONICAL_EQUIPMENT_NAMES = new Set(Object.keys(EQUIPMENT_UNITS));

function matchesCanonicalEquipmentName(eqName: string): boolean {
  const n = normalizeEquipmentLabel(eqName);
  const c = compactEquipmentLabel(eqName);
  for (const key of CANONICAL_EQUIPMENT_NAMES) {
    if (normalizeEquipmentLabel(key) === n || compactEquipmentLabel(key) === c) return true;
  }
  return false;
}

/** 여러 후보 중 A 단·대표(표준명 일치, 또는 이름/slug에 A) 우선. B 단은 후순위 */
function unitAFirstScore(eq: { name: string; slug: string }): number {
  if (matchesCanonicalEquipmentName(eq.name)) return 100;
  const slug = eq.slug.toLowerCase();
  const name = eq.name;
  const looksB =
    /(?:^|\s)\(?B\)?(?:\s|$)|B호|대\s*B|(?:^|\s)B\s*$/i.test(name) ||
    /(?:^|-)b(?:$|-)|-b\d|_b\b/i.test(slug);
  if (looksB) return 0;
  const looksA =
    /(?:^|\s)\(?A\)?(?:\s|$)|A호|대\s*A|(?:^|\s)A\s*$/i.test(name) ||
    /(?:^|-)a(?:$|-)|-a\d|_a\b/i.test(slug);
  if (looksA) return 80;
  return 50;
}

function pickBestSlugPreferUnitA(candidates: Array<{ name: string; slug: string }>): string {
  if (candidates.length === 0) throw new Error("pickBestSlugPreferUnitA: empty candidates");
  if (candidates.length === 1) return candidates[0].slug;
  const sorted = [...candidates].sort((a, b) => {
    const diff = unitAFirstScore(b) - unitAFirstScore(a);
    if (diff !== 0) return diff;
    return a.name.length - b.name.length;
  });
  return sorted[0].slug;
}

export function normalizeEquipmentLabel(s: string): string {
  return s
    .replace(UNICODE_DASHES, "-")
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ");
}

/** 공백 무시 비교용 (Polarizing Microscope ↔ PolarizingMicroscope) */
export function compactEquipmentLabel(s: string): string {
  return normalizeEquipmentLabel(s).replace(/\s/g, "");
}

/**
 * 홈 표에 쓰는 표시명과 DB `Equipment.name`이 다를 때, 먼저 찾아볼 이름 후보.
 * (첫 번째로 lookup에 성공한 slug를 사용)
 */
const HOME_LABEL_NAME_ALTERNATES: [string, readonly string[]][] = [
  ["IR", ["FT-IR"]],
  ["열화상 카메라", ["열화상카메라"]],
  ["뇌파 측정기", ["뇌파측정기"]],
  ["UV-vis 분광광도계", ["UV-vis"]],
  ["전기영동", ["전기영동장치"]],
  ["편광 현미경 및 박편", ["Polarizing Microscope", "PolarizingMicroscope"]],
  ["서버 컴퓨터", ["서버컴퓨터"]],
];

function buildHomeLabelAliasMap(): Map<string, readonly string[]> {
  const m = new Map<string, readonly string[]>();
  for (const [label, alts] of HOME_LABEL_NAME_ALTERNATES) {
    m.set(normalizeEquipmentLabel(label), alts);
    m.set(compactEquipmentLabel(label), alts);
  }
  return m;
}

let homeLabelAliasMap: Map<string, readonly string[]> | null = null;
function getHomeLabelAliasMap(): Map<string, readonly string[]> {
  if (!homeLabelAliasMap) homeLabelAliasMap = buildHomeLabelAliasMap();
  return homeLabelAliasMap;
}

/**
 * 홈에서 쓰는 표시 라벨 → 상세 페이지 slug.
 * DB `name`·`slug`에서 여러 키를 등록해 부분 불일치를 흡수합니다.
 */
export function buildEquipmentLookupMap(
  equipments: Array<{ name: string; slug: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const eq of equipments) {
    const slug = eq.slug;
    const keys = new Set<string>();
    keys.add(normalizeEquipmentLabel(eq.name));
    keys.add(compactEquipmentLabel(eq.name));
    keys.add(eq.slug.trim().toLowerCase());
    const slugAsWords = eq.slug.replace(/-/g, " ");
    keys.add(normalizeEquipmentLabel(slugAsWords));
    keys.add(compactEquipmentLabel(slugAsWords));
    for (const k of keys) {
      if (k && !map.has(k)) map.set(k, slug);
    }
  }
  return map;
}

/** lookupMap에서만 slug 조회 (재귀·별칭 체인 없음 — 스택 오버플로 방지) */
function resolveSlugFromLookupMapOnly(label: string, lookupMap: Map<string, string>): string | undefined {
  const candidates = [
    normalizeEquipmentLabel(label),
    compactEquipmentLabel(label),
    label.trim().toLowerCase(),
  ];
  for (const c of candidates) {
    const s = lookupMap.get(c);
    if (s) return s;
  }
  return undefined;
}

function matchesLoosely(eqName: string, homeLabel: string): boolean {
  const n1 = normalizeEquipmentLabel(eqName);
  const n2 = normalizeEquipmentLabel(homeLabel);
  if (n1 === n2) return true;
  const c1 = compactEquipmentLabel(eqName);
  const c2 = compactEquipmentLabel(homeLabel);
  if (c1 === c2) return true;
  /** 짧은 표 라벨(SEM, NMR, PCR, CPC 등): 접두 일치만 (includes는 오탐 방지) */
  if (c2.length >= 1 && c2.length <= 3) {
    return c1.startsWith(c2);
  }
  if (c1.length < 4 || c2.length < 4) return false;
  if (c1.includes(c2) || c2.includes(c1)) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  return false;
}

/** 표 라벨과 이름이 정확히 같은 장비가 있으면 그 slug (복수 행이면 A 단 우선) */
function slugByExactEquipmentName(
  label: string,
  equipments: Array<{ name: string; slug: string }>,
): string | undefined {
  const nl = normalizeEquipmentLabel(label);
  const cl = compactEquipmentLabel(label);
  const exact = equipments.filter(
    (eq) =>
      normalizeEquipmentLabel(eq.name) === nl || compactEquipmentLabel(eq.name) === cl,
  );
  if (exact.length === 0) return undefined;
  if (exact.length === 1) return exact[0].slug;
  return pickBestSlugPreferUnitA(exact);
}

/** 느슨한 매칭 후보가 여러 개일 때: 표 라벨과 동일 이름 우선, 그다음 A 단 우선 */
function pickSlugFromLooseHits(
  hits: Array<{ name: string; slug: string }>,
  label: string,
): string {
  const nl = normalizeEquipmentLabel(label);
  const cl = compactEquipmentLabel(label);
  const exact = hits.filter(
    (h) =>
      normalizeEquipmentLabel(h.name) === nl || compactEquipmentLabel(h.name) === cl,
  );
  if (exact.length === 1) return exact[0].slug;
  if (exact.length > 1) return pickBestSlugPreferUnitA(exact);
  return pickBestSlugPreferUnitA(hits);
}

/**
 * @param equipments `lookupMap`으로 잡히지 않을 때만 사용. 유일 일치가 있을 때만 slug 반환.
 */
export function lookupEquipmentSlug(
  label: string,
  lookupMap: Map<string, string>,
  equipments?: Array<{ name: string; slug: string }>,
): string | undefined {
  const direct = resolveSlugFromLookupMapOnly(label, lookupMap);
  if (direct) return direct;

  const aliasMap = getHomeLabelAliasMap();
  const aliasAlts =
    aliasMap.get(normalizeEquipmentLabel(label)) ?? aliasMap.get(compactEquipmentLabel(label));
  if (aliasAlts) {
    for (const altName of aliasAlts) {
      const s = resolveSlugFromLookupMapOnly(altName, lookupMap);
      if (s) return s;
    }
  }

  if (!equipments?.length) return undefined;

  const exactSlug = slugByExactEquipmentName(label, equipments);
  if (exactSlug) return exactSlug;

  const hits = equipments.filter((eq) => matchesLoosely(eq.name, label));
  if (hits.length === 1) return hits[0].slug;
  if (hits.length > 1) return pickSlugFromLooseHits(hits, label);
  return undefined;
}
