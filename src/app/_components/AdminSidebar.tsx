"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/posts", label: "게시글 관리" },
  { href: "/admin/operator-equipment", label: "기자재별 담당 오퍼" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 lg:sticky lg:top-24 lg:w-52">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          관리 메뉴
        </p>
        <nav aria-label="관리자 하위 메뉴">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
