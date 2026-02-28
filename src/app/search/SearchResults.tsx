"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const LIMIT = 20;
const TABS = [
  { value: "all", label: "전체" },
  { value: "equipment", label: "장비" },
  { value: "manual", label: "매뉴얼" },
  { value: "qa", label: "Q&A" },
];

const TYPE_LABEL: Record<string, string> = {
  equipment: "장비",
  manual: "매뉴얼",
  qa: "Q&A",
};

type SearchResultItem = {
  type: string;
  title: string;
  snippet: string;
  url: string;
  equipmentName: string | null;
  updatedAt: string;
  score: number;
};

export function SearchResults({
  initialQuery,
  initialType,
  initialPage,
}: {
  initialQuery: string;
  initialType: string;
  initialPage: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [page, setPage] = useState(parseInt(initialPage, 10) || 1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    total: number;
    results: SearchResultItem[];
  } | null>(null);

  const fetchSearch = useCallback(async () => {
    if (query.length < 2) {
      setData({ total: 0, results: [] });
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        type,
        page: String(page),
        limit: String(LIMIT),
      });
      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      setData({ total: json.total ?? 0, results: json.results ?? [] });
    } catch {
      setData({ total: 0, results: [] });
    } finally {
      setLoading(false);
    }
  }, [query, type, page]);

  useEffect(() => {
    fetchSearch();
  }, [fetchSearch]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const t = searchParams.get("type") ?? "all";
    const p = searchParams.get("page") ?? "1";
    setQuery(q);
    setType(t);
    setPage(parseInt(p, 10) || 1);
  }, [searchParams]);

  const updateUrl = useCallback(
    (updates: { q?: string; type?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.q !== undefined) params.set("q", updates.q);
      if (updates.type !== undefined) params.set("type", updates.type);
      if (updates.page !== undefined) params.set("page", String(updates.page));
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateUrl({ q: query.trim(), page: 1 })}
          placeholder="검색어 입력 (2글자 이상)"
          className="flex-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary placeholder:text-primary/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 dark:bg-primary/10"
        />
        <button
          type="button"
          onClick={() => updateUrl({ q: query.trim(), page: 1 })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          검색
        </button>
      </div>

      {query.length >= 2 && (
        <>
          <div className="flex flex-wrap gap-1 border-b border-primary/10 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setType(tab.value);
                  updateUrl({ type: tab.value, page: 1 });
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === tab.value
                    ? "bg-primary text-white"
                    : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-primary/60">검색 중...</div>
          ) : data ? (
            <>
              <p className="text-sm text-primary/60">총 {data.total}건</p>
              {data.results.length === 0 ? (
                <div className="rounded-xl border border-primary/10 bg-primary/5 py-12 text-center text-primary/60 dark:bg-[#15191d]">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.results.map((item) => (
                    <li
                      key={`${item.type}-${item.url}-${item.title}`}
                      className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[#15191d] dark:border-primary/20"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase text-primary/70">
                          {TYPE_LABEL[item.type] ?? item.type}
                        </span>
                        {item.equipmentName && (
                          <span className="text-xs text-primary/50">{item.equipmentName}</span>
                        )}
                      </div>
                      <Link href={item.url} className="mt-1 block font-bold text-primary hover:underline">
                        {item.title}
                      </Link>
                      {item.snippet && (
                        <p className="mt-1 line-clamp-2 text-sm text-primary/70">{item.snippet}</p>
                      )}
                      <Link
                        href={item.url}
                        className="mt-2 inline-block text-sm font-medium text-primary/70 hover:text-primary"
                      >
                        바로가기 →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateUrl({ page: page - 1 })}
                    className="rounded-lg border border-primary/20 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    이전
                  </button>
                  <span className="flex items-center px-2 text-sm text-primary/70">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateUrl({ page: page + 1 })}
                    className="rounded-lg border border-primary/20 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-primary/50">2글자 이상 입력 후 검색하세요.</p>
      )}
    </div>
  );
}
