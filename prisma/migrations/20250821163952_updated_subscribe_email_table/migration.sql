/*
  Warnings:

  - You are about to alter the column `discountPct` on the `DefaultFlashSaleImages` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "DefaultBannerImages" ADD COLUMN     "body" TEXT;

-- AlterTable
ALTER TABLE "DefaultFlashSaleImages" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "body" TEXT,
ALTER COLUMN "discountPct" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "subscribedUsers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribedUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscribedUsers_email_key" ON "subscribedUsers"("email");
