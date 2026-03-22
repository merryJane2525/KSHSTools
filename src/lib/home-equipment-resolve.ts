/** 홈 심화기자재 목록·대표 장비에서 라벨과 DB name/slug를 맞추기 위한 정규화 */

const UNICODE_DASHES = /[‐‑‒–—−﹣－]/g;

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
  if (c1.length < 4 || c2.length < 4) return false;
  if (c1.includes(c2) || c2.includes(c1)) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  return false;
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
  const hits = equipments.filter((eq) => matchesLoosely(eq.name, label));
  if (hits.length === 1) return hits[0].slug;
  return undefined;
}
