/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isDefault",
ADD COLUMN     "billingAddressId" TEXT,
ADD COLUMN     "shippingAddressId" TEXT;
