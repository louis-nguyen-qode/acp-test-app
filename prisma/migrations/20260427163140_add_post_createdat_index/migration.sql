-- AlterTable
ALTER TABLE "posts" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "posts" ADD COLUMN "mediaUrls" TEXT;

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt" DESC);
