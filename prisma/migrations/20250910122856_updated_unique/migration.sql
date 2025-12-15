/*
  Warnings:

  - A unique constraint covering the columns `[couponId,categoryId]` on the table `CouponApplicableCategories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[couponId,productId]` on the table `CouponApplicableProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[couponId,userId]` on the table `CouponUser` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CouponApplicableCategories_couponId_key";

-- DropIndex
DROP INDEX "CouponApplicableProduct_couponId_key";

-- DropIndex
DROP INDEX "CouponUser_couponId_key";

-- CreateIndex
CREATE UNIQUE INDEX "CouponApplicableCategories_couponId_categoryId_key" ON "CouponApplicableCategories"("couponId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponApplicableProduct_couponId_productId_key" ON "CouponApplicableProduct"("couponId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUser_couponId_userId_key" ON "CouponUser"("couponId", "userId");
