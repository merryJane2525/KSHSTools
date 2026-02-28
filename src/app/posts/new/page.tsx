import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NewPostForm } from "./ui";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: { equipmentId?: string };
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const equipments = await prisma.equipment.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">게시글 작성</h1>
          <p className="mt-1 text-sm text-zinc-600">본문에서 @username 형태로 멘션하면 알림이 생성됩니다 (최대 5명).</p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <NewPostForm equipments={equipments} defaultEquipmentId={searchParams.equipmentId} />
      </AnimateOnScroll>
    </div>
  );
}

