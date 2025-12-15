/*
  Warnings:

  - A unique constraint covering the columns `[invoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "amountRefunded" DECIMAL(10,2),
ADD COLUMN     "invoiceId" TEXT;

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_invoiceId_key" ON "Order"("invoiceId");
