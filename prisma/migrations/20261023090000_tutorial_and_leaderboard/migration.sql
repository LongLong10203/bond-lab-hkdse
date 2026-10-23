-- AlterTable
ALTER TABLE "PlayerProgress" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "tutorialCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PlayerProgress_xp_userId_idx" ON "PlayerProgress"("xp" DESC, "userId");
