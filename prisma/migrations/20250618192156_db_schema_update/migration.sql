/*
  Warnings:

  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'CARD', 'UPI', 'NETBANKING');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "appliesToCategoryId" TEXT,
ADD COLUMN     "appliesToProductId" TEXT,
ADD COLUMN     "maxUsage" INTEGER,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "trackingId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "discountPct" DECIMAL(10,2),
ADD COLUMN     "weight" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "profileImageUrl" TEXT;

-- AlterTable
ALTER TABLE "UserActivityLog" ADD COLUMN     "searchQuery" TEXT;
