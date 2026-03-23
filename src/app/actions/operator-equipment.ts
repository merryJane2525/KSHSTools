"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const SaveSchema = z.object({
  equipmentId: z.string().uuid(),
  operatorIds: z.array(z.string().uuid()),
});

export async function saveOperatorEquipmentLinksAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/");

  const equipmentIdRaw = formData.get("equipmentId");
  const operatorIdsRaw = formData.getAll("operatorIds");
  const operatorIds = operatorIdsRaw.filter((v): v is string => typeof v === "string");

  const parsed = SaveSchema.safeParse({
    equipmentId: equipmentIdRaw,
    operatorIds,
  });
  if (!parsed.success) {
    redirect("/admin/operator-equipment?error=VALIDATION");
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
    select: { id: true },
  });
  if (!equipment) redirect("/admin/operator-equipment?error=NOT_FOUND");

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
    await tx.operatorEquipment.deleteMany({ where: { equipmentId: equipment.id } });
    if (idSet.size > 0) {
      const equipmentId = equipment.id;
      await tx.operatorEquipment.createMany({
        data: [...idSet].map((operatorId: string) => ({ operatorId, equipmentId })),
      });
    }
  });

  revalidatePath("/admin/operator-equipment");
  revalidatePath("/reservations");
  redirect(`/admin/operator-equipment?equipmentId=${encodeURIComponent(equipment.id)}&saved=1`);
}

const BulkSaveSchema = z.object({
  equipmentIds: z.array(z.string().uuid()).min(1),
  operatorIds: z.array(z.string().uuid()),
});

export async function saveOperatorEquipmentBulkAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/");

  const equipmentIdsRaw = formData.getAll("equipmentIds");
  const equipmentIds = equipmentIdsRaw.filter((v): v is string => typeof v === "string");
  const operatorIdsRaw = formData.getAll("operatorIds");
  const operatorIds = operatorIdsRaw.filter((v): v is string => typeof v === "string");

  const parsed = BulkSaveSchema.safeParse({
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
  const firstId = parsed.data.equipmentIds[0];
  redirect(
    `/admin/operator-equipment?equipmentId=${encodeURIComponent(firstId)}&saved=bulk&n=${parsed.data.equipmentIds.length}`,
  );
}
