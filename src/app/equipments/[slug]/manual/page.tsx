import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { processManualContent } from "@/lib/markdown";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

export default async function EquipmentManualPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

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
      <AnimateOnScroll>
        <div className="flex items-start justify-between gap-4">
          <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <Link className="hover:underline" href="/equipments">
              기자재
            </Link>
            {" / "}
            <Link className="hover:underline" href={`/equipments/${equipment.slug}`}>
              {equipment.name}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{equipment.name} 사용 메뉴얼</h1>
          </div>
          <div className="flex gap-2">
            {me.role === "ADMIN" && (
              <Link
                href={`/equipments/${equipment.slug}/manual/edit`}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                메뉴얼 편집
              </Link>
            )}
            <Link
              href={`/equipments/${equipment.slug}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              기자재 정보로 돌아가기
            </Link>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        {equipment.manual ? (
          <div
            className="manual-content prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-zinc-700 prose-ul:text-zinc-700 prose-ol:text-zinc-700 prose-li:text-zinc-700 prose-strong:text-zinc-900 prose-code:text-zinc-900 prose-pre:bg-zinc-50 prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg"
            dangerouslySetInnerHTML={{
              __html: processManualContent(equipment.manual, equipment.manualImages),
            }}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-2">📄</div>
            <p className="text-sm text-zinc-600">아직 등록된 메뉴얼이 없습니다.</p>
            <p className="text-xs text-zinc-500 mt-1">
              관리자가 메뉴얼을 등록하면 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>
      </AnimateOnScroll>
    </div>
  );
}
