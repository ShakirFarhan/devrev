/*
  Warnings:

  - Added the required column `ratings` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "ratings" INTEGER NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;
