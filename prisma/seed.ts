/**
 * 초기 ADMIN 생성.
 * 환경 변수:
 *   ADMIN_EMAIL (필수) - 관리자로 지정할 이메일
 *   ADMIN_PASSWORD (신규 생성 시 필수) - 비밀번호
 *   ADMIN_USERNAME (선택) - username, 없으면 이메일 로컬 파트 기반 생성
 *
 * 실행: npx prisma db seed (또는 npx tsx prisma/seed.ts)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim();

function deriveUsername(email: string): string {
  const local = email.replace(/@.*$/, "").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
  return local || "admin";
}

async function main() {
  if (!ADMIN_EMAIL) {
    console.log("ADMIN_EMAIL 미설정. 시드를 건너뜁니다.");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is missing");
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        ...(ADMIN_PASSWORD
          ? { passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) }
          : {}),
      },
    });
    console.log(`기존 사용자 ${ADMIN_EMAIL}을(를) ADMIN으로 설정했습니다.`);
  } else {
    if (!ADMIN_PASSWORD) {
      throw new Error("신규 ADMIN 생성 시 ADMIN_PASSWORD가 필요합니다.");
    }
    const username = ADMIN_USERNAME || deriveUsername(ADMIN_EMAIL);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        username,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`ADMIN 계정이 생성되었습니다: ${ADMIN_EMAIL} (@${username})`);
  }

  await prisma.$disconnect();
  pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
