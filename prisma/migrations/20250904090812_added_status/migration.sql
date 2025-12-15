/*
  Warnings:

  - Added the required column `orderStatus` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentStatus` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ORDERED', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'FAILED', 'SUCCESS', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderStatus" "OrderStatus" NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL;
