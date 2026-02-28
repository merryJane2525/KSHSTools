"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** 트랜잭션 콜백에서 사용하는 클라이언트 타입 ($ 메서드 제외) */
type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function parseKstDatetimeLocal(input: string): Date | null {
  // Accept "YYYY-MM-DDTHH:mm" from <input type="datetime-local">
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  // Attach explicit KST offset so server timezone doesn't matter.
  const d = new Date(`${input}:00+09:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const CreateReservationSchema = z.object({
  equipmentId: z.string().uuid(),
  startAtLocal: z.string().min(1).max(32),
  endAtLocal: z.string().min(1).max(32),
  title: z.string().max(100).optional(),
  studentNumber: z.string().max(4).optional(),
  note: z.string().max(500).optional(),
});

export async function createReservationAction(_: unknown, formData: FormData) {
  const me = await requireUser();

  const parsed = CreateReservationSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    startAtLocal: formData.get("startAt"),
    endAtLocal: formData.get("endAt"),
    title: (formData.get("title") || undefined) as string | undefined,
    studentNumber: (formData.get("studentNumber") || undefined) as string | undefined,
    note: (formData.get("note") || undefined) as string | undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const startAt = parseKstDatetimeLocal(parsed.data.startAtLocal);
  const endAt = parseKstDatetimeLocal(parsed.data.endAtLocal);
  if (!startAt || !endAt) return { ok: false as const, error: "INVALID_DATETIME" as const };
  if (endAt <= startAt) return { ok: false as const, error: "INVALID_RANGE" as const };

  const SLOT_MS = 10 * 60 * 1000; // 10분 단위
  const startMs = startAt.getTime();
  const endMs = endAt.getTime();
  if (startMs % SLOT_MS !== 0 || endMs % SLOT_MS !== 0)
    return { ok: false as const, error: "SLOT_10MIN" as const };
  const durationMs = endMs - startMs;
  if (durationMs < SLOT_MS) return { ok: false as const, error: "MIN_10MIN" as const };
  if (durationMs > 1000 * 60 * 60 * 8) return { ok: false as const, error: "TOO_LONG" as const };

  // Only allow future reservations (allow 1 minute clock skew)
  const now = Date.now();
  if (startAt.getTime() < now - 60_000) return { ok: false as const, error: "PAST_TIME" as const };

  // 30일 이내 예약만 허용 (무분별한 장비 예약 방지)
  const MAX_DAYS_AHEAD = 30;
  const maxStartMs = now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  if (startAt.getTime() > maxStartMs) return { ok: false as const, error: "TOO_FAR" as const };

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
    select: { id: true, slug: true, isActive: true },
  });
  if (!equipment || !equipment.isActive) return { ok: false as const, error: "INVALID_EQUIPMENT" as const };

  const note = parsed.data.note?.trim() ? parsed.data.note.trim() : null;
  const title = parsed.data.title?.trim() ? parsed.data.title.trim() : null;
  const rawStudentNumber = parsed.data.studentNumber?.trim() ?? "";
  const studentNumber = rawStudentNumber ? rawStudentNumber : null;
  if (studentNumber !== null && !/^\d{4}$/.test(studentNumber))
    return { ok: false as const, error: "INVALID_STUDENT_NUMBER" as const };

  // Serializable tx to reduce race conditions on overlap checks.
  // Retry on serialization failure.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await prisma.$transaction(
        async (tx: TxClient) => {
          const overlapWhere = {
            cancelledAt: null,
            status: "APPROVED" as const,
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          };

          const equipmentOverlap = await tx.reservation.findFirst({
            where: { equipmentId: equipment.id, ...overlapWhere },
            select: { id: true },
          });
          if (equipmentOverlap) return { ok: false as const, error: "EQUIPMENT_CONFLICT" as const };

          const userOverlap = await tx.reservation.findFirst({
            where: { userId: me.id, ...overlapWhere },
            select: { id: true },
          });
          if (userOverlap) return { ok: false as const, error: "USER_CONFLICT" as const };

          await tx.reservation.create({
            data: {
              equipmentId: equipment.id,
              userId: me.id,
              status: "PENDING",
              title,
              studentNumber,
              startAt,
              endAt,
              note,
            },
            select: { id: true },
          });

          return { ok: true as const };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { isolationLevel: "Serializable" as any }
      );

      if (!result.ok) return result;

      revalidatePath(`/equipments/${equipment.slug}`);
      revalidatePath("/reservations");
      revalidatePath(`/reservations/${equipment.slug}`);
      revalidatePath("/operator/reservations");
      return { ok: true as const };
    } catch (err: unknown) {
      // Prisma serialization failure code can vary by version; best-effort retry.
      const code = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : undefined;
      if (attempt < 2 && (code === "P2034" || code === "40001")) continue;
      throw err;
    }
  }

  return { ok: false as const, error: "UNKNOWN" as const };
}

/** Form 전용: (formData)만 받아서 redirect로 에러/성공 전달. Client에서 useActionState 대신 사용해 함수 직렬화 오류 방지 */
export async function createReservationFormAction(formData: FormData) {
  const slug = formData.get("equipmentSlug");
  const week = formData.get("week");
  const redirectBase = formData.get("redirectBase");
  const base =
    slug && typeof slug === "string"
      ? redirectBase === "reservations"
        ? `/reservations/${encodeURIComponent(slug)}`
        : `/equipments/${encodeURIComponent(slug)}`
      : redirectBase === "reservations"
        ? "/reservations"
        : "/equipments";
  const q = week && typeof week === "string" ? `&week=${encodeURIComponent(week)}` : "";
  const result = await createReservationAction(null, formData);
  if (!result.ok) redirect(`${base}?reservation_error=${result.error}${q}`);
  redirect(`${base}?reservation_success=1${q}`);
}

const CancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
});

export async function cancelReservationAction(_: unknown, formData: FormData) {
  const me = await requireUser();

  const parsed = CancelReservationSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.reservationId },
    select: { id: true, userId: true, cancelledAt: true, equipment: { select: { slug: true } } },
  });
  if (!reservation) return { ok: false as const, error: "NOT_FOUND" as const };
  if (reservation.cancelledAt) return { ok: true as const };
  if (reservation.userId !== me.id && me.role !== "ADMIN" && me.role !== "OPERATOR")
    return { ok: false as const, error: "FORBIDDEN" as const };

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { cancelledAt: new Date() },
  });

  revalidatePath(`/equipments/${reservation.equipment.slug}`);
  revalidatePath("/reservations");
  revalidatePath("/operator");
  revalidatePath("/operator/reservations");
  return { ok: true as const };
}

const ApproveReservationSchema = z.object({
  reservationId: z.string().uuid(),
});

export async function approveReservationAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "OPERATOR" && me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const };

  const parsed = ApproveReservationSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.reservationId },
    select: {
      id: true,
      status: true,
      cancelledAt: true,
      equipmentId: true,
      startAt: true,
      endAt: true,
      equipment: { select: { slug: true } },
    },
  });
  if (!reservation) return { ok: false as const, error: "NOT_FOUND" as const };
  if (reservation.cancelledAt) return { ok: false as const, error: "ALREADY_CANCELLED" as const };
  if (reservation.status === "APPROVED") return { ok: true as const };

  // 승인 시 같은 기자재·같은 시간대의 다른 APPROVED 예약이 있으면 충돌
  const conflict = await prisma.reservation.findFirst({
    where: {
      equipmentId: reservation.equipmentId,
      id: { not: reservation.id },
      cancelledAt: null,
      status: "APPROVED",
      startAt: { lt: reservation.endAt },
      endAt: { gt: reservation.startAt },
    },
    select: { id: true },
  });
  if (conflict) return { ok: false as const, error: "EQUIPMENT_CONFLICT" as const };

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "APPROVED" },
  });

  revalidatePath(`/equipments/${reservation.equipment.slug}`);
  revalidatePath("/reservations");
  revalidatePath("/operator");
  revalidatePath("/operator/reservations");
  return { ok: true as const };
}

const RejectReservationSchema = z.object({
  reservationId: z.string().uuid(),
});

export async function rejectReservationAction(_: unknown, formData: FormData) {
  const me = await requireUser();
  if (me.role !== "OPERATOR" && me.role !== "ADMIN") return { ok: false as const, error: "FORBIDDEN" as const };

  const parsed = RejectReservationSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION_ERROR" as const };

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.reservationId },
    select: { id: true, cancelledAt: true, equipment: { select: { slug: true } } },
  });
  if (!reservation) return { ok: false as const, error: "NOT_FOUND" as const };
  if (reservation.cancelledAt) return { ok: true as const };

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { cancelledAt: new Date() },
  });

  revalidatePath(`/equipments/${reservation.equipment.slug}`);
  revalidatePath("/reservations");
  revalidatePath("/operator");
  revalidatePath("/operator/reservations");
  return { ok: true as const };
}

/** Form 전용: (formData)만 받음. Client에서 인라인 함수 대신 사용해 직렬화 오류 방지 */
export async function cancelReservationFormAction(formData: FormData) {
  await cancelReservationAction(null, formData);
}

/** Form 전용 */
export async function approveReservationFormAction(formData: FormData) {
  const result = await approveReservationAction(null, formData);
  if (!result.ok) redirect(`/operator/reservations?error=${encodeURIComponent(result.error)}`);
}

/** Form 전용 */
export async function rejectReservationFormAction(formData: FormData) {
  const result = await rejectReservationAction(null, formData);
  if (!result.ok) redirect(`/operator/reservations?error=${encodeURIComponent(result.error)}`);
}
