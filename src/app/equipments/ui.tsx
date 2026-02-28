"use client";

import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createEquipmentFormAction } from "@/app/actions/equipments";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "추가 중..." : "추가"}
    </button>
  );
}

export function CreateEquipmentForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("equipment_error");

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">기자재 추가 (ADMIN)</div>
      {error ? (
        <div className="mt-2 text-xs text-red-700 dark:text-red-400">
          {error === "FORBIDDEN" && "권한이 없습니다."}
          {error === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
          {error === "CONFLICT" && "이름 또는 slug가 이미 존재합니다."}
        </div>
      ) : null}

      <form action={createEquipmentFormAction} className="mt-3 space-y-2">
        <input
          name="name"
          placeholder="name (예: Camera A)"
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
          required
        />
        <input
          name="slug"
          placeholder="slug (옵션, 예: camera-a)"
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
        />
        <SubmitButton />
      </form>
    </div>
  );
}

