/*
  Warnings:

  - You are about to drop the column `altText` on the `ReviewMedia` table. All the data in the column will be lost.
  - Added the required column `deliveryCharge` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gstAmount` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "additionalCharge" DECIMAL(10,2),
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "deliveryCharge" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "discountAmount" DECIMAL(10,2),
ADD COLUMN     "gstAmount" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "ReviewMedia" DROP COLUMN "altText";
