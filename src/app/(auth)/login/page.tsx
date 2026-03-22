"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { loginFormAction } from "@/app/actions/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { LoadingSpinner } from "@/app/_components/LoadingSpinner";

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending && <LoadingSpinner size={14} aria-label="로그인 처리 중" />}
      <span>{pending ? "로그인 중..." : "로그인"}</span>
    </button>
  );
}

function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        name="password"
        type={visible ? "text" : "password"}
        className="w-full rounded-xl border border-zinc-200 py-2 pl-3 pr-11 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
        autoComplete="current-password"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        title={visible ? "숨기기" : "보기"}
      >
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const returnUrl = searchParams.get("returnUrl");

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
        <AnimateOnScroll>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">로그인</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {returnUrl
                ? "해당 콘텐츠를 보려면 로그인해 주세요."
                : "이메일 또는 username(일괄 등록 계정은 학번+이름)으로 로그인합니다."}
            </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error === "INVALID_CREDENTIALS" && "아이디/비밀번호가 올바르지 않습니다."}
              {error === "SUSPENDED" && "정지된 계정입니다."}
              {error === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
            </div>
          ) : null}

          <form action={loginFormAction} className="mt-6 space-y-4">
            {returnUrl ? <input type="hidden" name="returnUrl" value={returnUrl} /> : null}
            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">이메일 또는 username</span>
              <input
                name="identifier"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">비밀번호</span>
              <PasswordField />
            </label>

            <LoginSubmitButton />
          </form>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">로딩 중...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

