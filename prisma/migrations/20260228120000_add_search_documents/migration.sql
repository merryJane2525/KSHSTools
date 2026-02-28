-- CreateEnum
CREATE TYPE "SearchDocumentType" AS ENUM ('equipment', 'manual', 'qa');

-- CreateTable
CREATE TABLE "SearchDocument" (
    "id" TEXT NOT NULL,
    "type" "SearchDocumentType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "popularity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchDocument_type_sourceId_key" ON "SearchDocument"("type", "sourceId");

-- CreateIndex
CREATE INDEX "SearchDocument_type_idx" ON "SearchDocument"("type");

-- CreateIndex
CREATE INDEX "SearchDocument_equipmentId_idx" ON "SearchDocument"("equipmentId");

-- CreateIndex
CREATE INDEX "SearchDocument_updatedAt_idx" ON "SearchDocument"("updatedAt");

-- CreateIndex for full-text search (Postgres)
CREATE INDEX "SearchDocument_title_content_fts_idx" ON "SearchDocument" USING gin(to_tsvector('simple', "title" || ' ' || "content"));
