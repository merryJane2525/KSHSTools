-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable: 기존 행은 APPROVED, 이후 삽입은 PENDING 기본값
ALTER TABLE "Reservation" ADD COLUMN "status" "ReservationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Reservation_equipmentId_status_idx" ON "Reservation"("equipmentId", "status");
