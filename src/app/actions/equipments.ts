"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { processManualContent } from "@/lib/markdown";

function slugify(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `eq-${Date.now()}`;
}

const CreateEquipmentSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().max(80).optional(),
});

export async function createEquipmentAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const };

  const parsed = CreateEquipmentSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);

  try {
    await prisma.equipment.create({
      data: { name: parsed.data.name, slug, isActive: true },
    });
  } catch {
    return { ok: false as const, error: "CONFLICT" as const };
  }

  revalidatePath("/equipments");
  return { ok: true as const };
}

/** Form 전용: Client에서 useActionState 대신 사용 */
export async function createEquipmentFormAction(formData: FormData) {
  const result = await createEquipmentAction(null, formData);
  if (!result.ok) redirect(`/equipments?equipment_error=${encodeURIComponent(result.error)}`);
}

const UpdateEquipmentManualSchema = z.object({
  equipmentId: z.string().uuid(),
  manual: z.string().max(50_000).optional(), // 최대 50KB 메뉴얼
  manualImages: z.string().optional(), // JSON 문자열로 전달된 이미지 배열
});

export async function updateEquipmentManualAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const };

  const parsed = UpdateEquipmentManualSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    manual: formData.get("manual") || undefined,
    manualImages: formData.get("manualImages") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
    select: { id: true, slug: true },
  });
  if (!equipment) return { ok: false as const, error: "NOT_FOUND" as const };

  // 이미지 배열 파싱
  let manualImagesArray: string[] | null = null;
  if (parsed.data.manualImages && parsed.data.manualImages.trim() !== "") {
    try {
      const parsedImages = JSON.parse(parsed.data.manualImages);
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        // 유효한 Base64 문자열만 필터링
        manualImagesArray = parsedImages
          .filter((img): img is string => typeof img === "string" && img.length > 0 && img.startsWith("data:image"))
          .slice(0, 20); // 최대 20개로 제한
        // 필터링 후 배열이 비어있으면 null로 설정
        if (manualImagesArray.length === 0) {
          manualImagesArray = null;
        }
      }
    } catch {
      // JSON 파싱 실패 시 null로 설정
      manualImagesArray = null;
    }
  }

  await prisma.equipment.update({
    where: { id: parsed.data.equipmentId },
    data: {
      manual: parsed.data.manual || null,
      manualImages: manualImagesArray ? (manualImagesArray as unknown) : null,
    },
  });

  revalidatePath(`/equipments/${equipment.slug}`);
  revalidatePath(`/equipments/${equipment.slug}/manual`);
  return { ok: true as const };
}

/** Form 전용: equipmentSlug hidden 입력 필요. Client에서 useActionState 대신 사용 */
export async function updateEquipmentManualFormAction(formData: FormData) {
  const slug = formData.get("equipmentSlug");
  const basePath = slug && typeof slug === "string" ? `/equipments/${encodeURIComponent(slug)}/manual/edit` : "/equipments";
  const result = await updateEquipmentManualAction(null, formData);
  if (!result.ok) redirect(`${basePath}?manual_error=${encodeURIComponent(result.error)}`);
  redirect(basePath);
}

/** 메뉴얼 미리보기용: 본문 + 이미지 배열을 받아 렌더링된 HTML 반환 */
const PreviewManualSchema = z.object({
  manual: z.string().max(50_000).optional(),
  manualImages: z.string().optional(),
});

export async function previewManualContentAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const, html: "" };

  const parsed = PreviewManualSchema.safeParse({
    manual: formData.get("manual") ?? "",
    manualImages: formData.get("manualImages") ?? undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const, html: "" };

  let images: string[] = [];
  if (parsed.data.manualImages && parsed.data.manualImages.trim() !== "") {
    try {
      const arr = JSON.parse(parsed.data.manualImages);
      if (Array.isArray(arr)) {
        images = arr.filter((img): img is string => typeof img === "string" && img.startsWith("data:image"));
      }
    } catch {
      /* ignore */
    }
  }

  const html = processManualContent(parsed.data.manual ?? "", images.length ? images : null);
  return { ok: true as const, html };
}
