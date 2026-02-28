-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "studentNumber" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "studentNumber" TEXT;
