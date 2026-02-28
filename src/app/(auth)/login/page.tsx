"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { loginFormAction } from "@/app/actions/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "로그인 중..." : "로그인"}
    </button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
        <AnimateOnScroll>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">로그인</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">이메일 또는 username으로 로그인합니다.</p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error === "INVALID_CREDENTIALS" && "아이디/비밀번호가 올바르지 않습니다."}
              {error === "SUSPENDED" && "정지된 계정입니다."}
              {error === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
            </div>
          ) : null}

          <form action={loginFormAction} className="mt-6 space-y-4">
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
              <input
                name="password"
                type="password"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                autoComplete="current-password"
                required
              />
            </label>

            <LoginSubmitButton />
          </form>

            <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
              계정이 없나요? <Link className="font-medium text-zinc-900 dark:text-zinc-100 underline" href="/signup">회원가입</Link>
            </div>
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

