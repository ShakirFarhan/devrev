-- CreateEnum
CREATE TYPE "ProjectLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "is_for_sale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" "ProjectLevel",
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "technologies" TEXT[],
ADD COLUMN     "verified" BOOLEAN;
