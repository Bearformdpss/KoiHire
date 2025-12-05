-- AlterTable
ALTER TABLE "Project" ADD COLUMN "projectNumber" TEXT;

-- Generate project numbers for existing projects
-- Format: PRJ-{timestamp}-{random3digits}
UPDATE "Project"
SET "projectNumber" = 'PRJ-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text || '-' || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0')
WHERE "projectNumber" IS NULL;

-- Make projectNumber required and unique after populating existing records
ALTER TABLE "Project" ALTER COLUMN "projectNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectNumber_key" ON "Project"("projectNumber");
