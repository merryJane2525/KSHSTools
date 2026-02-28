"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

type AnimateOnScrollProps = {
  children: ReactNode;
  className?: string;
  /** 초기 상태에서 적용할 클래스 (예: opacity-0 translate-y-4) */
  initialClass?: string;
  /** 보일 때 적용할 클래스 (예: opacity-100 translate-y-0) */
  visibleClass?: string;
};

/**
 * 뷰포트에 들어오면 fade-in-up 스타일 애니메이션 적용 (Neuralink 스타일)
 */
export function AnimateOnScroll({
  children,
  className = "",
  initialClass = "opacity-0 translate-y-6",
  visibleClass = "opacity-100 translate-y-0",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? visibleClass : initialClass} ${className}`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
}
