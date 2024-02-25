-- DropIndex
DROP INDEX "Project_id_ownerId_idx";

-- CreateIndex
CREATE INDEX "Project_ownerId_slug_idx" ON "Project"("ownerId", "slug");
