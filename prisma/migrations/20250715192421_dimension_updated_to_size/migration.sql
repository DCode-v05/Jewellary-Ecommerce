/*
  Warnings:

  - You are about to drop the column `dimensions` on the `Product` table. All the data in the column will be lost.
  - Added the required column `size` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "dimensions",
ADD COLUMN     "size" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "size" DECIMAL(65,30) NOT NULL;
