-- AlterTable: CSV 일괄 등록 시 이메일 미설정 허용 (로그인 후 등록)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
