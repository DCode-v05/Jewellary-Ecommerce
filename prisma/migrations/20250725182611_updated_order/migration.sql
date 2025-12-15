/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `addressId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `deliveryMethod` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SHIPPING', 'STORE');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ORDERED';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "isDefault",
ALTER COLUMN "country" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "addressId",
ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;
