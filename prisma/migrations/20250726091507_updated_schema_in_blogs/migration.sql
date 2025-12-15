/*
  Warnings:

  - You are about to drop the column `published` on the `Blogs` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Blogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Blogs" DROP COLUMN "published",
DROP COLUMN "publishedAt";
