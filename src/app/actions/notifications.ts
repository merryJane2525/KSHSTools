"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const MarkReadSchema = z.object({
  id: z.string().uuid(),
});

export async function markNotificationReadAction(formData: FormData) {
  const me = await requireUser();
  const parsed = MarkReadSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  await prisma.notification.updateMany({
    where: { id: parsed.data.id, userId: me.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/notifications");
  return;
}

/** 현재 사용자의 알림 기록 전체 삭제 */
export async function clearAllNotificationsAction() {
  const me = await requireUser();

  await prisma.notification.deleteMany({
    where: { userId: me.id },
  });

  revalidatePath("/notifications");
}

