import { prisma } from "@/lib/db";

export type OperatorForPicker = {
  id: string;
  username: string;
  studentName: string | null;
};

/** 게시글 담당 지정: ACTIVE OPERATOR만. 기자재에 링크가 없으면 전체 오퍼, 있으면 링크된 사용자만 */
export async function getOperatorsForPostEquipment(equipmentId: string): Promise<OperatorForPicker[]> {
  const linkCount = await prisma.operatorEquipment.count({ where: { equipmentId } });
  const base = { status: "ACTIVE" as const, role: "OPERATOR" as const };
  if (linkCount === 0) {
    return prisma.user.findMany({
      where: base,
      orderBy: { username: "asc" },
      select: { id: true, username: true, studentName: true },
    });
  }
  return prisma.user.findMany({
    where: {
      ...base,
      operatorEquipments: { some: { equipmentId } },
    },
    orderBy: { username: "asc" },
    select: { id: true, username: true, studentName: true },
  });
}

export type OperatorForReservationPicker = OperatorForPicker & { role: "OPERATOR" | "ADMIN" };

/** 예약 오퍼 지정: ACTIVE OPERATOR·ADMIN. 기자재에 링크가 없으면 전체, 있으면 링크된 사용자만 */
export async function getOperatorsForReservationEquipment(
  equipmentId: string,
): Promise<OperatorForReservationPicker[]> {
  const linkCount = await prisma.operatorEquipment.count({ where: { equipmentId } });
  const base = {
    status: "ACTIVE" as const,
    role: { in: ["OPERATOR", "ADMIN"] as const },
  };
  if (linkCount === 0) {
    return prisma.user.findMany({
      where: base,
      orderBy: { username: "asc" },
      select: { id: true, username: true, studentName: true, role: true },
    });
  }
  return prisma.user.findMany({
    where: {
      ...base,
      operatorEquipments: { some: { equipmentId } },
    },
    orderBy: { username: "asc" },
    select: { id: true, username: true, studentName: true, role: true },
  });
}

export async function isOperatorAllowedForPostEquipment(
  operatorId: string,
  equipmentId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: operatorId },
    select: { status: true, role: true },
  });
  if (!user || user.status !== "ACTIVE" || user.role !== "OPERATOR") return false;

  const linkCount = await prisma.operatorEquipment.count({ where: { equipmentId } });
  if (linkCount === 0) return true;

  const row = await prisma.operatorEquipment.findUnique({
    where: { operatorId_equipmentId: { operatorId, equipmentId } },
    select: { operatorId: true },
  });
  return !!row;
}

export async function isOperatorAllowedForReservationEquipment(
  operatorId: string,
  equipmentId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: operatorId },
    select: { status: true, role: true },
  });
  if (!user || user.status !== "ACTIVE") return false;
  if (user.role !== "OPERATOR" && user.role !== "ADMIN") return false;

  const linkCount = await prisma.operatorEquipment.count({ where: { equipmentId } });
  if (linkCount === 0) return true;

  const row = await prisma.operatorEquipment.findUnique({
    where: { operatorId_equipmentId: { operatorId, equipmentId } },
    select: { operatorId: true },
  });
  return !!row;
}

/** 해당 기자재에 오퍼–장비 링크가 하나라도 있으면 true (UI 안내용) */
export async function equipmentHasOperatorScope(equipmentId: string): Promise<boolean> {
  const n = await prisma.operatorEquipment.count({ where: { equipmentId } });
  return n > 0;
}
