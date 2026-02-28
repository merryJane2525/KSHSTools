import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";

type EquipmentItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export default async function ReservationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const equipments: EquipmentItem[] = await prisma.equipment.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true },
  });

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">기자재 예약</h1>
            <p className="mt-1 text-sm text-primary/70">예약할 기자재를 선택한 뒤 예약하기 버튼을 눌러 주세요.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary/50">가나다순</span>
            <Link
              href="/reservations/my"
              className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
            >
              내 예약 목록
            </Link>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll className="space-y-4">
        {equipments.length === 0 ? (
          <div className="rounded-xl border border-primary/10 bg-white dark:bg-[#15191d] p-6 text-sm text-primary/70 dark:border-primary/20">
            예약 가능한 기자재가 없습니다.
          </div>
        ) : (
          <ul className="space-y-4">
            {equipments.map((eq) => (
              <li
                key={eq.id}
                className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md dark:bg-[#15191d] dark:border-primary/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold tracking-tight text-primary">{eq.name}</h2>
                    {eq.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-primary/70">{eq.description}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={`/reservations/${eq.slug}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      예약하기
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AnimateOnScroll>
    </div>
  );
}
