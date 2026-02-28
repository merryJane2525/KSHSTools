import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { EditManualForm } from "./ui";

export default async function EditManualPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  if (!slug) {
    notFound();
  }

  const equipment = await prisma.equipment.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      manual: true,
      manualImages: true,
      isActive: true,
    },
  });

  if (!equipment || !equipment.isActive) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          <Link className="hover:underline" href="/equipments">
            기자재
          </Link>
          {" / "}
          <Link className="hover:underline" href={`/equipments/${equipment.slug}`}>
            {equipment.name}
          </Link>
          {" / "}
          <Link className="hover:underline" href={`/equipments/${equipment.slug}/manual`}>
            메뉴얼
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {equipment.name} 메뉴얼 편집
        </h1>
      </div>

      <EditManualForm
        equipmentId={equipment.id}
        equipmentSlug={equipment.slug}
        currentManual={equipment.manual || ""}
        existingImages={equipment.manualImages}
      />
    </div>
  );
}
