"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupFormAction } from "@/app/actions/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

function SignupSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "가입 중..." : "회원가입"}
    </button>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const returnUrl = searchParams.get("returnUrl");

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
        <AnimateOnScroll>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">회원가입</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              가입 후 로그인하여 서비스를 이용할 수 있습니다.
            </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error === "EMAIL_OR_USERNAME_TAKEN" && "이미 사용 중인 이메일 또는 username입니다."}
              {error === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
            </div>
          ) : null}

          <form action={signupFormAction} className="mt-6 space-y-4">
            {returnUrl ? <input type="hidden" name="returnUrl" value={returnUrl} /> : null}
            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">이메일</span>
              <input
                name="email"
                type="email"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">username (멘션용)</span>
              <input
                name="username"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                autoComplete="username"
                required
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">영문/숫자/언더스코어만 (예: <span className="font-mono">wonjaein_01</span>)</p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">비밀번호</span>
              <input
                name="password"
                type="password"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                autoComplete="new-password"
                required
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">최소 8자</p>
            </label>

            <SignupSubmitButton />
          </form>

            <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
              이미 계정이 있나요?{" "}
              <Link
                className="font-medium text-zinc-900 dark:text-zinc-100 underline"
                href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"}
              >
                로그인
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">로딩 중...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
