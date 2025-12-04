-- CreateTable: Subcategory table already exists in database, this migration adopts it
-- We only need to add subcategoryId to services table

-- AlterTable services - Add subcategoryId column (nullable for existing services)
ALTER TABLE "services" ADD COLUMN "subcategoryId" TEXT;

-- AddForeignKey (optional, but good practice)
ALTER TABLE "services" ADD CONSTRAINT "services_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
