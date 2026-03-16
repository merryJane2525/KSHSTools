-- 여러 대 존재하는 기자재의 개별 장비를 구분하기 위한 필드 추가
-- 예: UV-vis A/B, 연구용 망원경 A/B/C/D 등

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "unitLabel" TEXT;

