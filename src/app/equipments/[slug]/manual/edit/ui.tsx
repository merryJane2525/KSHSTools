"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { updateEquipmentManualFormAction, previewManualContentAction } from "@/app/actions/equipments";

function ManualSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}

type ImageItem = {
  base64: string;
  alt: string;
};

export function EditManualForm({
  equipmentId,
  equipmentSlug,
  currentManual,
  existingImages,
}: {
  equipmentId: string;
  equipmentSlug: string;
  currentManual: string;
  existingImages?: unknown;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const manualError = searchParams.get("manual_error");

  // 기존 이미지 로드
  const loadExistingImages = (): ImageItem[] => {
    if (!existingImages) return [];
    try {
      if (Array.isArray(existingImages)) {
        return existingImages
          .filter((img): img is string => typeof img === "string")
          .map((base64, index) => ({
            base64,
            alt: `이미지 ${index + 1}`,
          }));
      }
    } catch {
      // 파싱 실패 시 무시
    }
    return [];
  };

  const [images, setImages] = useState<ImageItem[]>(loadExistingImages());
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPreview = useCallback(
    (manualText: string) => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(async () => {
        setPreviewLoading(true);
        const formData = new FormData();
        formData.set("manual", manualText);
        formData.set("manualImages", JSON.stringify(images.map((img) => img.base64)));
        const result = await previewManualContentAction(null, formData);
        setPreviewLoading(false);
        if (result.ok && "html" in result) setPreviewHtml(result.html);
        else setPreviewHtml("");
      }, 300);
    },
    [images]
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 10; // 메뉴얼은 더 많은 이미지 허용
    const maxSize = 2 * 1024 * 1024; // 2MB

    Array.from(files)
      .slice(0, maxImages - images.length)
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

                // 최대 크기 1280x1280으로 제한 (더 작게 압축)
                const maxDimension = 1280;
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
                  // JPEG 품질 0.7로 더 강하게 압축 (Base64 길이 감소)
                  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                  resolve(compressedDataUrl);
                } else {
                  resolve(e.target?.result as string);
                }
              };
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
          });
        };

        compressImage(file).then((base64String) => {
          setImages((prev) => [
            ...prev,
            { base64: base64String, alt: file.name.replace(/\.[^/.]+$/, "") },
          ]);
        });
      });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const insertMarkdownImage = (index: number) => {
    const image = images[index];
    if (!image || !textareaRef.current) return;

    // 짧은 참조 형식 사용: ![alt](img:0)
    const markdown = `![${image.alt}](img:${index})`;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    textarea.value = before + markdown + after;
    textarea.focus();
    textarea.setSelectionRange(start + markdown.length, start + markdown.length);

    // React state 업데이트를 위해 수동으로 트리거
    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);
    if (showPreview) refreshPreview(textarea.value);
  };

  const insertHtmlImage = (index: number) => {
    const image = images[index];
    if (!image || !textareaRef.current) return;

    // 짧은 참조 형식 사용: <img src="img:0" alt="alt" />
    const html = `<img src="img:${index}" alt="${image.alt}" />`;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    textarea.value = before + html + after;
    textarea.focus();
    textarea.setSelectionRange(start + html.length, start + html.length);

    // React state 업데이트를 위해 수동으로 트리거
    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);
    if (showPreview) refreshPreview(textarea.value);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      {manualError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {manualError === "FORBIDDEN" && "권한이 없습니다."}
          {manualError === "VALIDATION_ERROR" && "입력값을 확인해 주세요."}
          {manualError === "NOT_FOUND" && "기자재를 찾을 수 없습니다."}
        </div>
      ) : null}

      <form action={updateEquipmentManualFormAction} className="space-y-4">
        <input type="hidden" name="equipmentId" value={equipmentId} />
        <input type="hidden" name="equipmentSlug" value={equipmentSlug} />
        <input
          type="hidden"
          name="manualImages"
          value={JSON.stringify(images.map((img) => img.base64))}
        />

        {/* 이미지 업로드 섹션 */}
        <div className="space-y-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-4">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">이미지 첨부 (최대 10개, 각 2MB 이하, 자동 압축)</div>
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
            disabled={images.length >= 10}
            className="rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이미지 선택 ({images.length}/10)
          </button>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, index) => (
                <div key={index} className="relative group space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.base64}
                    alt={img.alt}
                    className="w-full h-32 object-cover rounded-lg border border-zinc-200"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => insertMarkdownImage(index)}
                      className="flex-1 rounded-lg border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100"
                      title="마크다운 형식으로 삽입"
                    >
                      MD
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlImage(index)}
                      className="flex-1 rounded-lg border border-green-300 bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100"
                      title="HTML 형식으로 삽입"
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">메뉴얼 내용</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            HTML 또는 마크다운 형식으로 작성할 수 있습니다. (최대 50KB)
            <br />
            이미지를 선택한 후 MD 또는 HTML 버튼을 클릭하면 커서 위치에 삽입됩니다.
          </div>
          <textarea
            ref={textareaRef}
            name="manual"
            defaultValue={currentManual}
            rows={16}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-600 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-600 resize-y bg-white dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="메뉴얼 내용을 입력하세요..."
            onChange={(e) => {
              if (showPreview) refreshPreview(e.target.value);
            }}
          />
        </label>

        {/* 미리보기 (동일 CSS 적용) */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setShowPreview((v) => !v);
              if (!showPreview && textareaRef.current) {
                refreshPreview(textareaRef.current.value);
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <span>미리보기 (저장 시 적용되는 CSS와 동일)</span>
            <span className="text-zinc-400">{showPreview ? "▲ 접기" : "▼ 펼치기"}</span>
          </button>
          {showPreview && (
            <div className="p-4 min-h-[120px] bg-white dark:bg-zinc-900">
              {previewLoading ? (
                <div className="text-sm text-zinc-500">미리보기 로딩 중...</div>
              ) : previewHtml !== null ? (
                <div
                  className="manual-content"
                  dangerouslySetInnerHTML={{ __html: previewHtml || "<p class=\"text-zinc-400\">내용이 없습니다.</p>" }}
                />
              ) : (
                <div className="text-sm text-zinc-500">내용을 입력하면 미리보기가 표시됩니다.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ManualSubmitButton />
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
