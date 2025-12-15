/*
  Warnings:

  - You are about to drop the column `altText` on the `DefaultFlashSaleImages` table. All the data in the column will be lost.
  - You are about to drop the column `imagesUrl` on the `DefaultFlashSaleImages` table. All the data in the column will be lost.
  - Added the required column `imagesUrl1` to the `DefaultFlashSaleImages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imagesUrl2` to the `DefaultFlashSaleImages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imagesUrl3` to the `DefaultFlashSaleImages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imagesUrl4` to the `DefaultFlashSaleImages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DefaultFlashSaleImages" DROP COLUMN "altText",
DROP COLUMN "imagesUrl",
ADD COLUMN     "altText1" TEXT,
ADD COLUMN     "altText2" TEXT,
ADD COLUMN     "altText3" TEXT,
ADD COLUMN     "altText4" TEXT,
ADD COLUMN     "imagesUrl1" TEXT NOT NULL,
ADD COLUMN     "imagesUrl2" TEXT NOT NULL,
ADD COLUMN     "imagesUrl3" TEXT NOT NULL,
ADD COLUMN     "imagesUrl4" TEXT NOT NULL;
