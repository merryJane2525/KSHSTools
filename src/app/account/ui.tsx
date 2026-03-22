"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { setAccountEmailFormAction } from "@/app/actions/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { LoadingSpinner } from "@/app/_components/LoadingSpinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending && <LoadingSpinner size={14} aria-label="저장 중" />}
      {pending ? "저장 중..." : "이메일 저장"}
    </button>
  );
}

export function AccountEmailPanel({ hasEmail }: { hasEmail: boolean }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const ok = searchParams.get("ok");

  return (
    <AnimateOnScroll>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">이메일</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          알림·계정 확인에 사용됩니다. CSV로 가입한 계정은 처음에 비어 있으며, 여기서 한 번만 등록할 수 있습니다.
        </p>

        {ok ? (
          <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200">
            이메일이 저장되었습니다.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error === "VALIDATION_ERROR" && "올바른 이메일 형식인지 확인해 주세요."}
            {error === "EMAIL_TAKEN" && "이미 사용 중인 이메일입니다."}
            {error === "ALREADY_SET" && "이미 이메일이 등록되어 있습니다."}
            {!["VALIDATION_ERROR", "EMAIL_TAKEN", "ALREADY_SET"].includes(error) && "저장에 실패했습니다."}
          </p>
        ) : null}

        {hasEmail ? (
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">이 계정에는 이미 이메일이 등록되어 있습니다.</p>
        ) : (
          <form action={setAccountEmailFormAction} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">이메일 주소</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
            <SubmitButton />
          </form>
        )}

        <div className="mt-6 text-sm">
          <Link href="/equipments" className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400">
            기자재 목록으로
          </Link>
        </div>
      </div>
    </AnimateOnScroll>
  );
}
