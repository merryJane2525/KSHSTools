import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { ReservationForm } from "./ReservationForm";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }> | { date?: string };
};

function getDefaultDate(): string {
  return new Date().toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

function getMaxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

function parseDate(dateStr: string | undefined): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return getDefaultDate();
  return dateStr;
}

/** 30일 이내로만 허용 */
function clampToAllowedRange(dateYmd: string): string {
  const min = getDefaultDate();
  const max = getMaxDate();
  if (dateYmd < min) return min;
  if (dateYmd > max) return max;
  return dateYmd;
}

export default async function NewReservationPage({ params, searchParams }: PageProps) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { slug } = await params;
  const resolvedSearch = await Promise.resolve(searchParams);
  const defaultDate = clampToAllowedRange(parseDate(resolvedSearch.date));

  const equipment = await prisma.equipment.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true },
  });
  if (!equipment) notFound();

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { username: true, studentNumber: true },
  });
  const defaultStudentName = user?.username ?? "";
  const defaultStudentNumber =
    user?.studentNumber && /^\d{4}$/.test(user.studentNumber) ? user.studentNumber : "";

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <Link
          href={`/reservations/${equipment.slug}`}
          className="text-sm text-primary/60 hover:text-primary hover:underline"
        >
          ← {equipment.name} 예약 현황
        </Link>
      </AnimateOnScroll>
      <AnimateOnScroll>
        <ReservationForm
          equipmentId={equipment.id}
          equipmentSlug={equipment.slug}
          equipmentName={equipment.name}
          defaultStudentName={defaultStudentName}
          defaultStudentNumber={defaultStudentNumber}
          defaultDate={defaultDate}
        />
      </AnimateOnScroll>
    </div>
  );
}
