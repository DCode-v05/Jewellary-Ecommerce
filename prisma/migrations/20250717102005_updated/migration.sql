-- CreateEnum
CREATE TYPE "ExpectationLevel" AS ENUM ('DID_NOT_MEET', 'ALMOST_MET', 'MET', 'EXCEEDED', 'GREATLY_EXCEEDED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "firstDiscover" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "expectationMet" "ExpectationLevel",
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "wouldRecommend" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "ReviewMedia" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" "MediaType",
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
