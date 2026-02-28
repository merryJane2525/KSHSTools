"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 250;
const PLACEHOLDER = "장비, 문제, 키워드 검색 (예: SEM charging, FTIR peak)";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

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

type SearchBarProps = {
  /** true: 아이콘만 보이다가 클릭 시 검색창 슬라이드 */
  expandable?: boolean;
};

export function SearchBar({ expandable = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!expandable);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreBlurUntilRef = useRef<number>(0);
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
        setExpanded(true);
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        if (expandable) setExpanded(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandable]);

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

  const handleBlur = useCallback(() => {
    if (ignoreBlurUntilRef.current > Date.now()) return;
    setTimeout(() => {
      setOpen(false);
      if (expandable) setExpanded(false);
    }, 180);
  }, [expandable]);

  const handleIconClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (expanded) {
      inputRef.current?.focus();
      return;
    }
    setExpanded(true);
    setOpen(true);
    ignoreBlurUntilRef.current = Date.now() + 250;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, [expanded]);

  if (expandable) {
    return (
      <div ref={containerRef} className="relative flex items-center shrink-0">
        <button
          type="button"
          onClick={handleIconClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="검색 열기 (Ctrl+K)"
          title="검색 (Ctrl+K)"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
        <div
          className={`overflow-hidden transition-[width] duration-200 ease-out ${expanded ? "w-52 sm:w-60" : "w-0"}`}
          style={{ minWidth: expanded ? undefined : 0 }}
        >
          <div className="relative ml-2 w-52 sm:w-60">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              className="w-full rounded-lg border border-primary/20 bg-primary/5 py-2 pl-3 pr-8 text-sm text-primary placeholder:text-primary/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 dark:bg-primary/10 dark:border-primary/20"
              aria-label="통합 검색"
              aria-expanded={open && results.length > 0}
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-primary/20 bg-white px-1.5 py-0.5 text-[10px] text-primary/60 dark:bg-primary/20 sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {open && (
          <div
            ref={listRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[80vh] overflow-auto rounded-xl border border-primary/20 bg-white shadow-lg dark:bg-[#15191d] dark:border-primary/20 min-w-[280px]"
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
