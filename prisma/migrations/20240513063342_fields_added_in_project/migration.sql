/*
  Warnings:

  - Added the required column `includes` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overview` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "includes" TEXT NOT NULL,
ADD COLUMN     "overview" TEXT NOT NULL;
