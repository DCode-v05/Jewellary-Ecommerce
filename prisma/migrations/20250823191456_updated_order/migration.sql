/*
  Warnings:

  - You are about to drop the column `discountAmount` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "discountAmount",
ADD COLUMN     "couponDiscount" DECIMAL(10,2);
