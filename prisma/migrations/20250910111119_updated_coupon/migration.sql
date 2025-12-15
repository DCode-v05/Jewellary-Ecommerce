/*
  Warnings:

  - You are about to drop the column `usageCountPerUser` on the `Coupon` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[couponId]` on the table `CouponApplicableCategories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[couponId]` on the table `CouponApplicableProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[couponId]` on the table `CouponUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "usageCountPerUser";

-- AlterTable
ALTER TABLE "CouponUser" ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "CouponApplicableCategories_couponId_key" ON "CouponApplicableCategories"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponApplicableProduct_couponId_key" ON "CouponApplicableProduct"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUser_couponId_key" ON "CouponUser"("couponId");
