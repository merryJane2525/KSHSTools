"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createPostFormAction } from "@/app/actions/posts";

function PostSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "등록 중..." : "등록"}
    </button>
  );
}

export function NewPostForm({
  equipments,
  defaultEquipmentId,
}: {
  equipments: { id: string; name: string }[];
  defaultEquipmentId?: string;
}) {
  const searchParams = useSearchParams();
  const error = searchParams.get("post_error");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 5; // 최대 개수를 5개로 줄임 (Base64 크기 고려)
    const maxSize = 2 * 1024 * 1024; // 2MB로 제한 (Base64로 인코딩하면 약 2.7MB)

    Array.from(files)
      .slice(0, maxImages - imageUrls.length)
      .forEach((file) => {
        if (file.size > maxSize) {
          alert(`${file.name} 파일이 너무 큽니다. (최대 2MB)`);
          return;
        }

        // 이미지 압축/리사이즈 함수
        const compressImage = (file: File): Promise<string> => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // 최대 크기 1920x1920으로 제한
                const maxDimension = 1920;
                if (width > maxDimension || height > maxDimension) {
                  if (width > height) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                  } else {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                  }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  // JPEG 품질 0.85로 압축
                  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
                  resolve(compressedDataUrl);
                } else {
                  // Canvas를 사용할 수 없으면 원본 사용
                  resolve(e.target?.result as string);
                }
              };
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
          });
        };

        compressImage(file).then((base64String) => {
          setImageUrls((prev) => [...prev, base64String]);
        });
      });
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
          {error === "INVALID_EQUIPMENT" && "기자재가 올바르지 않습니다."}
          {error === "TOO_MANY_MENTIONS" && "멘션은 최대 5명까지 가능합니다."}
        </div>
      ) : null}

      <form action={createPostFormAction} className="space-y-4">
        <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />
        <label className="block">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">기자재</div>
          <select
            name="equipmentId"
            defaultValue={defaultEquipmentId ?? (equipments[0]?.id ?? "")}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            required
          >
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">제목</div>
          <input
            name="title"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            required
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">본문</div>
          <textarea
            name="body"
            rows={10}
            className="mt-1 w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            required
          />
        </label>

        <div className="space-y-2">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">이미지 첨부 (최대 5개, 각 2MB 이하, 자동 압축)</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUrls.length >= 5}
            className="rounded-xl border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이미지 선택 ({imageUrls.length}/5)
          </button>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <PostSubmitButton />
      </form>
    </div>
  );
}

