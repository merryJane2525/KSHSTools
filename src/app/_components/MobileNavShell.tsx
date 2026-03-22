"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

function MobileNavInner({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const panel =
    open && mounted ? (
      <div
        id="mobile-nav-panel"
        className="fixed inset-0 z-[100] flex flex-col bg-background lg:hidden"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="사이트 메뉴"
      >
        <div className="flex items-center justify-between border-b border-primary/10 pb-3">
          <span className="text-sm font-semibold text-primary">메뉴</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
            aria-label="메뉴 닫기"
          >
            <MenuIcon open />
          </button>
        </div>
        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain">
          {children}
        </nav>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg text-primary hover:bg-primary/10 lg:hidden"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label="메뉴 열기"
      >
        <MenuIcon open={false} />
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

/**
 * lg 미만: 햄버거로 전체 화면 메뉴. 라우트 변경 시 패널 상태를 초기화하기 위해 pathname으로 리마운트합니다.
 */
export function MobileNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <MobileNavInner key={pathname}>{children}</MobileNavInner>;
}
