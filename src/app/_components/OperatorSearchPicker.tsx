"use client";

import { useMemo, useRef, useState } from "react";

export type OperatorPickerOption = {
  id: string;
  username: string;
  studentName: string | null;
};

const LIST_MAX = 80;

export function OperatorSearchPicker({
  operators,
  name = "operatorId",
  label,
  hint,
  searchPlaceholder = "username 또는 이름으로 검색…",
}: {
  operators: OperatorPickerOption[];
  name?: string;
  label?: string;
  hint?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const blurCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? operators
      : operators.filter(
          (op) =>
            op.username.toLowerCase().includes(q) ||
            (op.studentName && op.studentName.toLowerCase().includes(q)),
        );
    return list.slice(0, LIST_MAX);
  }, [operators, query]);

  const selected = selectedId ? operators.find((o) => o.id === selectedId) : null;

  /** 입력이 있거나 검색창이 포커스된 경우 전체 목록(또는 필터 결과) 표시 */
  const showList = !selected && (focused || query.trim().length > 0);

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-bold text-primary/80">{label}</div> : null}
      {hint ? <p className="text-xs text-primary/60">{hint}</p> : null}
      <input type="hidden" name={name} value={selectedId ?? ""} />

      {!selected ? (
        <div className="space-y-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (blurCloseTimer.current) {
                clearTimeout(blurCloseTimer.current);
                blurCloseTimer.current = null;
              }
              setFocused(true);
            }}
            onBlur={() => {
              blurCloseTimer.current = setTimeout(() => {
                setFocused(false);
                blurCloseTimer.current = null;
              }, 120);
            }}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus:ring-1 focus:ring-primary/20 dark:border-primary/20 dark:bg-primary/5"
          />
          {showList ? (
            <ul className="max-h-48 overflow-auto rounded-lg border border-primary/15 bg-white text-sm dark:border-primary/20 dark:bg-[#15191d]">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-primary/50">검색 결과가 없습니다.</li>
              ) : (
                filtered.map((op) => (
                  <li key={op.id} className="border-b border-primary/5 last:border-0 dark:border-primary/10">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (blurCloseTimer.current) {
                          clearTimeout(blurCloseTimer.current);
                          blurCloseTimer.current = null;
                        }
                        setFocused(false);
                        setSelectedId(op.id);
                        setQuery("");
                      }}
                    >
                      <span className="font-medium">@{op.username}</span>
                      {op.studentName ? (
                        <span className="text-primary/70"> · {op.studentName}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="text-xs text-primary/50">검색창을 누르거나 입력하면 목록이 표시됩니다.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm dark:border-primary/20">
          <span className="text-primary">
            <span className="font-medium">@{selected.username}</span>
            {selected.studentName ? <span className="text-primary/70"> · {selected.studentName}</span> : null}
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-primary/70 hover:text-primary"
            onClick={() => {
              setSelectedId(null);
              setQuery("");
            }}
          >
            변경
          </button>
        </div>
      )}

    </div>
  );
}
