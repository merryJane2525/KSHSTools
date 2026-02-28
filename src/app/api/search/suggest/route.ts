import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  tokenizeQuery,
  expandWithSynonyms,
  buildSnippet,
  truncate,
  isProblemQuery,
} from "@/lib/search";

const LIMIT_TOTAL = 8;
const LIMIT_EQUIPMENT = 2;
const LIMIT_MANUAL = 2;
const LIMIT_QA = 4;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) {
    return Response.json({ query: q, results: [] });
  }

  const tokens = tokenizeQuery(q);
  const expanded = expandWithSynonyms(tokens);
  const problemBoost = isProblemQuery(tokens);

  const all = await prisma.searchDocument.findMany({
    where: {
      OR: [
        ...expanded.map((t) => ({
          title: { contains: t, mode: "insensitive" as const },
        })),
        ...expanded.map((t) => ({
          content: { contains: t, mode: "insensitive" as const },
        })),
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const scored = all.map((doc) => {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    let score = 0;
    for (const t of expanded) {
      const tl = t.toLowerCase();
      if (titleLower === tl) score += 100;
      else if (titleLower.includes(tl)) score += 60;
      if (contentLower.includes(tl)) score += 15;
    }
    if (problemBoost && (doc.type === "qa" || doc.type === "manual")) score += 15;
    const daysSinceUpdate = (Date.now() - doc.updatedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceUpdate <= 30) score += Math.max(0, 10 - Math.floor(daysSinceUpdate / 3));
    return { ...doc, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const byType = { equipment: [] as typeof scored, manual: [] as typeof scored, qa: [] as typeof scored };
  for (const doc of scored) {
    if (byType[doc.type].length < (doc.type === "equipment" ? LIMIT_EQUIPMENT : doc.type === "manual" ? LIMIT_MANUAL : LIMIT_QA))
      byType[doc.type].push(doc);
  }

  const equipmentIds = [...new Set(scored.map((d) => d.equipmentId).filter(Boolean))] as string[];
  const equipmentMap = new Map<string, string>();
  if (equipmentIds.length > 0) {
    const equipments = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true },
    });
    equipments.forEach((e) => equipmentMap.set(e.id, e.name));
  }

  const results: Array<{
    type: string;
    title: string;
    snippet: string;
    url: string;
    equipmentName: string | null;
    score: number;
  }> = [];
  const order: Array<"equipment" | "manual" | "qa"> = ["equipment", "manual", "qa"];
  for (const type of order) {
    for (const doc of byType[type]) {
      results.push({
        type: doc.type,
        title: doc.title,
        snippet: truncate(buildSnippet(doc.content, expanded, 70), 70),
        url: doc.url,
        equipmentName: doc.equipmentId ? equipmentMap.get(doc.equipmentId) ?? null : null,
        score: doc.score,
      });
    }
    if (results.length >= LIMIT_TOTAL) break;
  }

  return Response.json({ query: q, results: results.slice(0, LIMIT_TOTAL) });
}
