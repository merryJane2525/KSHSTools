import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
    // Neon: migrate deploy는 풀러보다 직접 연결이 안정적(P1017). 미설정 시 url과 동일하게 사용.
    directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});

