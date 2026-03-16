"use client";

type LoadingSpinnerProps = {
  size?: number;
  className?: string;
  "aria-label"?: string;
};

export function LoadingSpinner({ size = 16, className = "", "aria-label": ariaLabel }: LoadingSpinnerProps) {
  const dimension = `${size}px`;
  return (
    <span
      className={`inline-block align-middle rounded-full border-2 border-primary/20 border-t-primary animate-spin ${className}`}
      style={{ width: dimension, height: dimension }}
      role="status"
      aria-label={ariaLabel ?? "로딩 중"}
    />
  );
}

