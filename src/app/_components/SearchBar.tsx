"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 250;
const PLACEHOLDER = "장비, 문제, 키워드 검색 (예: SEM charging, FTIR peak)";

type SuggestResult = {
  type: string;
  title: string;
  snippet: string;
  url: string;
  equipmentName: string | null;
  score: number;
};

const TYPE_LABEL: Record<string, string> = {
  equipment: "장비",
  manual: "매뉴얼",
  qa: "Q&A",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggest = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    timerRef.current = setTimeout(() => fetchSuggest(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, fetchSuggest]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || results.length === 0) return;
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, open, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        router.push(results[selectedIndex].url);
        setOpen(false);
        setQuery("");
      } else if (query.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
    }
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER}
          className="w-full rounded-lg border border-primary/20 bg-primary/5 py-2 pl-3 pr-9 text-sm text-primary placeholder:text-primary/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 dark:bg-primary/10 dark:border-primary/20"
          aria-label="통합 검색"
          aria-expanded={open && results.length > 0}
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-primary/20 bg-white px-1.5 py-0.5 text-[10px] text-primary/60 dark:bg-primary/20 sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[80vh] overflow-auto rounded-xl border border-primary/20 bg-white shadow-lg dark:bg-[#15191d] dark:border-primary/20"
        >
          {query.length < 2 ? (
            <div className="px-4 py-3 text-sm text-primary/50">2글자 이상 입력하세요.</div>
          ) : loading ? (
            <div className="px-4 py-6 text-center text-sm text-primary/60">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-primary/60">검색 결과 없음</div>
          ) : (
            <ul className="py-2">
              {results.map((item, index) => (
                <li key={`${item.type}-${item.url}-${index}`}>
                  <Link
                    href={item.url}
                    data-index={index}
                    className={`block px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex ? "bg-primary/10" : "hover:bg-primary/5"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="rounded border border-primary/10 bg-primary/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary/70">
                      {TYPE_LABEL[item.type] ?? item.type}
                    </span>
                    <div className="mt-1 font-bold text-primary">{item.title}</div>
                    {item.snippet && (
                      <div className="mt-0.5 line-clamp-1 text-xs text-primary/60">{item.snippet}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && (results.length > 0 || !loading) && (
            <div className="border-t border-primary/10 px-4 py-2">
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                className="text-sm font-medium text-primary/70 hover:text-primary"
              >
                전체 검색 결과 보기 →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
