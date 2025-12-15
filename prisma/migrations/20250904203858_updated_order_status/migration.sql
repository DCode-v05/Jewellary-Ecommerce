-- CreateTable
CREATE TABLE "OrderCounter" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCounter_pkey" PRIMARY KEY ("id")
);
