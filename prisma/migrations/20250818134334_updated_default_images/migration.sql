/*
  Warnings:

  - You are about to drop the column `discountPct` on the `DefaultFlashSaleImages` table. All the data in the column will be lost.
  - You are about to drop the `DefaultHeroImages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DefaultImages` table. If the table is not empty, all the data it contains will be lost.

*/

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "from" TEXT,
ADD COLUMN     "isGift" BOOLEAN DEFAULT false,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "to" TEXT;

-- DropTable
DROP TABLE "DefaultHeroImages";

-- DropTable
DROP TABLE "DefaultImages";

-- CreateTable
CREATE TABLE "DefaultHeroBannerImages" (
    "id" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "altText" TEXT,
    "bannerHeading" TEXT,
    "bannerBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultHeroBannerImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultBannerImages" (
    "id" TEXT NOT NULL,
    "imagesUrl" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultBannerImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultShopImages" (
    "id" TEXT NOT NULL,
    "imagesUrl" TEXT NOT NULL,
    "altText" TEXT,
    "heading" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultShopImages_pkey" PRIMARY KEY ("id")
);
