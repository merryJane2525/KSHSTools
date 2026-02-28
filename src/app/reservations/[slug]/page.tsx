import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AnimateOnScroll } from "@/app/_components/AnimateOnScroll";
import { EquipmentReservationDetail } from "./EquipmentReservationDetail";
import { ReservationMessage } from "./ReservationMessage";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ reservation_success?: string; reservation_error?: string }> | { reservation_success?: string; reservation_error?: string };
};

type ReservationRow = {
  id: string;
  status: "PENDING" | "APPROVED";
  startAt: Date;
  endAt: Date;
  title: string | null;
  user: { username: string };
};

export default async function ReservationDetailPage({ params, searchParams }: PageProps) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { slug } = await params;
  const resolvedSearch = searchParams ? await Promise.resolve(searchParams) : {};
  const reservationSuccess = resolvedSearch.reservation_success;
  const reservationError = resolvedSearch.reservation_error;
  const equipment = await prisma.equipment.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, description: true },
  });
  if (!equipment) notFound();

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 1);
  const rangeEnd = new Date(now);
  rangeEnd.setMonth(rangeEnd.getMonth() + 6);
  const reservations = await prisma.reservation.findMany({
    where: {
      equipmentId: equipment.id,
      cancelledAt: null,
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
    },
    orderBy: { startAt: "asc" },
    take: 500,
    select: {
      id: true,
      status: true,
      startAt: true,
      endAt: true,
      title: true,
      user: { select: { username: true } },
    },
  });

  const reservationList = (reservations as ReservationRow[]).map((r) => ({
    id: r.id,
    status: r.status,
    startAtIso: r.startAt.toISOString(),
    endAtIso: r.endAt.toISOString(),
    username: r.user.username,
    title: r.title,
  }));

  const imagePath = `/equipments/${equipment.slug}.jpg`;

  return (
    <div className="space-y-6">
      <AnimateOnScroll>
        <Link href="/reservations" className="text-sm text-primary/60 hover:text-primary hover:underline">
          ← 기자재 예약 목록
        </Link>
      </AnimateOnScroll>
      {reservationSuccess || reservationError ? (
        <AnimateOnScroll>
          <ReservationMessage success={!!reservationSuccess} errorCode={reservationError ?? undefined} />
        </AnimateOnScroll>
      ) : null}
      <AnimateOnScroll>
        <EquipmentReservationDetail
          equipmentSlug={equipment.slug}
          equipmentName={equipment.name}
          equipmentDescription={equipment.description}
          reservations={reservationList}
          imagePath={imagePath}
        />
      </AnimateOnScroll>
    </div>
  );
}
