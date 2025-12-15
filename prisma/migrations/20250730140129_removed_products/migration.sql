/*
  Warnings:

  - You are about to drop the `DefaultProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DefaultProduct" DROP CONSTRAINT "DefaultProduct_productId_fkey";

-- DropTable
DROP TABLE "DefaultProduct";
