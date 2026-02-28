"use client";

import { type ReactNode } from "react";
import { AnimateOnScroll } from "./AnimateOnScroll";

type PageContentProps = {
  children: ReactNode;
  /** 첫 섹션은 즉시 표시 (지연 없음) */
  immediate?: boolean;
};

/**
 * 모든 페이지 콘텐츠를 감싸서 Neuralink 스타일 애니메이션 적용
 */
export function PageContent({ children, immediate = false }: PageContentProps) {
  if (immediate) {
    // 첫 페이지처럼 즉시 표시 (stagger 애니메이션)
    return <div className="space-y-6">{children}</div>;
  }

  // 다른 페이지들은 스크롤 시 등장
  return (
    <AnimateOnScroll className="space-y-6">
      {children}
    </AnimateOnScroll>
  );
}
