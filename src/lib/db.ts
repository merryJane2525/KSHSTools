// web/src/lib/db.ts
// Prisma v7 "client" 엔진 + Postgres(@prisma/adapter-pg) 조합

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
import { PrismaPg } from "@prisma/adapter-pg";
// pg 타입 선언을 요구하지 않도록 require 형태로 사용
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require("pg");

// PrismaClient 타입을 동적으로 가져오기 위해 unknown 사용
// require로 가져온 PrismaClient의 타입을 추론하기 어려우므로 unknown 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
};

function createPrismaClient() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is missing");
  }
  // pg-connection-string v3 / pg v9 준비: require/prefer/verify-ca를 명시적 verify-full로 통일해 경고 제거
  if (/[?&]sslmode=(?:require|prefer|verify-ca)(?=&|$)/.test(url)) {
    url = url.replace(/sslmode=(?:require|prefer|verify-ca)/, "sslmode=verify-full");
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}