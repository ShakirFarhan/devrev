-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'review';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "status" SET DEFAULT 'seen';
