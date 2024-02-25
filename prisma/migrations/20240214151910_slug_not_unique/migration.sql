-- DropIndex
DROP INDEX "Project_slug_key";

-- CreateIndex
CREATE INDEX "Project_id_ownerId_idx" ON "Project"("id", "ownerId");
