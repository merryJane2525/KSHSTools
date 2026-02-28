import type { Metadata } from "next";
import { SearchResults } from "./SearchResults";

export const metadata: Metadata = {
  title: "검색 | KSHS 심화기자재",
  description: "장비, 매뉴얼, Q&A 통합 검색",
};

type PageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }> | { q?: string; type?: string; page?: string };
};

export default async function SearchPage({ searchParams }: PageProps) {
  const resolved = await Promise.resolve(searchParams);
  const q = (resolved.q ?? "").trim().slice(0, 100);
  const type = resolved.type ?? "all";
  const page = resolved.page ?? "1";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">통합 검색</h1>
      <SearchResults initialQuery={q} initialType={type} initialPage={page} />
    </div>
  );
}
