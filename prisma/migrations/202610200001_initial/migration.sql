CREATE TABLE "Challenge" (
  "id" TEXT NOT NULL,
  "seed" INTEGER NOT NULL,
  "mode" TEXT NOT NULL,
  "family" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);
