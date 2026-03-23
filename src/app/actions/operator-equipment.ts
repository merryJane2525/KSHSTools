"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const AssignmentSchema = z.object({
  selection: z.string().min(1),
  equipmentIds: z.array(z.string().uuid()).min(1),
  operatorIds: z.array(z.string().uuid()),
});

/** 한 건 이상의 기자재에 동일 오퍼 구성을 저장합니다. (1건이면 개별, 2건 이상이면 묶음과 동일 로직) */
export async function saveOperatorEquipmentAssignmentAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/");

  const equipmentIdsRaw = formData.getAll("equipmentIds");
  const equipmentIds = equipmentIdsRaw.filter((v): v is string => typeof v === "string");
  const operatorIdsRaw = formData.getAll("operatorIds");
  const operatorIds = operatorIdsRaw.filter((v): v is string => typeof v === "string");
  const selectionRaw = formData.get("selection");

  const parsed = AssignmentSchema.safeParse({
    selection: selectionRaw,
    equipmentIds,
    operatorIds,
  });
  if (!parsed.success) {
    redirect("/admin/operator-equipment?error=VALIDATION");
  }

  const equipments = await prisma.equipment.findMany({
    where: { id: { in: parsed.data.equipmentIds } },
    select: { id: true },
  });
  if (equipments.length !== parsed.data.equipmentIds.length) {
    redirect("/admin/operator-equipment?error=NOT_FOUND");
  }

  const validOperatorIds = await prisma.user.findMany({
    where: {
      id: { in: parsed.data.operatorIds },
      status: "ACTIVE",
      role: "OPERATOR",
    },
    select: { id: true },
  });
  const idSet = new Set<string>(validOperatorIds.map((u: { id: string }) => u.id));

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const row of equipments) {
      await tx.operatorEquipment.deleteMany({ where: { equipmentId: row.id } });
      if (idSet.size > 0) {
        const equipmentId = row.id;
        await tx.operatorEquipment.createMany({
          data: [...idSet].map((operatorId: string) => ({ operatorId, equipmentId })),
        });
      }
    }
  });

  revalidatePath("/admin/operator-equipment");
  revalidatePath("/reservations");

  const n = parsed.data.equipmentIds.length;
  const sel = encodeURIComponent(parsed.data.selection);
  redirect(`/admin/operator-equipment?selection=${sel}&saved=1&n=${n}`);
}
