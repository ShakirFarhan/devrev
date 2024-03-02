-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('like', 'reply', 'message');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('seen', 'unseen');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT,
    "recipient_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
