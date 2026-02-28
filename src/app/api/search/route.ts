import { NextRequest } from "next/server";
import type { SearchDocument } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  tokenizeQuery,
  expandWithSynonyms,
  buildSnippet,
  truncate,
  isProblemQuery,
} from "@/lib/search";

const LIMIT = 20;
const MAX_SNIPPET = 120;

type DocType = "equipment" | "manual" | "qa";
type ScoredDoc = SearchDocument & { score: number };

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const typeFilter = (request.nextUrl.searchParams.get("type") ?? "all") as string;
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(20, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? String(LIMIT), 10)));

  if (q.length < 2) {
    return Response.json({
      query: q,
      type: typeFilter,
      page: 1,
      limit,
      total: 0,
      results: [],
    });
  }

  const tokens = tokenizeQuery(q);
  const expanded = expandWithSynonyms(tokens);
  const problemBoost = isProblemQuery(tokens);

  const typeWhere: { type?: DocType } =
    typeFilter !== "all" && ["equipment", "manual", "qa"].includes(typeFilter)
      ? { type: typeFilter as DocType }
      : {};

  const all = await prisma.searchDocument.findMany({
    where: {
      ...typeWhere,
      OR: [
        ...expanded.map((t) => ({ title: { contains: t, mode: "insensitive" as const } })),
        ...expanded.map((t) => ({ content: { contains: t, mode: "insensitive" as const } })),
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const scored = all.map((doc: SearchDocument) => {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    let score = 0;
    for (const t of expanded) {
      const tl = t.toLowerCase();
      if (titleLower === tl) score += 100;
      else if (titleLower.includes(tl)) score += 60;
      if (contentLower.includes(tl)) score += 15;
    }
    if (problemBoost && doc.type === "qa") score += 15;
    const daysSinceUpdate = (Date.now() - doc.updatedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceUpdate <= 30) score += Math.max(0, 10 - Math.floor(daysSinceUpdate / 3));
    return { ...doc, score };
  });

  scored.sort((a: ScoredDoc, b: ScoredDoc) => b.score - a.score);
  const total = scored.length;
  const start = (page - 1) * limit;
  const pageDocs = scored.slice(start, start + limit);

  const equipmentIds = [...new Set(pageDocs.map((d) => d.equipmentId).filter(Boolean))] as string[];
  const equipmentMap = new Map<string, string>();
  if (equipmentIds.length > 0) {
    const equipments = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true },
    });
    equipments.forEach((e) => equipmentMap.set(e.id, e.name));
  }

  const results = pageDocs.map((doc) => {
    const snippet = buildSnippet(doc.content, expanded, MAX_SNIPPET);
    const titleHighlight = doc.title;
    const contentHighlight = snippet;
    return {
      type: doc.type,
      title: doc.title,
      snippet: truncate(snippet, MAX_SNIPPET),
      url: doc.url,
      equipmentName: doc.equipmentId ? equipmentMap.get(doc.equipmentId) ?? null : null,
      updatedAt: doc.updatedAt.toISOString(),
      highlights: { title: titleHighlight, content: contentHighlight },
      score: doc.score,
    };
  });

  return Response.json({
    query: q,
    type: typeFilter,
    page,
    limit,
    total,
    results,
  });
}
