-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OperatorWorkLogStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'ADJUSTED');

-- AlterEnum (NotificationType에 새 값 추가)
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'RESERVATION_CANCELED';

-- AlterTable Reservation: 오퍼레이터 필드 추가
ALTER TABLE "Reservation" ADD COLUMN "operatorId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "operatorStatus" "OperatorStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Reservation" ADD COLUMN "operatorResponseAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN "operatorNote" TEXT;

-- AlterTable Notification: reservationId 추가
ALTER TABLE "Notification" ADD COLUMN "reservationId" TEXT;

-- CreateTable OperatorWorkLog
CREATE TABLE "OperatorWorkLog" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "workedMinutes" INTEGER NOT NULL,
    "status" "OperatorWorkLogStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorWorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorWorkLog_reservationId_key" ON "OperatorWorkLog"("reservationId");

-- CreateIndex
CREATE INDEX "OperatorWorkLog_operatorId_startAt_idx" ON "OperatorWorkLog"("operatorId", "startAt");
CREATE INDEX "OperatorWorkLog_operatorId_status_idx" ON "OperatorWorkLog"("operatorId", "status");

-- CreateIndex Reservation operator
CREATE INDEX "Reservation_operatorId_operatorStatus_idx" ON "Reservation"("operatorId", "operatorStatus");

-- CreateIndex Notification reservationId
CREATE INDEX "Notification_reservationId_idx" ON "Notification"("reservationId");

-- AddForeignKey Reservation -> User (operator)
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey OperatorWorkLog
ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
